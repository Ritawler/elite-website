-- ELITE platform — Phase 2: courses, enrollments, certificates, comments, messages
-- Run this once in Supabase Dashboard -> SQL Editor -> New query -> Run
-- (requires phase 1's schema.sql — the public.users table — to already exist)

-- ============================================================
-- courses
-- ============================================================
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  description text,
  price numeric(10, 2) not null default 0,
  discount_price numeric(10, 2),
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.courses enable row level security;

create policy "Anyone can view published courses; trainers view their own"
  on public.courses for select
  using (is_published = true or auth.uid() = trainer_id);

create policy "Trainers can create their own courses"
  on public.courses for insert
  with check (
    auth.uid() = trainer_id
    and exists (select 1 from public.users where id = auth.uid() and role = 'trainer')
  );

create policy "Trainers can update their own courses"
  on public.courses for update
  using (auth.uid() = trainer_id)
  with check (auth.uid() = trainer_id);

create policy "Trainers can delete their own courses"
  on public.courses for delete
  using (auth.uid() = trainer_id);

-- ============================================================
-- enrollments
-- ============================================================
create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  amount_paid numeric(10, 2) not null default 0,
  enrolled_at timestamptz not null default now(),
  unique (student_id, course_id)
);

alter table public.enrollments enable row level security;

create policy "Students view their own enrollments"
  on public.enrollments for select
  using (auth.uid() = student_id);

create policy "Trainers view enrollments in their own courses"
  on public.enrollments for select
  using (exists (
    select 1 from public.courses c
    where c.id = course_id and c.trainer_id = auth.uid()
  ));

create policy "Students can enroll themselves"
  on public.enrollments for insert
  with check (auth.uid() = student_id);

-- ============================================================
-- certificates
-- ============================================================
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  certificate_url text,
  issued_at timestamptz not null default now(),
  unique (student_id, course_id)
);

alter table public.certificates enable row level security;

create policy "Students view their own certificates"
  on public.certificates for select
  using (auth.uid() = student_id);

create policy "Trainers view certificates for their own courses"
  on public.certificates for select
  using (exists (
    select 1 from public.courses c
    where c.id = course_id and c.trainer_id = auth.uid()
  ));

create policy "Trainers issue certificates for their own courses"
  on public.certificates for insert
  with check (exists (
    select 1 from public.courses c
    where c.id = course_id and c.trainer_id = auth.uid()
  ));

-- ============================================================
-- comments
-- ============================================================
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  student_id uuid not null references public.users (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

create policy "Comments are visible on published or owned courses"
  on public.comments for select
  using (
    auth.uid() = student_id
    or exists (
      select 1 from public.courses c
      where c.id = course_id and (c.is_published = true or c.trainer_id = auth.uid())
    )
  );

create policy "Enrolled students can comment"
  on public.comments for insert
  with check (
    auth.uid() = student_id
    and exists (
      select 1 from public.enrollments e
      where e.student_id = auth.uid() and e.course_id = comments.course_id
    )
  );

create policy "Students can delete their own comments"
  on public.comments for delete
  using (auth.uid() = student_id);

create policy "Trainers can delete comments on their own courses"
  on public.comments for delete
  using (exists (
    select 1 from public.courses c
    where c.id = course_id and c.trainer_id = auth.uid()
  ));

-- ============================================================
-- messages (DM between a student and a trainer)
-- ============================================================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses (id) on delete set null,
  sender_id uuid not null references public.users (id) on delete cascade,
  receiver_id uuid not null references public.users (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

alter table public.messages enable row level security;

create policy "Participants can view their own messages"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Participants can send messages"
  on public.messages for insert
  with check (auth.uid() = sender_id);

create policy "Receiver can mark a message as read"
  on public.messages for update
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);
