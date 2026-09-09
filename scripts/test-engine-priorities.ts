import { generateInitialPlan } from "../src/features/planning/engine";

let passed = 0;
let failed = 0;
function assert(description: string, condition: boolean, details?: unknown) {
  if (condition) { passed += 1; console.log(`  PASS  ${description}`); }
  else { failed += 1; console.log(`  FAIL  ${description}`, details ?? ""); }
}

const baseProfile = { sex: "male" as const, age: 30, heightCm: 178, weightKg: 80, goal: "Ganar masa muscular", experience: "Intermedio", daysPerWeek: 3, sessionMinutes: 60, mealCount: 4, restrictions: [] };

console.log("\n=== Sin prioridades: series base (3) ===");
{
  const plan = generateInitialPlan({ ...baseProfile, priorities: [] });
  const chestExercise = plan.days.flatMap((day) => day.exercises).find((exercise) => exercise.name === "Press banca con mancuernas");
  assert("Press banca con mancuernas tiene 3 series (sin prioridad)", chestExercise?.sets === 3, chestExercise);
}

console.log("\n=== Con prioridad en pecho: +1 serie en ejercicios de pecho ===");
{
  const plan = generateInitialPlan({ ...baseProfile, priorities: ["pecho"] });
  const chestExercises = plan.days.flatMap((day) => day.exercises).filter((exercise) => exercise.name.includes("Press banca") || exercise.name === "Press inclinado");
  assert("todos los ejercicios de pecho tienen 4 series (3+1)", chestExercises.every((exercise) => exercise.sets === 4), chestExercises);
  const legExercise = plan.days.flatMap((day) => day.exercises).find((exercise) => exercise.name === "Sentadilla goblet" || exercise.name === "Sentadilla");
  assert("un ejercicio de piernas no priorizado sigue con 3 series", legExercise?.sets === 3, legExercise);
}

console.log(`\n${passed} pruebas OK, ${failed} fallidas.\n`);
if (failed > 0) process.exitCode = 1;
