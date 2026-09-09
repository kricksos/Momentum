alter table public.profiles drop constraint if exists profiles_meal_count_check;
alter table public.profiles add constraint profiles_meal_count_check check (meal_count between 3 and 6);

alter table public.nutrition_plan_versions drop constraint if exists nutrition_plan_versions_meal_count_check;
alter table public.nutrition_plan_versions add constraint nutrition_plan_versions_meal_count_check check (meal_count between 3 and 6);