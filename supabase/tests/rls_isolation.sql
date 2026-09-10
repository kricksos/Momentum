begin;

select plan(12);

select table_privs_are_not('public', 'profiles', 'anon', array['SELECT', 'INSERT', 'UPDATE', 'DELETE'], 'anon cannot access profiles directly');
select table_privs_are_not('public', 'workout_plans', 'anon', array['SELECT', 'INSERT', 'UPDATE', 'DELETE'], 'anon cannot access workout plans directly');
select table_privs_are_not('public', 'nutrition_plans', 'anon', array['SELECT', 'INSERT', 'UPDATE', 'DELETE'], 'anon cannot access nutrition plans directly');
select policies_are('public', 'profiles', array['Users can manage their own profile']);
select policies_are('public', 'workout_plans', array['Users can manage their own workout plans']);
select policies_are('public', 'nutrition_plans', array['Users can manage their own nutrition plans']);
select policies_are('public', 'workout_days', array['Users can view their workout days']);
select policies_are('public', 'workout_exercises', array['Users can view their workout exercises']);
select policies_are('public', 'nutrition_plan_versions', array['Users can view their nutrition plan versions']);
select policies_are('public', 'body_measurements', array['Users can manage their own measurements']);
select policies_are('public', 'user_consents', array['Users can manage their own consents']);
select policies_are('public', 'analytics_events', array[]::text[]);

select * from finish();
rollback;