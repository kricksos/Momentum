alter table public.onboarding_sessions
  add column if not exists auth_user_id uuid references auth.users (id) on delete cascade;

create index if not exists onboarding_sessions_auth_user_id_idx
  on public.onboarding_sessions (auth_user_id, status, started_at desc);