alter table public.profiles
  add column if not exists disliked_foods jsonb not null default '[]'::jsonb,
  add column if not exists preferred_meal_styles jsonb not null default '[]'::jsonb,
  add column if not exists meals_out_per_week smallint not null default 0 check (meals_out_per_week between 0 and 14);