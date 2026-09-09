alter table public.exercises
  add column if not exists primary_muscle text;

update public.exercises
set primary_muscle = case name
  when 'Sentadilla goblet' then 'quadriceps'
  when 'Prensa de piernas' then 'quadriceps'
  when 'Sentadilla' then 'quadriceps'
  when 'Peso muerto rumano' then 'hamstrings'
  when 'Curl femoral' then 'hamstrings'
  when 'Hip thrust' then 'glutes'
  when 'Press banca con mancuernas' then 'pectorals'
  when 'Press inclinado' then 'pectorals'
  when 'Press banca' then 'pectorals'
  when 'Jalon al pecho' then 'lats'
  when 'Remo con mancuerna' then 'lats'
  when 'Remo con barra' then 'lats'
  when 'Elevaciones laterales' then 'deltoids'
  when 'Press militar con mancuernas' then 'deltoids'
  when 'Curl de biceps' then 'biceps'
  when 'Plancha' then 'core'
  when 'Pallof press' then 'core'
  else primary_muscle
end
where primary_muscle is null;

create index if not exists exercises_primary_muscle_idx on public.exercises (primary_muscle);