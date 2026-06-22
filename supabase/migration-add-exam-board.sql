-- Run this in Supabase SQL Editor if you already created pdf_resources earlier

alter table public.pdf_resources
  add column if not exists exam_board text,
  add column if not exists exam_board_name text;
