alter table public.exercises
  add column if not exists slug text,
  add column if not exists image_start_url text,
  add column if not exists image_end_url text,
  add column if not exists media_source text,
  add column if not exists media_license text,
  add column if not exists media_author text;

create unique index if not exists exercises_slug_idx on public.exercises (slug) where slug is not null;
create index if not exists exercises_media_source_idx on public.exercises (media_source);