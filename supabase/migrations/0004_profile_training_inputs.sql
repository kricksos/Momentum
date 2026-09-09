alter table public.profiles
  add column if not exists days_per_week smallint check (days_per_week between 2 and 6),
  add column if not exists session_duration_minutes smallint check (session_duration_minutes between 30 and 180),
  add column if not exists training_place text;
