alter table public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

create unique index if not exists profiles_stripe_customer_id_idx on public.profiles (stripe_customer_id) where stripe_customer_id is not null;
create unique index if not exists profiles_stripe_subscription_id_idx on public.profiles (stripe_subscription_id) where stripe_subscription_id is not null;

create table if not exists public.stripe_webhook_events (
  id text primary key,
  event_type text not null,
  processed boolean not null default false,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table public.stripe_webhook_events enable row level security;
grant all privileges on public.stripe_webhook_events to service_role;