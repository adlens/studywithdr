-- Run this ONCE in Supabase → SQL Editor → New query → Run
-- Fixes: "Could not find the 'exam_board' column of 'pdf_resources'"

-- 1. Add missing columns to pdf_resources
alter table public.pdf_resources
  add column if not exists exam_board text,
  add column if not exists exam_board_name text,
  add column if not exists topic_slug text,
  add column if not exists topic_name text;

-- 2. Topics table (for topic folders under exam boards)
create table if not exists public.resource_topics (
  id uuid primary key default gen_random_uuid(),
  category_slug text not null,
  category_name text not null,
  exam_board text not null,
  exam_board_name text not null,
  topic_slug text not null,
  topic_name text not null,
  created_at timestamptz not null default now(),
  unique (category_slug, exam_board, topic_slug)
);

alter table public.resource_topics enable row level security;

-- 3. Policies (safe to re-run)
drop policy if exists "Anyone can read topics" on public.resource_topics;
create policy "Anyone can read topics"
  on public.resource_topics for select
  to anon, authenticated
  using (true);

drop policy if exists "Authenticated users can add topics" on public.resource_topics;
create policy "Authenticated users can add topics"
  on public.resource_topics for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated users can delete topics" on public.resource_topics;
create policy "Authenticated users can delete topics"
  on public.resource_topics for delete
  to authenticated
  using (true);

-- 4. Refresh API schema cache
notify pgrst, 'reload schema';
