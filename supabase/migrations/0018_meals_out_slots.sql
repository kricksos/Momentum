alter table public.profiles
  add column if not exists meals_out_slots jsonb not null default '[]'::jsonb;