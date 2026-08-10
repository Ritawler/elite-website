-- ELITE platform — lesson completion + auto-issued certificates

-- 1) Track which lessons a user has finished watching.
create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);
alter table public.lesson_progress enable row level security;

drop policy if exists "Users view their own progress" on public.lesson_progress;
create policy "Users view their own progress"
  on public.lesson_progress for select
  using (auth.uid() = user_id);

-- Defense in depth: even though the app always writes this from the
-- server-side /api/lessons/[lessonId]/complete route (which re-checks
-- access via the lessons RLS select), the RLS insert policy itself also
-- requires the lesson to be one this user can actually access — same
-- exists() shape as lessons.sql's own select policy — so a direct REST
-- call can't fabricate "completed" rows for lessons never watched.
drop policy if exists "Users mark progress only for lessons they can access" on public.lesson_progress;
create policy "Users mark progress only for lessons they can access"
  on public.lesson_progress for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.lessons l
      where l.id = lesson_id
      and (
        public.is_admin()
        or exists (select 1 from public.courses c where c.id = l.course_id and c.trainer_id = auth.uid())
        or exists (select 1 from public.enrollments e where e.course_id = l.course_id and e.student_id = auth.uid())
      )
    )
  );

-- 2) Gender — asked once, gated right before a course purchase (not at
-- signup), so it also covers pre-existing accounts. Used to pick which
-- certificate template to render.
alter table public.users
  add column if not exists gender text check (gender in ('male', 'female'));

-- 3) The name a student wants printed on the certificate — asked at
-- checkout, can differ per purchase. Captured on `payments` first because
-- that's the row that survives the redirect to UPayments and back; copied
-- onto `enrollments` once the payment is confirmed (see lib/payments.js).
alter table public.payments
  add column if not exists certificate_name text;

alter table public.enrollments
  add column if not exists certificate_name text;

-- 4) Trainer signature image per course, uploaded by the admin from
-- /control-panel-2026/courses.
alter table public.courses
  add column if not exists trainer_signature_url text;

-- Public bucket so the certificate PDF (rendered server-side via
-- Puppeteer) can just load the signature by URL like any other <img>.
insert into storage.buckets (id, name, public)
values ('trainer-signatures', 'trainer-signatures', true)
on conflict (id) do nothing;

drop policy if exists "Anyone can view trainer signatures" on storage.objects;
create policy "Anyone can view trainer signatures"
  on storage.objects for select
  using (bucket_id = 'trainer-signatures');

drop policy if exists "Admins can upload trainer signatures" on storage.objects;
create policy "Admins can upload trainer signatures"
  on storage.objects for insert
  with check (bucket_id = 'trainer-signatures' and public.is_admin());

drop policy if exists "Admins can update trainer signatures" on storage.objects;
create policy "Admins can update trainer signatures"
  on storage.objects for update
  using (bucket_id = 'trainer-signatures' and public.is_admin());

-- 5) Where generated certificate PDFs are stored. Public bucket (matches
-- the existing certificates.certificate_url column, which the student
-- dashboard already renders as a plain <a href> download link) — nothing
-- ever uploads here except the server, via the service-role client in
-- /api/lessons/[lessonId]/complete, so no insert policy is needed for
-- regular users at all.
insert into storage.buckets (id, name, public)
values ('certificates', 'certificates', true)
on conflict (id) do nothing;

drop policy if exists "Anyone can view certificates" on storage.objects;
create policy "Anyone can view certificates"
  on storage.objects for select
  using (bucket_id = 'certificates');

-- Also allow the auto-issued certificate insert to happen from the
-- service-role client used in the completion route (belt-and-suspenders —
-- the service role already bypasses RLS, but keeping an explicit
-- student-can't-insert stance documented here rather than relying only on
-- the trainer-only policy from phase2_courses.sql being "accidentally"
-- sufficient).
