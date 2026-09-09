alter table public.cardio_preferences
  add column if not exists enabled boolean not null default true;
