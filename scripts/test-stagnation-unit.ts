import { isExerciseStagnant, nextRepRange, nutritionStagnation, weeklyBuckets } from "../src/features/planning/stagnation";

let passed = 0;
let failed = 0;

function assert(description: string, condition: boolean, details?: unknown) {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${description}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${description}`, details ?? "");
  }
}

function weeklyPoints(startDaysAgo: number, weeks: number, weightAt: (weekIndex: number) => number) {
  const points = [];
  for (let week = 0; week < weeks; week++) {
    const daysAgo = startDaysAgo - week * 7;
    const date = new Date(Date.now() - daysAgo * 86400000);
    points.push({ measuredAt: date.toISOString().slice(0, 10), weightKg: weightAt(week) });
  }
  return points;
}

console.log("\n=== 1) weeklyBuckets agrupa por semana y promedia ===");
{
  const points = [
    { measuredAt: "2026-08-03", weightKg: 80 }, // Monday
    { measuredAt: "2026-08-05", weightKg: 82 }, // same week
    { measuredAt: "2026-08-10", weightKg: 81 }, // next week
  ];
  const buckets = weeklyBuckets(points);
  assert("agrupa dos pesajes de la misma semana en un solo bucket", buckets.length === 2, buckets);
  assert("promedia correctamente la primera semana (80 y 82 -> 81)", buckets[0].avgWeightKg === 81, buckets);
}

console.log("\n=== 2) nutritionStagnation: objetivo de ganar masa, sin progreso 3 semanas -> stagnant ===");
{
  const points = weeklyPoints(49, 7, () => 80); // flat for 7 weeks
  const buckets = weeklyBuckets(points);
  const result = nutritionStagnation(buckets, "up");
  assert("detecta estancamiento a corto plazo", result.status === "stagnant", result);
  assert("también detecta estancamiento a largo plazo (6 semanas)", result.longTermStagnant === true, result);
}

console.log("\n=== 3) nutritionStagnation: objetivo de ganar masa, progresando bien -> on_track ===");
{
  const points = weeklyPoints(28, 4, (week) => 80 + week * 0.3); // +0.3kg/week
  const buckets = weeklyBuckets(points);
  const result = nutritionStagnation(buckets, "up");
  assert("no marca estancamiento si el peso sube de forma consistente", result.status === "on_track", result);
}

console.log("\n=== 4) nutritionStagnation: objetivo de perder grasa, sin bajar -> stagnant ===");
{
  const points = weeklyPoints(28, 4, () => 90); // flat
  const buckets = weeklyBuckets(points);
  const result = nutritionStagnation(buckets, "down");
  assert("detecta estancamiento cuando el objetivo es perder peso y no baja", result.status === "stagnant", result);
}

console.log("\n=== 5) nutritionStagnation: pocos datos -> insufficient_data ===");
{
  const points = weeklyPoints(7, 2, () => 80); // only 2 weekly buckets
  const buckets = weeklyBuckets(points);
  const result = nutritionStagnation(buckets, "up");
  assert("no se pronuncia si aún no hay ~4 semanas de datos", result.status === "insufficient_data", result);
}

console.log("\n=== 6) nutritionStagnation: objetivo neutro -> not_applicable ===");
{
  const points = weeklyPoints(49, 7, () => 80);
  const buckets = weeklyBuckets(points);
  const result = nutritionStagnation(buckets, "neutral");
  assert("no evalúa estancamiento de peso para objetivos sin dirección clara", result.status === "not_applicable", result);
}

console.log("\n=== 7) isExerciseStagnant: mismo peso y reps 3 veces seguidas -> true ===");
{
  const stagnant = isExerciseStagnant([
    { weightKg: 48, reps: 10 },
    { weightKg: 50, reps: 10 },
    { weightKg: 50, reps: 10 },
    { weightKg: 50, reps: 10 },
  ]);
  assert("detecta la meseta usando solo las últimas 3 sesiones", stagnant === true);

  const improving = isExerciseStagnant([
    { weightKg: 48, reps: 10 },
    { weightKg: 49, reps: 10 },
    { weightKg: 50, reps: 10 },
  ]);
  assert("no marca estancamiento si el peso sigue subiendo", improving === false);

  const notEnoughData = isExerciseStagnant([{ weightKg: 50, reps: 10 }]);
  assert("no se pronuncia con menos de 3 sesiones registradas", notEnoughData === false);
}

console.log("\n=== 8) nextRepRange: alterna el rango de repeticiones ===");
{
  assert('"8-12" (bajo rango) pasa a un rango más ligero/alto "12-15"', nextRepRange("8-12") === "12-15");
  assert('"10-12" (rango alto) pasa a un rango más pesado "6-8"', nextRepRange("10-12") === "6-8");
}

console.log(`\n${passed} pruebas OK, ${failed} fallidas.\n`);
if (failed > 0) process.exitCode = 1;
