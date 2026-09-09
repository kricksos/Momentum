create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete cascade,
  event_name text not null check (event_name in ('dashboard_viewed', 'workout_started', 'workout_completed', 'weight_logged', 'plan_generated', 'signup_completed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_name_date_idx on public.analytics_events (event_name, created_at desc);
create index if not exists analytics_events_user_date_idx on public.analytics_events (user_id, created_at desc);

alter table public.analytics_events enable row level security;

grant all privileges on public.analytics_events to service_role;
