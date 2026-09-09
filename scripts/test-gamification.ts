import { computeGamification, computeStreaks, levelForXp } from "../src/features/gamification/xp";

let passed = 0;
let failed = 0;
function assert(description: string, condition: boolean, details?: unknown) {
  if (condition) { passed += 1; console.log(`  PASS  ${description}`); }
  else { failed += 1; console.log(`  FAIL  ${description}`, details ?? ""); }
}

console.log("\n=== levelForXp ===");
{
  assert("0 XP es nivel 1", levelForXp(0).level === 1);
  assert("100 XP es nivel 2", levelForXp(100).level === 2);
  assert("5000 XP es nivel 10 (m\u00e1ximo)", levelForXp(5000).level === 10 && levelForXp(5000).isMaxLevel === true);
  assert("420 XP est\u00e1 en nivel 3, con 68% de progreso a nivel 4", levelForXp(420).level === 3 && levelForXp(420).progressPercent === 68, levelForXp(420));
}

console.log("\n=== computeStreaks ===");
{
  const today = new Date();
  const days = [0, 1, 2, 5, 6].map((offset) => new Date(today.getTime() - offset * 86400000).toISOString().slice(0, 10));
  const result = computeStreaks(days);
  assert("racha actual de 3 d\u00edas (hoy, ayer, anteayer)", result.current === 3, result);
  assert("mejor racha de 3 d\u00edas", result.best === 3, result);
}
{
  const result = computeStreaks([]);
  assert("sin actividad, racha 0", result.current === 0 && result.best === 0, result);
}

console.log("\n=== computeGamification ===");
{
  const result = computeGamification({ workoutSessionsCount: 10, measurementsCount: 7, bestStreak: 7, weightDeltaKg: 2 });
  assert("desbloquea el logro de 10 entrenamientos", result.achievements.find((a) => a.id === "ten_workouts")?.unlocked === true);
  assert("desbloquea el logro de racha de 7 d\u00edas", result.achievements.find((a) => a.id === "streak_7")?.unlocked === true);
  assert("no desbloquea el de 30 entrenamientos todav\u00eda", result.achievements.find((a) => a.id === "thirty_workouts")?.unlocked === false);
  console.log("  nivel resultante:", result.level, "xp:", result.xp);
}

console.log(`\n${passed} pruebas OK, ${failed} fallidas.\n`);
if (failed > 0) process.exitCode = 1;
