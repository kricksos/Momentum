alter table public.profiles
  add column if not exists subscription_started_at timestamptz,
  add column if not exists subscription_renews_at timestamptz,
  add column if not exists subscription_auto_renew boolean not null default true;

create index if not exists profiles_subscription_renews_at_idx
  on public.profiles (subscription_renews_at);
