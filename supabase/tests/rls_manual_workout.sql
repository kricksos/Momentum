begin;

select plan(6);

select has_table('public', 'manual_workout_drafts', 'manual workout drafts table exists');
select has_table('public', 'manual_workout_draft_days', 'manual workout draft days table exists');
select has_table('public', 'manual_workout_draft_exercises', 'manual workout draft exercises table exists');
select policies_are('public', 'manual_workout_drafts', array['Users can manage their own manual workout drafts']);
select policies_are('public', 'manual_workout_draft_days', array['Users can manage their own manual workout draft days']);
select policies_are('public', 'manual_workout_draft_exercises', array['Users can manage their own manual workout draft exercises']);

select * from finish();
rollback;
