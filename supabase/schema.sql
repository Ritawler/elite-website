-- ELITE platform — Phase 1: users table + role handling
-- Run this once in Supabase Dashboard → SQL Editor → New query → Run

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'student' check (role in ('student', 'trainer', 'admin')),
  -- true once the user has explicitly chosen their role (email/password signup
  -- sets this immediately; Google sign-in defaults to false until they pick one)
  role_selected boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can view their own profile"
  on public.users for select
  using (auth.uid() = id);

-- Allows a user to choose their role exactly once (needed for the Google
-- sign-in flow, where the role can't be collected during the OAuth redirect).
-- Once role_selected is true, this policy's USING clause no longer matches,
-- so further attempts to change the role are blocked.
create policy "Users can set their role once"
  on public.users for update
  using (auth.uid() = id and role_selected = false)
  with check (auth.uid() = id);

-- Automatically create a row in public.users whenever someone signs up.
-- Reads "role" and "full_name" from the signUp() options.data payload.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, role, role_selected)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.raw_user_meta_data ->> 'role', 'student'),
    (new.raw_user_meta_data ->> 'role') is not null
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
