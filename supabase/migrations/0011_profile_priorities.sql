alter table public.profiles
  add column if not exists priorities jsonb not null default '[]'::jsonb;
