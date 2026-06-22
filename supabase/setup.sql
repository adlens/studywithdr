-- Run this once in Supabase: SQL Editor → New query → Run

-- Resource metadata
create table if not exists public.pdf_resources (
  id uuid primary key default gen_random_uuid(),
  category_slug text not null,
  category_name text not null,
  title text not null,
  description text,
  exam_board text,
  exam_board_name text,
  topic_slug text,
  topic_name text,
  file_path text not null,
  created_at timestamptz not null default now()
);

alter table public.pdf_resources enable row level security;

create policy "Anyone can read resources"
  on public.pdf_resources for select
  to anon, authenticated
  using (true);

create policy "Authenticated users can add resources"
  on public.pdf_resources for insert
  to authenticated
  with check (true);

create policy "Authenticated users can delete resources"
  on public.pdf_resources for delete
  to authenticated
  using (true);

-- Storage bucket: create in Dashboard → Storage → New bucket
-- Name: pdf-resources
-- Public bucket: ON

-- Then run these storage policies:
create policy "Anyone can download PDFs"
  on storage.objects for select
  to public
  using (bucket_id = 'pdf-resources');

create policy "Authenticated users can upload PDFs"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'pdf-resources');

create policy "Authenticated users can delete PDFs"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'pdf-resources');

-- Create your admin account: Authentication → Users → Add user (your email + password)

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
