import { Dumbbell, Flame, LineChart, Trophy } from "lucide-react";

type AchievementCategory = "entrenamiento" | "constancia" | "progreso";
type Achievement = { id: string; title: string; xp: number; unlocked: boolean; category: AchievementCategory };

type GamificationPanelProps = {
  level: number;
  xp: number;
  xpIntoLevel: number;
  xpForNextLevel: number | null;
  progressPercent: number;
  isMaxLevel: boolean;
  currentStreak: number;
  bestStreak: number;
  achievements: Achievement[];
};

const categoryMeta: Record<AchievementCategory, { label: string; icon: typeof Dumbbell }> = {
  entrenamiento: { label: "Entrenamiento", icon: Dumbbell },
  constancia: { label: "Constancia", icon: Flame },
  progreso: { label: "Progreso", icon: LineChart },
};

export function GamificationPanel({ level, xpIntoLevel, xpForNextLevel, progressPercent, isMaxLevel, currentStreak, bestStreak, achievements }: GamificationPanelProps) {
  const unlockedCount = achievements.filter((achievement) => achievement.unlocked).length;

  return (
    <section className="mt-4 rounded-3xl border border-[#d3dbcf] bg-[#f8f7f1] p-6">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <p className="text-sm text-[#819078]">Nivel</p>
          <h2 className="mt-1 text-3xl font-semibold">Nivel {level}</h2>
          <p className="mt-1 text-sm text-[#68736b]">{isMaxLevel ? "Nivel máximo alcanzado" : `${xpIntoLevel} / ${xpForNextLevel} XP`}</p>
          <div className="mt-2 h-2 w-48 overflow-hidden rounded-full bg-[#dfe4d8]"><div className="h-full rounded-full bg-[#72873f]" style={{ width: `${progressPercent}%` }} /></div>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-[#e3e7dd] bg-white px-4 py-3">
          <Flame size={20} className="text-[#c0492f]" />
          <div>
            <p className="text-xs text-[#819078]">Racha actual</p>
            <p className="font-semibold">{currentStreak} {currentStreak === 1 ? "día" : "días"} · mejor: {bestStreak}</p>
          </div>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-[#819078]">Logros</h3>
        <span className="flex items-center gap-1 text-xs text-[#819078]"><Trophy size={13} /> {unlockedCount} / {achievements.length}</span>
      </div>
      <div className="mt-3 grid gap-4 sm:grid-cols-3">
        {(Object.keys(categoryMeta) as AchievementCategory[]).map((category) => {
          const CategoryIcon = categoryMeta[category].icon;
          const categoryAchievements = achievements.filter((achievement) => achievement.category === category);
          return (
            <div key={category}>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-[#68736b]"><CategoryIcon size={14} className="text-[#72873f]" /> {categoryMeta[category].label}</p>
              <div className="mt-2 space-y-1.5">
                {categoryAchievements.map((achievement) => (
                  <div key={achievement.id} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${achievement.unlocked ? "border-[#b6c77b] bg-[#e7f5b4] text-[#3d4a24]" : "border-[#d3dbcf] bg-white text-[#a7b09c]"}`}>
                    <Trophy size={14} className={achievement.unlocked ? "text-[#72873f]" : "text-[#c3cabb]"} />
                    <span className="font-medium">{achievement.title}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
