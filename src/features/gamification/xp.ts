const levelThresholds = [0, 100, 250, 500, 900, 1400, 2000, 2800, 3800, 5000];

export function levelForXp(xp: number) {
  let level = 1;
  for (let index = 0; index < levelThresholds.length; index++) {
    if (xp >= levelThresholds[index]) level = index + 1;
  }
  const currentThreshold = levelThresholds[level - 1] ?? 0;
  const nextThreshold = levelThresholds[level] ?? null;
  const xpIntoLevel = xp - currentThreshold;
  const xpForNextLevel = nextThreshold !== null ? nextThreshold - currentThreshold : null;
  const progressPercent = xpForNextLevel ? Math.min(100, Math.round((xpIntoLevel / xpForNextLevel) * 100)) : 100;
  return { level, xp, xpIntoLevel, xpForNextLevel, progressPercent, isMaxLevel: nextThreshold === null };
}

/** Longest run of consecutive calendar days, plus whether that run reaches up to today/yesterday (the "current" streak). */
export function computeStreaks(dates: string[]) {
  const uniqueSorted = [...new Set(dates)].sort();
  if (uniqueSorted.length === 0) return { current: 0, best: 0 };

  let best = 1;
  let run = 1;
  for (let index = 1; index < uniqueSorted.length; index++) {
    const previousDate = new Date(`${uniqueSorted[index - 1]}T00:00:00Z`);
    const currentDate = new Date(`${uniqueSorted[index]}T00:00:00Z`);
    const diffDays = Math.round((currentDate.getTime() - previousDate.getTime()) / 86400000);
    run = diffDays === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const lastActiveDate = uniqueSorted[uniqueSorted.length - 1];
  let current = 0;
  if (lastActiveDate === today || lastActiveDate === yesterday) {
    current = 1;
    for (let index = uniqueSorted.length - 1; index > 0; index--) {
      const previousDate = new Date(`${uniqueSorted[index - 1]}T00:00:00Z`);
      const currentDate = new Date(`${uniqueSorted[index]}T00:00:00Z`);
      const diffDays = Math.round((currentDate.getTime() - previousDate.getTime()) / 86400000);
      if (diffDays === 1) current += 1;
      else break;
    }
  }

  return { current, best };
}

export type AchievementCategory = "entrenamiento" | "constancia" | "progreso";
export type Achievement = { id: string; title: string; xp: number; unlocked: boolean; category: AchievementCategory };

export type GamificationInput = {
  workoutSessionsCount: number;
  measurementsCount: number;
  bestStreak: number;
  weightDeltaKg: number | null;
};

export function computeAchievements(input: GamificationInput): Achievement[] {
  return [
    { id: "first_workout", title: "Primer entrenamiento", xp: 100, unlocked: input.workoutSessionsCount >= 1, category: "entrenamiento" },
    { id: "ten_workouts", title: "10 entrenamientos", xp: 200, unlocked: input.workoutSessionsCount >= 10, category: "entrenamiento" },
    { id: "thirty_workouts", title: "30 entrenamientos", xp: 400, unlocked: input.workoutSessionsCount >= 30, category: "entrenamiento" },
    { id: "hundred_workouts", title: "100 entrenamientos", xp: 1000, unlocked: input.workoutSessionsCount >= 100, category: "entrenamiento" },
    { id: "streak_7", title: "7 días seguidos", xp: 100, unlocked: input.bestStreak >= 7, category: "constancia" },
    { id: "streak_30", title: "30 días seguidos", xp: 300, unlocked: input.bestStreak >= 30, category: "constancia" },
    { id: "streak_90", title: "90 días seguidos", xp: 1000, unlocked: input.bestStreak >= 90, category: "constancia" },
    { id: "weight_progress", title: "Primer kg de progreso", xp: 150, unlocked: input.weightDeltaKg !== null && Math.abs(input.weightDeltaKg) >= 1, category: "progreso" },
    { id: "track_week", title: "Registrar peso 7 veces", xp: 100, unlocked: input.measurementsCount >= 7, category: "progreso" },
  ];
}

const ONBOARDING_XP = 150;
const XP_PER_WORKOUT = 50;
const XP_PER_MEASUREMENT = 10;

export function computeGamification(input: GamificationInput) {
  const achievements = computeAchievements(input);
  const achievementXp = achievements.filter((achievement) => achievement.unlocked).reduce((sum, achievement) => sum + achievement.xp, 0);
  const actionXp = ONBOARDING_XP + input.workoutSessionsCount * XP_PER_WORKOUT + input.measurementsCount * XP_PER_MEASUREMENT;
  const xp = actionXp + achievementXp;
  return { ...levelForXp(xp), achievements };
}
