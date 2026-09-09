export type CardioRecommendation = {
  key: string;
  title: string;
  modalities: string[];
  durationMinutes: number;
  intensity: "Suave" | "Moderada" | "Intervalos";
  effort: string;
};

export function cardioRecommendations(goal: string, experience: string): CardioRecommendation[] {
  const normalizedGoal = goal.toLowerCase();
  const beginner = experience.includes("Nunca") || experience.includes("Menos");

  if (normalizedGoal.includes("perder")) {
    return [
      { key: "base-1", title: "Cardio base", modalities: ["Cinta", "Elíptica", "Bicicleta", "Caminar al aire libre"], durationMinutes: beginner ? 20 : 30, intensity: "Moderada", effort: "RPE 5-6: puedes hablar con frases cortas." },
      { key: "base-2", title: "Cardio base", modalities: ["Cinta", "Elíptica", "Bicicleta", "Remo"], durationMinutes: beginner ? 20 : 30, intensity: "Moderada", effort: "RPE 5-6: ritmo constante y sostenible." },
      { key: "intervalos", title: "Intervalos opcionales", modalities: ["Cinta", "Bicicleta", "Remo"], durationMinutes: beginner ? 15 : 20, intensity: "Intervalos", effort: "Alterna 1 min vivo con 2 min suaves." },
    ];
  }

  if (normalizedGoal.includes("rendimiento")) {
    return [
      { key: "aerobico", title: "Base aeróbica", modalities: ["Cinta", "Bicicleta", "Remo", "Elíptica"], durationMinutes: 30, intensity: "Moderada", effort: "RPE 5-6: continuo y controlado." },
      { key: "intervalos", title: "Intervalos", modalities: ["Cinta", "Bicicleta", "Remo"], durationMinutes: 20, intensity: "Intervalos", effort: "Alterna 1 min intenso con 2 min suaves." },
      { key: "recuperacion", title: "Recuperación activa", modalities: ["Caminar al aire libre", "Elíptica", "Bicicleta"], durationMinutes: 20, intensity: "Suave", effort: "RPE 3-4: deberías terminar con más energía." },
    ];
  }

  if (normalizedGoal.includes("ganar")) {
    return [
      { key: "salud-1", title: "Cardio de salud", modalities: ["Elíptica", "Bicicleta", "Caminar al aire libre"], durationMinutes: 20, intensity: "Suave", effort: "RPE 4-5: sin comprometer la recuperación de pesas." },
      { key: "salud-2", title: "Cardio de salud", modalities: ["Elíptica", "Bicicleta", "Cinta"], durationMinutes: 20, intensity: "Suave", effort: "RPE 4-5: ritmo cómodo y estable." },
    ];
  }

  return [
    { key: "bienestar-1", title: "Movimiento continuo", modalities: ["Caminar al aire libre", "Cinta", "Elíptica", "Bicicleta"], durationMinutes: 25, intensity: "Moderada", effort: "RPE 5: cómodo, pero con propósito." },
    { key: "bienestar-2", title: "Movimiento continuo", modalities: ["Caminar al aire libre", "Cinta", "Elíptica", "Bicicleta"], durationMinutes: 25, intensity: "Moderada", effort: "RPE 5: mantén una respiración controlada." },
  ];
}

export function cardioByWorkoutDay(recommendations: CardioRecommendation[], workoutDays: number) {
  const schedule = Array<CardioRecommendation | null>(Math.max(0, workoutDays)).fill(null);
  let recommendationIndex = 0;
  for (let dayIndex = 0; dayIndex < workoutDays && recommendationIndex < recommendations.length; dayIndex += 2) {
    schedule[dayIndex] = recommendations[recommendationIndex];
    recommendationIndex += 1;
  }
  return schedule;
}