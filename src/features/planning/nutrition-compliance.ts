export function completedNutritionDayCount(completions: Array<{ completed_on: string | null }>, mealsPerDay: number) {
  const expectedMeals = Math.max(1, mealsPerDay);
  const completionsByDate = new Map<string, number>();

  for (const completion of completions) {
    if (!completion.completed_on) continue;
    completionsByDate.set(completion.completed_on, (completionsByDate.get(completion.completed_on) ?? 0) + 1);
  }

  return [...completionsByDate.values()].filter((count) => count >= expectedMeals).length;
}