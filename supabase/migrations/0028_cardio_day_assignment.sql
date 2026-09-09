alter table public.cardio_preferences
  add column if not exists workout_day_id uuid references public.workout_days (id) on delete cascade;

create index if not exists cardio_preferences_workout_day_idx
  on public.cardio_preferences (workout_day_id);

create unique index if not exists cardio_preferences_user_workout_day_idx
  on public.cardio_preferences (user_id, workout_day_id)
  where workout_day_id is not null;
