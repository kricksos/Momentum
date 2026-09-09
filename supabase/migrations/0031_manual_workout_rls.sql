create policy "Users can manage their own manual workout drafts"
  on public.manual_workout_drafts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their own manual workout draft days"
  on public.manual_workout_draft_days for all
  using (
    exists (
      select 1 from public.manual_workout_drafts
      where manual_workout_drafts.id = manual_workout_draft_days.draft_id
        and manual_workout_drafts.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.manual_workout_drafts
      where manual_workout_drafts.id = manual_workout_draft_days.draft_id
        and manual_workout_drafts.user_id = auth.uid()
    )
  );

create policy "Users can manage their own manual workout draft exercises"
  on public.manual_workout_draft_exercises for all
  using (
    exists (
      select 1
      from public.manual_workout_draft_days
      join public.manual_workout_drafts on manual_workout_drafts.id = manual_workout_draft_days.draft_id
      where manual_workout_draft_days.id = manual_workout_draft_exercises.draft_day_id
        and manual_workout_drafts.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.manual_workout_draft_days
      join public.manual_workout_drafts on manual_workout_drafts.id = manual_workout_draft_days.draft_id
      where manual_workout_draft_days.id = manual_workout_draft_exercises.draft_day_id
        and manual_workout_drafts.user_id = auth.uid()
    )
  );
