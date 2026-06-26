-- Run in Supabase SQL Editor to align existing uploads with the new subject → level taxonomy.
-- Safe to run more than once.

update public.pdf_resources
set category_slug = 'maths-gcse', category_name = 'Maths · GCSE'
where category_slug = 'gcse-maths';

update public.pdf_resources
set category_slug = 'chemistry-gcse', category_name = 'Chemistry · GCSE'
where category_slug = 'chemistry';

update public.pdf_resources
set category_slug = 'maths-a-level', category_name = 'Maths · A-Level'
where category_slug = 'a-level-maths';

update public.pdf_resources
set category_slug = 'physics-a-level', category_name = 'Physics · A-Level'
where category_slug = 'a-level-physics';

update public.pdf_resources
set category_slug = 'chemistry-a-level', category_name = 'Chemistry · A-Level'
where category_slug = 'a-level-chemistry';

update public.pdf_resources
set category_slug = 'maths-university', category_name = 'Maths · University'
where category_slug = 'university';

update public.pdf_resources
set category_slug = 'maths-drills', category_name = 'Maths · General Maths Drills'
where category_slug = 'general-maths-drills';

update public.resource_topics
set category_slug = 'maths-gcse', category_name = 'Maths · GCSE'
where category_slug = 'gcse-maths';

update public.resource_topics
set category_slug = 'chemistry-gcse', category_name = 'Chemistry · GCSE'
where category_slug = 'chemistry';

update public.resource_topics
set category_slug = 'maths-a-level', category_name = 'Maths · A-Level'
where category_slug = 'a-level-maths';

update public.resource_topics
set category_slug = 'physics-a-level', category_name = 'Physics · A-Level'
where category_slug = 'a-level-physics';

update public.resource_topics
set category_slug = 'chemistry-a-level', category_name = 'Chemistry · A-Level'
where category_slug = 'a-level-chemistry';

update public.resource_topics
set category_slug = 'maths-university', category_name = 'Maths · University'
where category_slug = 'university';

update public.resource_topics
set category_slug = 'maths-drills', category_name = 'Maths · General Maths Drills'
where category_slug = 'general-maths-drills';
