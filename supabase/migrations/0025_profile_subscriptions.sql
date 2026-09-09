alter table public.profiles
  add column if not exists subscription_plan text not null default 'free'
    check (subscription_plan in ('free', 'monthly', 'quarterly', 'annual', 'starter', 'pro', 'elite')),
  add column if not exists subscription_status text not null default 'pending'
    check (subscription_status in ('pending', 'active', 'paused', 'cancelled'));

create index if not exists profiles_subscription_status_idx
  on public.profiles (subscription_status);
