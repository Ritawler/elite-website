-- ELITE platform — Phase 3: admin dashboard support
-- Run this once in Supabase Dashboard -> SQL Editor -> New query -> Run
-- (requires phase 1 + phase 2 schema to already exist)

-- Helper: checks if the calling user is an admin, without RLS recursion.
-- Must be SECURITY DEFINER so its internal SELECT bypasses RLS entirely —
-- referencing public.users directly from a policy ON public.users causes
-- "infinite recursion detected in policy" in Postgres.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from public.users where id = auth.uid() and role = 'admin');
$$;

drop policy if exists "Admins can view all users" on public.users;
create policy "Admins can view all users"
  on public.users for select
  using (public.is_admin());

drop policy if exists "Admins can view all courses" on public.courses;
create policy "Admins can view all courses"
  on public.courses for select
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

drop policy if exists "Admins can update any course" on public.courses;
create policy "Admins can update any course"
  on public.courses for update
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

drop policy if exists "Admins can delete any course" on public.courses;
create policy "Admins can delete any course"
  on public.courses for delete
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

drop policy if exists "Admins can view all enrollments" on public.enrollments;
create policy "Admins can view all enrollments"
  on public.enrollments for select
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
