create table if not exists public.cardio_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  session_key text not null,
  modality text not null check (modality in ('Cinta', 'Elíptica', 'Bicicleta', 'Remo', 'Caminar al aire libre')),
  duration_minutes smallint not null check (duration_minutes between 5 and 180),
  intensity text not null check (intensity in ('Suave', 'Moderada', 'Intervalos')),
  updated_at timestamptz not null default now(),
  unique (user_id, session_key)
);

create index if not exists cardio_preferences_user_idx on public.cardio_preferences (user_id);

alter table public.cardio_preferences enable row level security;

create policy "Users can manage their own cardio preferences"
  on public.cardio_preferences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant all privileges on public.cardio_preferences to service_role;
