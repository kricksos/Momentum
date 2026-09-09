create extension if not exists "pgcrypto";

create type public.onboarding_session_status as enum ('active', 'completed', 'expired', 'converted');
create type public.plan_generation_run_type as enum ('initial_generation', 'progress_adjustment', 'manual_regeneration');
create type public.plan_generation_run_status as enum ('pending', 'completed', 'failed');
create type public.goal_status as enum ('active', 'completed', 'cancelled');
create type public.workout_plan_version_reason as enum ('onboarding', 'progress_adjustment', 'goal_change', 'equipment_change', 'injury_change');
create type public.activity_type as enum ('login', 'workout', 'weight', 'measurement');
create type public.consent_type as enum ('privacy_policy', 'terms_conditions', 'analytics', 'health_data');
create type public.audit_action as enum ('create', 'update', 'delete');

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  name text not null,
  sex text not null check (sex in ('male', 'female')),
  age smallint not null check (age between 18 and 120),
  height_cm numeric(5, 2) not null check (height_cm between 80 and 250),
  current_weight_kg numeric(6, 2) not null check (current_weight_kg between 20 and 400),
  target_weight_kg numeric(6, 2) check (target_weight_kg between 20 and 400),
  primary_goal text not null,
  experience text not null,
  daily_activity text not null,
  sleep_hours numeric(3, 1) not null check (sleep_hours between 0 and 24),
  sleep_quality text not null,
  stress_level text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.onboarding_sessions (
  id uuid primary key default gen_random_uuid(),
  session_token_hash text not null unique,
  status public.onboarding_session_status not null default 'active',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  converted_user_id uuid references public.users (id) on delete set null
);

