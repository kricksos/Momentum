create table public.foods_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null,
  calories_per_100g numeric(7, 2) not null check (calories_per_100g >= 0),
  protein_per_100g numeric(7, 2) not null check (protein_per_100g >= 0),
  carbs_per_100g numeric(7, 2) not null check (carbs_per_100g >= 0),
  fats_per_100g numeric(7, 2) not null check (fats_per_100g >= 0),
  allergens jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.nutrition_meals (
  id uuid primary key default gen_random_uuid(),
  nutrition_plan_version_id uuid not null references public.nutrition_plan_versions (id) on delete cascade,
  name text not null,
  meal_order smallint not null check (meal_order > 0),
  suggested_time time,
  target_calories integer not null check (target_calories > 0),
  created_at timestamptz not null default now(),
  unique (nutrition_plan_version_id, meal_order)
);

create table public.nutrition_meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.nutrition_meals (id) on delete cascade,
  food_id uuid not null references public.foods_catalog (id) on delete restrict,
  quantity_grams integer not null check (quantity_grams > 0),
  role text not null check (role in ('protein', 'carbohydrate', 'fat', 'vegetable', 'fruit', 'dairy')),
  is_alternative boolean not null default false,
  alternative_group text,
  created_at timestamptz not null default now()
);

create index foods_catalog_category_idx on public.foods_catalog (category);
create index nutrition_meals_version_idx on public.nutrition_meals (nutrition_plan_version_id, meal_order);
create index nutrition_meal_items_meal_idx on public.nutrition_meal_items (meal_id);

alter table public.foods_catalog enable row level security;
alter table public.nutrition_meals enable row level security;
alter table public.nutrition_meal_items enable row level security;

create policy "Authenticated users can view food catalog"
  on public.foods_catalog for select
  to authenticated
  using (true);

create policy "Users can view their nutrition meals"
  on public.nutrition_meals for select
  using (
    exists (
      select 1 from public.nutrition_plan_versions
      join public.nutrition_plans on nutrition_plans.id = nutrition_plan_versions.nutrition_plan_id
      where nutrition_plan_versions.id = nutrition_meals.nutrition_plan_version_id
      and nutrition_plans.user_id = auth.uid()
    )
  );

create policy "Users can view their nutrition meal items"
  on public.nutrition_meal_items for select
  using (
    exists (
      select 1
      from public.nutrition_meals
      join public.nutrition_plan_versions on nutrition_plan_versions.id = nutrition_meals.nutrition_plan_version_id
      join public.nutrition_plans on nutrition_plans.id = nutrition_plan_versions.nutrition_plan_id
      where nutrition_meals.id = nutrition_meal_items.meal_id
      and nutrition_plans.user_id = auth.uid()
    )
  );

grant usage on schema public to service_role;
grant all privileges on foods_catalog, nutrition_meals, nutrition_meal_items to service_role;
grant all privileges on all sequences in schema public to service_role;

insert into public.foods_catalog (name, category, calories_per_100g, protein_per_100g, carbs_per_100g, fats_per_100g, tags)
values
  ('Arroz cocido', 'carbohydrate', 130, 2.7, 28, 0.3, '["gluten_free", "carb_base"]'),
  ('Pasta cocida', 'carbohydrate', 158, 5.8, 30.9, 0.9, '["carb_base"]'),
  ('Patata cocida', 'carbohydrate', 87, 1.9, 20.1, 0.1, '["gluten_free", "carb_base"]'),
  ('Avena', 'carbohydrate', 389, 16.9, 66.3, 6.9, '["breakfast_carb"]'),
  ('Pechuga de pollo', 'protein', 165, 31, 0, 3.6, '["lean_protein"]'),
  ('Pavo', 'protein', 135, 29, 0, 1.6, '["lean_protein"]'),
  ('Tofu firme', 'protein', 144, 15.7, 2.8, 8.7, '["vegetarian", "vegan"]'),
  ('Huevos', 'protein', 143, 12.6, 0.7, 9.5, '["vegetarian"]'),
  ('Yogur griego', 'dairy', 97, 9, 3.6, 5, '["breakfast_protein"]'),
  ('Aceite de oliva', 'fat', 884, 0, 0, 100, '["fat_base"]'),
  ('Aguacate', 'fat', 160, 2, 8.5, 14.7, '["vegetarian", "vegan"]'),
  ('Platano', 'fruit', 89, 1.1, 22.8, 0.3, '["fruit"]'),
  ('Brocoli', 'vegetable', 35, 2.4, 7.2, 0.4, '["vegetable", "gluten_free"]'),
  ('Espinaca', 'vegetable', 23, 2.9, 3.6, 0.4, '["vegetable", "gluten_free"]')
on conflict (name) do nothing;
