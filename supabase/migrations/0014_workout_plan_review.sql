alter table public.profiles
  add column if not exists workout_plan_review_needed boolean not null default false;