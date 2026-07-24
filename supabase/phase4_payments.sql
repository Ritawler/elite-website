-- ELITE platform — Phase 4: payments (UPayments integration)
-- Run this once in Supabase Dashboard -> SQL Editor -> New query -> Run
-- (requires phase 1 + phase 2 + phase 3 schema to already exist)

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  order_id text not null unique,
  track_id text,
  amount numeric(10, 2) not null,
  currency text not null default 'KWD',
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payments enable row level security;

-- Students can see their own payment attempts (e.g. to retry a failed one).
create policy "Students view their own payments"
  on public.payments for select
  using (auth.uid() = student_id);

-- Students can create a pending payment row for themselves when starting a
-- checkout. Note there is deliberately NO update policy here — marking a
-- payment "paid" only ever happens server-side (via the service role key,
-- after independently verifying with UPayments), never directly from the
-- browser. Otherwise a user could just call supabase.from('payments').update
-- from their own console and grant themselves a free enrollment.
create policy "Students can create their own pending payments"
  on public.payments for insert
  with check (auth.uid() = student_id and status = 'pending');

create policy "Admins can view all payments"
  on public.payments for select
  using (public.is_admin());

-- IMPORTANT: this phase-2 testing policy let a student insert their own
-- enrollment directly (no payment check at all), which was fine before
-- payments existed but is now a way to grant yourself a free enrollment on
-- any paid course via the browser console. Enrollments are now only ever
-- created server-side, after payment is independently verified (see
-- lib/payments.js), using the service-role client — which bypasses RLS and
-- so needs no insert policy for students at all.
drop policy if exists "Students can enroll themselves" on public.enrollments;
