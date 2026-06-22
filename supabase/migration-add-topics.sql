-- Run in Supabase SQL Editor (after migration-add-exam-board.sql)

alter table public.pdf_resources
  add column if not exists topic_slug text,
  add column if not exists topic_name text;

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

create policy "Anyone can read topics"
  on public.resource_topics for select
  to anon, authenticated
  using (true);

create policy "Authenticated users can add topics"
  on public.resource_topics for insert
  to authenticated
  with check (true);

create policy "Authenticated users can delete topics"
  on public.resource_topics for delete
  to authenticated
  using (true);
