export type WeightPoint = { measuredAt: string; weightKg: number };
export type WeekBucket = { weekStart: string; avgWeightKg: number };

function isoWeekStart(dateString: string) {
  const date = new Date(`${dateString}T12:00:00Z`);
  const day = date.getUTCDay();
  const offset = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

/** Groups weigh-ins into Monday-start weekly buckets and averages them to smooth day-to-day water/food noise. */
export function weeklyBuckets(points: WeightPoint[]): WeekBucket[] {
  const groups = new Map<string, number[]>();
  for (const point of points) {
    const weekStart = isoWeekStart(point.measuredAt);
    const values = groups.get(weekStart) ?? [];
    values.push(point.weightKg);
    groups.set(weekStart, values);
  }
  return [...groups.entries()]
    .map(([weekStart, values]) => ({ weekStart, avgWeightKg: values.reduce((sum, value) => sum + value, 0) / values.length }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

export type NutritionStagnationResult = {
  status: "insufficient_data" | "not_applicable" | "on_track" | "stagnant";
  longTermStagnant: boolean;
  pctChange: number | null;
};

/** Compares weekly-average weight trend (not raw single-day pesajes) against the ~3-week and ~6-week marks. */
export function nutritionStagnation(buckets: WeekBucket[], direction: "up" | "down" | "neutral"): NutritionStagnationResult {
  if (direction === "neutral") return { status: "not_applicable", longTermStagnant: false, pctChange: null };
  if (buckets.length < 4) return { status: "insufficient_data", longTermStagnant: false, pctChange: null };

  const latest = buckets[buckets.length - 1];
  const threeWeeksAgo = buckets[buckets.length - 4];
  const pctChange = (latest.avgWeightKg - threeWeeksAgo.avgWeightKg) / threeWeeksAgo.avgWeightKg;
  const epsilon = 0.001;
  const isStagnant = direction === "up" ? pctChange <= epsilon : pctChange >= -epsilon;
  if (!isStagnant) return { status: "on_track", longTermStagnant: false, pctChange };

  let longTermStagnant = false;
  if (buckets.length >= 7) {
    const sixWeeksAgo = buckets[buckets.length - 7];
    const longPctChange = (latest.avgWeightKg - sixWeeksAgo.avgWeightKg) / sixWeeksAgo.avgWeightKg;
    longTermStagnant = direction === "up" ? longPctChange <= epsilon : longPctChange >= -epsilon;
  }

  return { status: "stagnant", longTermStagnant, pctChange };
}

export type ExerciseOccurrence = { weightKg: number | null; reps: number | null };

/** An exercise is stagnant when the last 3 logged sessions show the exact same top weight and reps (true plateau, not noise). */
export function isExerciseStagnant(occurrences: ExerciseOccurrence[]): boolean {
  if (occurrences.length < 3) return false;
  const lastThree = occurrences.slice(-3);
  const [a, b, c] = lastThree;
  if (a.weightKg === null || a.reps === null) return false;
  return a.weightKg === b.weightKg && a.weightKg === c.weightKg && a.reps === b.reps && a.reps === c.reps;
}

/** Levels 1-2 of the progression ladder: add volume first, then vary the rep range, before touching exercise selection. */
export function nextRepRange(current: string): string {
  const lowerBound = Number(current.match(/\d+/)?.[0] ?? 8);
  return lowerBound >= 10 ? "6-8" : "12-15";
}
