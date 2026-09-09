create table public.nutrition_item_selections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  meal_item_id uuid not null references public.nutrition_meal_items (id) on delete cascade,
  selected_food_id uuid not null references public.foods_catalog (id) on delete restrict,
  quantity_grams integer not null check (quantity_grams > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, meal_item_id)
);

create index nutrition_item_selections_user_idx on public.nutrition_item_selections (user_id);

alter table public.nutrition_item_selections enable row level security;

create policy "Users can manage their nutrition selections"
  on public.nutrition_item_selections for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant all privileges on public.nutrition_item_selections to service_role;
