alter table public.profiles
  add column if not exists food_restrictions jsonb not null default '[]'::jsonb,
  add column if not exists diet_preference text not null default 'Omnívoro';

insert into public.foods_catalog (name, category, calories_per_100g, protein_per_100g, carbs_per_100g, fats_per_100g, tags)
values
  ('Lentejas cocidas', 'protein', 116, 9, 20, 0.4, '["vegetarian", "vegan", "gluten_free", "legume_protein"]')
on conflict (name) do nothing;