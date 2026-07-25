-- ELITE platform — Monthly staff evaluations

create table if not exists public.staff_evaluations (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.users(id) on delete cascade,
  period_month date not null, -- always the 1st of the month, e.g. 2026-07-01 = July 2026
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (staff_id, period_month)
);
alter table public.staff_evaluations enable row level security;

-- Only admins can add an evaluation, and only for an actual staff member.
create policy "Admins can add evaluations"
  on public.staff_evaluations for insert
  with check (
    public.is_admin()
    and exists (select 1 from public.users u where u.id = staff_id and u.role = 'staff')
  );

-- The evaluated staff member sees only their own evaluations; admins see all.
create policy "Staff member and admins can view evaluations"
  on public.staff_evaluations for select
  using (auth.uid() = staff_id or public.is_admin());

-- Only admins can edit or delete — the staff member never can, even their own.
create policy "Admins can update evaluations"
  on public.staff_evaluations for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete evaluations"
  on public.staff_evaluations for delete
  using (public.is_admin());
