-- ELITE platform — Departments table + seed data
-- Run in Supabase Dashboard → SQL Editor → New query → Run
-- Safe to run multiple times (idempotent).

-- ── 1. Create table if it doesn't exist ─────────────────────────────────────
create table if not exists public.departments (
  id          uuid    primary key default gen_random_uuid(),
  name        text    not null unique,
  manager_id  uuid    references public.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ── 2. Add is_director_dept flag (idempotent) ────────────────────────────────
-- Members of a director-dept can assign tasks to staff in ANY department.
alter table public.departments
  add column if not exists is_director_dept boolean not null default false;

-- ── 3. Enable RLS (no-op if already enabled) ────────────────────────────────
alter table public.departments enable row level security;

-- ── 4. RLS policies on departments ──────────────────────────────────────────
-- All authenticated users can read departments (needed for dropdowns).
drop policy if exists "Authenticated users can view departments" on public.departments;
create policy "Authenticated users can view departments"
  on public.departments for select
  using (auth.role() = 'authenticated');

-- Only admins can insert/update/delete departments.
drop policy if exists "Admins can manage departments" on public.departments;
create policy "Admins can manage departments"
  on public.departments for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── 5. Seed the 6 departments ────────────────────────────────────────────────
-- ON CONFLICT (name) → keep existing row but sync the is_director_dept flag.
insert into public.departments (name, is_director_dept) values
  ('المدير/الرئيس',      true),
  ('الموارد البشرية',    false),
  ('الأرشفة',            false),
  ('العلاقات العامة',    false),
  ('الإعلامية',          false),
  ('التدريب والتطوير',   false)
on conflict (name) do update
  set is_director_dept = excluded.is_director_dept;

-- ── 6. Update INSERT policy on department_tasks ──────────────────────────────
-- Old policy only allowed the exact department manager to assign tasks inside
-- their department. New rules:
--   • Admin → always allowed.
--   • Member of any is_director_dept department → can assign to any staff
--     member in any department (cross-department authority).
--   • Manager of a regular department → can only assign to members of
--     their own department (unchanged behaviour).
drop policy if exists "Department managers and admins can add tasks"
  on public.department_tasks;

create policy "Department managers and admins can add tasks"
  on public.department_tasks for insert
  with check (
    -- Admins: unrestricted
    public.is_admin()

    -- Director-dept members: cross-department assignment
    or (
      exists (
        select 1
        from public.users    u
        join public.departments d on d.id = u.department_id
        where u.id = auth.uid()
          and d.is_director_dept = true
      )
      -- assigned_to must be an actual staff member
      and exists (
        select 1 from public.users u2
        where u2.id = assigned_to
          and u2.role = 'staff'
      )
    )

    -- Regular department manager: own department members only
    or (
      exists (
        select 1 from public.departments d
        where d.id = department_id
          and d.manager_id = auth.uid()
      )
      and exists (
        select 1 from public.users u
        where u.id = assigned_to
          and u.department_id = department_tasks.department_id
      )
    )
  );
