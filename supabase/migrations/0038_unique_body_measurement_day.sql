-- Keep one measurement snapshot per user and calendar day.
-- Preserve the newest row when legacy data contains duplicates.
delete from public.body_measurements as older
using public.body_measurements as newer
where older.user_id = newer.user_id
  and older.measured_at = newer.measured_at
  and (
    older.created_at < newer.created_at
    or (older.created_at = newer.created_at and older.id::text < newer.id::text)
  );

create unique index body_measurements_user_date_unique_idx
  on public.body_measurements (user_id, measured_at);
