-- ELITE platform — Department tasks feature

-- 1) One manager per department, assigned by admin only
alter table public.departments add column if not exists manager_id uuid references public.users(id) on delete set null;

create or replace function public.set_department_manager(dept_id uuid, manager_user_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.users where id = auth.uid() and role = 'admin') then
    raise exception 'only admins can assign a department manager';
  end if;
  update public.departments set manager_id = manager_user_id where id = dept_id;
end;
$$;
grant execute on function public.set_department_manager(uuid, uuid) to authenticated;

-- 2) Department tasks
create table if not exists public.department_tasks (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments(id) on delete cascade,
  assigned_to uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  due_date date,
  is_done boolean not null default false,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.department_tasks enable row level security;

-- Visible to: the assignee, whoever created it (the department manager or
-- admin), and admins in general. NOT visible to other department members.
create policy "Assignee, creator, and admins can view a task"
  on public.department_tasks for select
  using (
    auth.uid() = assigned_to
    or auth.uid() = created_by
    or public.is_admin()
  );

-- Only the department's manager (or admin) can create tasks for that
-- department, and only for someone who actually belongs to it.
create policy "Department managers and admins can add tasks"
  on public.department_tasks for insert
  with check (
    (
      public.is_admin()
      or exists (
        select 1 from public.departments d
        where d.id = department_id and d.manager_id = auth.uid()
      )
    )
    and exists (
      select 1 from public.users u
      where u.id = assigned_to and u.department_id = department_tasks.department_id
    )
  );

-- Only the assignee (or admin) can update it — in practice, just the
-- is_done checkbox.
create policy "Assignee and admins can update a task"
  on public.department_tasks for update
  using (auth.uid() = assigned_to or public.is_admin())
  with check (auth.uid() = assigned_to or public.is_admin());

create policy "Admins can delete any task"
  on public.department_tasks for delete
  using (public.is_admin());
