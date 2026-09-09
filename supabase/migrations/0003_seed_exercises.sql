insert into public.exercises (name, description, category, difficulty, equipment_required, restrictions, alternatives, muscle_groups)
values
  ('Sentadilla goblet', 'Sentadilla con mancuerna frente al pecho.', 'compound', 'beginner', '["dumbbell"]', '[]', '["Prensa de piernas"]', '["piernas", "gluteos"]'),
  ('Press banca con mancuernas', 'Empuje horizontal con mancuernas.', 'compound', 'beginner', '["dumbbell", "bench"]', '["shoulder_injury"]', '["Press banca"]', '["pecho", "triceps"]'),
  ('Jalon al pecho', 'Traccion vertical controlada.', 'compound', 'beginner', '["cable"]', '[]', '["Remo con mancuerna"]', '["espalda", "biceps"]'),
  ('Peso muerto rumano', 'Bisagra de cadera con control.', 'compound', 'intermediate', '["barbell"]', '["back_injury"]', '["Curl femoral"]', '["isquios", "gluteos"]'),
  ('Plancha', 'Trabajo isometrico del core.', 'core', 'beginner', '[]', '[]', '["Pallof press"]', '["core"]'),
  ('Elevaciones laterales', 'Elevacion lateral de hombros.', 'accessory', 'beginner', '["dumbbell"]', '["shoulder_injury"]', '["Face pull"]', '["hombros"]'),
  ('Prensa de piernas', 'Empuje de piernas en maquina.', 'compound', 'beginner', '["machine"]', '["knee_injury"]', '["Sentadilla goblet"]', '["piernas", "gluteos"]'),
  ('Press inclinado', 'Empuje inclinado para pecho.', 'compound', 'intermediate', '["barbell", "bench"]', '["shoulder_injury"]', '["Press banca con mancuernas"]', '["pecho", "triceps"]'),
  ('Remo con mancuerna', 'Traccion horizontal unilateral.', 'compound', 'beginner', '["dumbbell"]', '["back_injury"]', '["Jalon al pecho"]', '["espalda", "biceps"]'),
  ('Curl femoral', 'Flexion de rodilla en maquina.', 'accessory', 'beginner', '["machine"]', '[]', '["Peso muerto rumano"]', '["isquios"]'),
  ('Press militar con mancuernas', 'Empuje vertical con mancuernas.', 'compound', 'intermediate', '["dumbbell"]', '["shoulder_injury"]', '["Elevaciones laterales"]', '["hombros", "triceps"]'),
  ('Pallof press', 'Anti-rotacion para el core.', 'core', 'beginner', '["cable"]', '[]', '["Plancha"]', '["core"]'),
  ('Sentadilla', 'Sentadilla con barra.', 'compound', 'intermediate', '["barbell", "rack"]', '["knee_injury"]', '["Sentadilla goblet"]', '["piernas", "gluteos"]'),
  ('Press banca', 'Empuje horizontal con barra.', 'compound', 'intermediate', '["barbell", "bench"]', '["shoulder_injury"]', '["Press banca con mancuernas"]', '["pecho", "triceps"]'),
  ('Remo con barra', 'Traccion horizontal con barra.', 'compound', 'intermediate', '["barbell"]', '["back_injury"]', '["Remo con mancuerna"]', '["espalda", "biceps"]'),
  ('Hip thrust', 'Extension de cadera.', 'compound', 'intermediate', '["barbell", "bench"]', '[]', '["Peso muerto rumano"]', '["gluteos"]'),
  ('Curl de biceps', 'Flexion de codo con mancuerna.', 'accessory', 'beginner', '["dumbbell"]', '["elbow_injury"]', '["Curl femoral"]', '["biceps"]')
on conflict (name) do nothing;
