alter table public.workout_exercises
  add column progression_level smallint not null default 0 check (progression_level between 0 and 4);
