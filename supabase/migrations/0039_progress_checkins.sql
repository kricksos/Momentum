create table if not exists public.progress_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  checked_in_at date not null default current_date,
  energy_score smallint not null check (energy_score between 1 and 5),
  sleep_score smallint not null check (sleep_score between 1 and 5),
  stress_score smallint not null check (stress_score between 1 and 5),
  soreness_score smallint not null check (soreness_score between 1 and 5),
  training_adherence text not null check (training_adherence in ('low', 'medium', 'high')),
  nutrition_adherence text not null check (nutrition_adherence in ('low', 'medium', 'high')),
  pain_present boolean not null default false,
  pain_area text,
  pain_severity smallint check (pain_severity between 1 and 10),
  notes text,
  questionnaire_version text not null default '1.0',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint progress_checkins_pain_details_check check (
    (pain_present = false and pain_area is null and pain_severity is null)
    or (pain_present = true and pain_area is not null and pain_severity is not null)
  )
);

create unique index if not exists progress_checkins_user_date_idx
  on public.progress_checkins (user_id, checked_in_at);

create index if not exists progress_checkins_user_recent_idx
  on public.progress_checkins (user_id, checked_in_at desc);

alter table public.progress_checkins enable row level security;

grant all privileges on public.progress_checkins to service_role;
grant select, insert, update on public.progress_checkins to authenticated;

create policy "Users can manage their own progress check-ins"
  on public.progress_checkins for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
