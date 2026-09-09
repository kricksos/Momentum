alter table public.profiles
  add column if not exists workout_planning_mode text not null default 'auto' check (workout_planning_mode in ('auto', 'manual'));