create table public.onboarding_answers (
  id uuid primary key default gen_random_uuid(),
  onboarding_session_id uuid not null references public.onboarding_sessions (id) on delete cascade,
  question_key text not null,
  answer_value jsonb not null,
  answer_type text not null check (answer_type in ('number', 'single_select', 'multi_select', 'text', 'date', 'boolean')),
  question_version text not null default '1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (onboarding_session_id, question_key)
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  description text,
  target_date date,
  status public.goal_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.equipment (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.user_equipment (
  user_id uuid not null references public.users (id) on delete cascade,
  equipment_id uuid not null references public.equipment (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (user_id, equipment_id)
);

create table public.muscle_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.user_priorities (
  user_id uuid not null references public.users (id) on delete cascade,
  muscle_group_id uuid not null references public.muscle_groups (id) on delete restrict,
  priority smallint not null check (priority between 1 and 3),
  created_at timestamptz not null default now(),
  primary key (user_id, muscle_group_id)
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null,
  category text not null,
  difficulty text not null,
  equipment_required jsonb not null default '[]'::jsonb,
  restrictions jsonb not null default '[]'::jsonb,
  alternatives jsonb not null default '[]'::jsonb,
  muscle_groups jsonb not null default '[]'::jsonb,
  video_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.plan_generation_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  run_type public.plan_generation_run_type not null,
  status public.plan_generation_run_status not null default 'pending',
  input_snapshot jsonb not null default '{}'::jsonb,
  engine_version text not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  error_message text
);

create table public.plan_rule_decisions (
  id uuid primary key default gen_random_uuid(),
  generation_run_id uuid not null references public.plan_generation_runs (id) on delete cascade,
  rule_name text not null,
  input_data jsonb not null default '{}'::jsonb,
  output_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workout_plan_versions (
  id uuid primary key default gen_random_uuid(),
  workout_plan_id uuid not null references public.workout_plans (id) on delete cascade,
  generation_run_id uuid not null references public.plan_generation_runs (id) on delete restrict,
  version_number integer not null check (version_number > 0),
  profile_snapshot jsonb not null default '{}'::jsonb,
  reason public.workout_plan_version_reason not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (workout_plan_id, version_number)
);

create unique index workout_plan_one_active_version_idx
  on public.workout_plan_versions (workout_plan_id)
  where active = true;

create table public.workout_days (
  id uuid primary key default gen_random_uuid(),
  workout_plan_version_id uuid not null references public.workout_plan_versions (id) on delete cascade,
  name text not null,
  order_number smallint not null check (order_number > 0),
  created_at timestamptz not null default now(),
  unique (workout_plan_version_id, order_number)
);

create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_day_id uuid not null references public.workout_days (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  sets smallint not null check (sets between 1 and 20),
  repetitions text not null,
  rest_seconds smallint not null check (rest_seconds between 0 and 900),
  order_number smallint not null check (order_number > 0),
  created_at timestamptz not null default now(),
  unique (workout_day_id, order_number)
);

create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  workout_day_id uuid references public.workout_days (id) on delete set null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_minutes smallint check (duration_minutes between 0 and 600),
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.exercise_logs (
  id uuid primary key default gen_random_uuid(),
  workout_session_id uuid not null references public.workout_sessions (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  weight_kg numeric(7, 2) check (weight_kg >= 0),
  repetitions smallint not null check (repetitions >= 0),
  set_number smallint not null check (set_number > 0),
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (workout_session_id, exercise_id, set_number)
);

create table public.nutrition_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.nutrition_plan_versions (
  id uuid primary key default gen_random_uuid(),
  nutrition_plan_id uuid not null references public.nutrition_plans (id) on delete cascade,
  generation_run_id uuid not null references public.plan_generation_runs (id) on delete restrict,
  version_number integer not null check (version_number > 0),
  profile_snapshot jsonb not null default '{}'::jsonb,
  calories integer not null check (calories > 0),
  protein_grams numeric(7, 2) not null check (protein_grams >= 0),
  carbs_grams numeric(7, 2) not null check (carbs_grams >= 0),
  fats_grams numeric(7, 2) not null check (fats_grams >= 0),
  reason public.workout_plan_version_reason not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (nutrition_plan_id, version_number)
);

create unique index nutrition_plan_one_active_version_idx
  on public.nutrition_plan_versions (nutrition_plan_id)
  where active = true;

create table public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  measured_at date not null default current_date,
  weight_kg numeric(6, 2) not null check (weight_kg between 20 and 400),
  waist_cm numeric(6, 2) check (waist_cm > 0),
  chest_cm numeric(6, 2) check (chest_cm > 0),
  arm_cm numeric(6, 2) check (arm_cm > 0),
  thigh_cm numeric(6, 2) check (thigh_cm > 0),
  body_fat_percentage numeric(5, 2) check (body_fat_percentage between 0 and 100),
  created_at timestamptz not null default now()
);

create table public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  consent_type public.consent_type not null,
  accepted boolean not null,
  document_version text not null,
  language text not null default 'es',
  accepted_at timestamptz not null default now(),
  withdrawn_at timestamptz
);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  activity_type public.activity_type not null,
  entity_type text,
  entity_id uuid,
  activity_date date not null default current_date,
  created_at timestamptz not null default now()
);

create unique index activity_event_once_per_entity_idx
  on public.activity_events (user_id, activity_type, entity_type, entity_id, activity_date)
  where entity_id is not null;

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action public.audit_action not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index onboarding_sessions_expires_at_idx on public.onboarding_sessions (expires_at);
create index onboarding_answers_session_idx on public.onboarding_answers (onboarding_session_id);
create index goals_user_idx on public.goals (user_id);
create index generation_runs_user_created_idx on public.plan_generation_runs (user_id, created_at desc);
create index plan_rule_decisions_run_idx on public.plan_rule_decisions (generation_run_id);
create index workout_plans_user_idx on public.workout_plans (user_id);
create index workout_sessions_user_started_idx on public.workout_sessions (user_id, started_at desc);
create index body_measurements_user_date_idx on public.body_measurements (user_id, measured_at desc);
create index user_consents_user_type_idx on public.user_consents (user_id, consent_type);
create index activity_events_user_date_idx on public.activity_events (user_id, activity_date desc);
create index audit_events_user_created_idx on public.audit_events (user_id, created_at desc);

alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.onboarding_sessions enable row level security;
alter table public.onboarding_answers enable row level security;
alter table public.goals enable row level security;
alter table public.user_equipment enable row level security;
alter table public.user_priorities enable row level security;
alter table public.plan_generation_runs enable row level security;
alter table public.plan_rule_decisions enable row level security;
alter table public.workout_plans enable row level security;
alter table public.workout_plan_versions enable row level security;
alter table public.workout_days enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.exercise_logs enable row level security;
alter table public.nutrition_plans enable row level security;
alter table public.nutrition_plan_versions enable row level security;
alter table public.body_measurements enable row level security;
alter table public.user_consents enable row level security;
alter table public.activity_events enable row level security;
alter table public.audit_events enable row level security;

create policy "Users can view their own user record"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update their own user record"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can manage their own profile"
  on public.profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their own onboarding answers"
  on public.onboarding_answers for all
  using (
    exists (
      select 1 from public.onboarding_sessions
      where onboarding_sessions.id = onboarding_answers.onboarding_session_id
      and onboarding_sessions.converted_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.onboarding_sessions
      where onboarding_sessions.id = onboarding_answers.onboarding_session_id
      and onboarding_sessions.converted_user_id = auth.uid()
    )
  );

create policy "Users can view their converted onboarding sessions"
  on public.onboarding_sessions for select
  using (converted_user_id = auth.uid());

create policy "Users can manage their own goals"
  on public.goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their own equipment"
  on public.user_equipment for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their own priorities"
  on public.user_priorities for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can view their own generation runs"
  on public.plan_generation_runs for select
  using (auth.uid() = user_id);

create policy "Users can view decisions from their generation runs"
  on public.plan_rule_decisions for select
  using (
    exists (
      select 1 from public.plan_generation_runs
      where plan_generation_runs.id = plan_rule_decisions.generation_run_id
      and plan_generation_runs.user_id = auth.uid()
    )
  );

create policy "Users can manage their own workout plans"
  on public.workout_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can view their workout plan versions"
  on public.workout_plan_versions for select
  using (
    exists (
      select 1 from public.workout_plans
      where workout_plans.id = workout_plan_versions.workout_plan_id
      and workout_plans.user_id = auth.uid()
    )
  );

create policy "Users can view their workout days"
  on public.workout_days for select
  using (
    exists (
      select 1 from public.workout_plan_versions
      join public.workout_plans on workout_plans.id = workout_plan_versions.workout_plan_id
      where workout_plan_versions.id = workout_days.workout_plan_version_id
      and workout_plans.user_id = auth.uid()
    )
  );

create policy "Users can view their workout exercises"
  on public.workout_exercises for select
  using (
    exists (
      select 1
      from public.workout_days
      join public.workout_plan_versions on workout_plan_versions.id = workout_days.workout_plan_version_id
      join public.workout_plans on workout_plans.id = workout_plan_versions.workout_plan_id
      where workout_days.id = workout_exercises.workout_day_id
      and workout_plans.user_id = auth.uid()
    )
  );

create policy "Users can manage their own workout sessions"
  on public.workout_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their own exercise logs"
  on public.exercise_logs for all
  using (
    exists (
      select 1 from public.workout_sessions
      where workout_sessions.id = exercise_logs.workout_session_id
      and workout_sessions.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workout_sessions
      where workout_sessions.id = exercise_logs.workout_session_id
      and workout_sessions.user_id = auth.uid()
    )
  );

create policy "Users can manage their own nutrition plans"
  on public.nutrition_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can view their nutrition plan versions"
  on public.nutrition_plan_versions for select
  using (
    exists (
      select 1 from public.nutrition_plans
      where nutrition_plans.id = nutrition_plan_versions.nutrition_plan_id
      and nutrition_plans.user_id = auth.uid()
    )
  );

create policy "Users can manage their own measurements"
  on public.body_measurements for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their own consents"
  on public.user_consents for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their own activity events"
  on public.activity_events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can view their own audit events"
  on public.audit_events for select
  using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email, updated_at = now();
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
