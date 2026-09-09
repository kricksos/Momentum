alter table public.workout_plans
  add column if not exists source text not null default 'auto' check (source in ('auto', 'manual', 'copied'));

create table if not exists public.manual_workout_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null default 'Mi rutina',
  source text not null check (source in ('manual', 'copied')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.manual_workout_draft_days (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references public.manual_workout_drafts (id) on delete cascade,
  name text not null,
  order_number smallint not null check (order_number > 0),
  created_at timestamptz not null default now(),
  unique (draft_id, order_number)
);

create table if not exists public.manual_workout_draft_exercises (
  id uuid primary key default gen_random_uuid(),
  draft_day_id uuid not null references public.manual_workout_draft_days (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  sets smallint not null check (sets between 1 and 20),
  repetitions text not null,
  rest_seconds smallint not null check (rest_seconds between 0 and 900),
  order_number smallint not null check (order_number > 0),
  created_at timestamptz not null default now(),
  unique (draft_day_id, order_number)
);

create index if not exists manual_workout_drafts_user_idx on public.manual_workout_drafts (user_id, updated_at desc);
create index if not exists manual_workout_draft_days_draft_idx on public.manual_workout_draft_days (draft_id, order_number);
create index if not exists manual_workout_draft_exercises_day_idx on public.manual_workout_draft_exercises (draft_day_id, order_number);

alter table public.manual_workout_drafts enable row level security;
alter table public.manual_workout_draft_days enable row level security;
alter table public.manual_workout_draft_exercises enable row level security;

grant all privileges on public.manual_workout_drafts, public.manual_workout_draft_days, public.manual_workout_draft_exercises to service_role;