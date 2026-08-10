-- ELITE — member_topics table (v2 schema)
-- Drops old table (body/file_url/file_name schema) and recreates with:
--   id, title, author_name, published_at, pdf_url, created_at
-- Also creates a PUBLIC Supabase Storage bucket for PDF files.
-- Safe to run multiple times (idempotent).

-- ── 1. Drop old table ─────────────────────────────────────────────────────────
drop table if exists public.member_topics;

-- ── 2. Create new table ───────────────────────────────────────────────────────
create table public.member_topics (
  id           uuid        primary key default gen_random_uuid(),
  title        text        not null,
  author_name  text        not null,
  published_at date        not null default current_date,
  pdf_url      text        not null,
  created_at   timestamptz not null default now()
);

-- ── 3. Enable RLS ─────────────────────────────────────────────────────────────
alter table public.member_topics enable row level security;

-- ── 4. RLS policies ──────────────────────────────────────────────────────────
-- Anyone (anonymous or authenticated) can read topics — it's a public section.
drop policy if exists "Anyone can read member_topics" on public.member_topics;
create policy "Anyone can read member_topics"
  on public.member_topics for select
  using (true);

-- Only admins can insert / update / delete.
drop policy if exists "Admins can manage member_topics" on public.member_topics;
create policy "Admins can manage member_topics"
  on public.member_topics for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── 5. Storage bucket ─────────────────────────────────────────────────────────
-- Create a PUBLIC bucket so PDF URLs are accessible to any visitor.
insert into storage.buckets (id, name, public)
values ('member-topics', 'member-topics', true)
on conflict (id) do update set public = true;

-- Drop then recreate storage policies to avoid duplicates.
drop policy if exists "Public read for member-topics bucket" on storage.objects;
create policy "Public read for member-topics bucket"
  on storage.objects for select
  using (bucket_id = 'member-topics');

drop policy if exists "Admins can upload to member-topics bucket" on storage.objects;
create policy "Admins can upload to member-topics bucket"
  on storage.objects for insert
  with check (
    bucket_id = 'member-topics'
    and public.is_admin()
  );

drop policy if exists "Admins can delete from member-topics bucket" on storage.objects;
create policy "Admins can delete from member-topics bucket"
  on storage.objects for delete
  using (
    bucket_id = 'member-topics'
    and public.is_admin()
  );
