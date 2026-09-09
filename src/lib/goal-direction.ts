export function goalDirection(primaryGoal: string): "up" | "down" | "neutral" {
  const goal = primaryGoal.toLowerCase();
  if (goal.includes("ganar")) return "up";
  if (goal.includes("perder")) return "down";
  return "neutral";
}
