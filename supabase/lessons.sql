-- ELITE platform — Course lessons (Bunny Stream video)
--
-- bunny_video_id is the Bunny Stream video GUID. It is NOT a secret by
-- itself — the actual protection is the short-lived signed playback token
-- computed server-side in src/lib/bunny.js (see /api/lessons/[lessonId]/playback),
-- using Bunny's "Token Authentication" security key, which never reaches
-- the browser or this table.

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  bunny_video_id text not null,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.lessons enable row level security;

-- Visible to: an enrolled student, the course's own trainer, and admins.
create policy "Enrolled students, course trainer, and admins can view lessons"
  on public.lessons for select
  using (
    public.is_admin()
    or exists (select 1 from public.courses c where c.id = course_id and c.trainer_id = auth.uid())
    or exists (
      select 1 from public.enrollments e
      where e.course_id = lessons.course_id and e.student_id = auth.uid()
    )
  );

-- Only admins add/edit/delete lessons — not even the course's own trainer.
create policy "Admins can add lessons"
  on public.lessons for insert
  with check (public.is_admin());

create policy "Admins can update lessons"
  on public.lessons for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete lessons"
  on public.lessons for delete
  using (public.is_admin());
