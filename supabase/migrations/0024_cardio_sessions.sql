create table if not exists public.cardio_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  session_key text not null,
  modality text not null check (modality in ('Cinta', 'Elíptica', 'Bicicleta', 'Remo', 'Caminar al aire libre')),
  duration_minutes smallint not null check (duration_minutes between 5 and 180),
  intensity text not null check (intensity in ('Suave', 'Moderada', 'Intervalos')),
  completed_on date not null default current_date,
  created_at timestamptz not null default now(),
  unique (user_id, session_key, completed_on)
);

create index if not exists cardio_sessions_user_date_idx on public.cardio_sessions (user_id, completed_on desc);

alter table public.cardio_sessions enable row level security;

create policy "Users can manage their own cardio sessions"
  on public.cardio_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant all privileges on public.cardio_sessions to service_role;