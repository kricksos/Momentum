create table public.nutrition_meal_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  meal_id uuid not null references public.nutrition_meals (id) on delete cascade,
  completed_on date not null default current_date,
  created_at timestamptz not null default now(),
  unique (user_id, meal_id, completed_on)
);

create index nutrition_meal_completions_user_date_idx
  on public.nutrition_meal_completions (user_id, completed_on desc);

alter table public.nutrition_meal_completions enable row level security;

create policy "Users can manage their meal completions"
  on public.nutrition_meal_completions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant all privileges on public.nutrition_meal_completions to service_role;
