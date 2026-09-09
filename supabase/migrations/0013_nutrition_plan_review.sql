alter table public.profiles
  add column if not exists nutrition_plan_review_needed boolean not null default false;