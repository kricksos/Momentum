alter table public.nutrition_plan_versions
  add column if not exists meal_count smallint not null default 4 check (meal_count between 3 and 5),
  add column if not exists precision_mode text not null default 'precise' check (precision_mode = 'precise');

alter table public.profiles
  add column if not exists meal_count smallint not null default 4 check (meal_count between 3 and 5);

alter table public.nutrition_meal_items
  add column if not exists weight_basis text not null default 'cooked' check (weight_basis in ('raw', 'cooked', 'as_served')),
  add column if not exists substitution_group text;

update public.nutrition_meal_items
set substitution_group = alternative_group
where substitution_group is null;

grant all privileges on public.nutrition_plan_versions, public.nutrition_meal_items to service_role;
