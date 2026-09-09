alter table public.profiles
  add column if not exists restrictions jsonb not null default '[]'::jsonb;
