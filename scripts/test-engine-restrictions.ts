import { generateInitialPlan } from "../src/features/planning/engine";

let passed = 0;
let failed = 0;
function assert(description: string, condition: boolean, details?: unknown) {
  if (condition) { passed += 1; console.log(`  PASS  ${description}`); }
  else { failed += 1; console.log(`  FAIL  ${description}`, details ?? ""); }
}

const baseProfile = { sex: "male" as const, age: 30, heightCm: 178, weightKg: 80, goal: "Ganar masa muscular", experience: "Intermedio", daysPerWeek: 3, sessionMinutes: 60, mealCount: 4 };

console.log("\n=== Sin restricciones: usa los ejercicios de plantilla tal cual ===");
{
  const plan = generateInitialPlan({ ...baseProfile, restrictions: [] });
  const names = plan.days.flatMap((day) => day.exercises.map((exercise) => exercise.name));
  assert("incluye Press banca con mancuernas (ejercicio de hombro sin restricción)", names.includes("Press banca con mancuernas"), names);
  assert("usa ejercicios del catálogo ampliado", names.some((name) => ["Remo sentado en polea", "Face pull", "Curl martillo", "Extensión de tríceps en polea", "Sentadilla dividida con mancuernas"].includes(name)), names);
}

console.log("\n=== Cuatro días: divide por pares musculares complementarios ===");
{
  const plan = generateInitialPlan({ ...baseProfile, daysPerWeek: 4, restrictions: [] });
  assert("usa estructura Upper / Lower", plan.structure === "Upper / Lower", plan.structure);
  assert("asigna el par muscular correcto por día", plan.days.map((day) => day.name).join(" | ") === "Pectoral y tríceps | Dorsal y bíceps | Cuádriceps y gemelos | Isquiotibiales, glúteos y core", plan.days.map((day) => day.name));
  assert("incluye trabajo directo de tríceps", plan.days[0].exercises.some((exercise) => exercise.name.includes("tríceps")), plan.days[0].exercises);
  assert("incluye trabajo directo de bíceps", plan.days[1].exercises.some((exercise) => exercise.name.includes("Curl")), plan.days[1].exercises);
}

console.log("\n=== Cinco días: usa Push / Pull / Legs ===");
{
  const plan = generateInitialPlan({ ...baseProfile, daysPerWeek: 5, restrictions: [] });
  assert("usa estructura Push / Pull / Legs", plan.structure === "Push / Pull / Legs", plan.structure);
  assert("el primer ciclo diferencia push, pull y piernas", plan.days.slice(0, 3).map((day) => day.name).join(" | ") === "Push · Pectoral, deltoides y tríceps | Pull · Dorsal y bíceps | Legs · Piernas y glúteos", plan.days.map((day) => day.name));
}

console.log("\n=== Con lesión de hombro: evita ejercicios de press y usa alternativas ===");
{
  const plan = generateInitialPlan({ ...baseProfile, restrictions: ["shoulder_injury"] });
  const names = plan.days.flatMap((day) => day.exercises.map((exercise) => exercise.name));
  assert("no incluye Press banca con mancuernas (choca con hombro)", !names.includes("Press banca con mancuernas"), names);
  assert("no incluye Press militar con mancuernas (choca con hombro)", !names.includes("Press militar con mancuernas"), names);
  assert("no incluye Press inclinado (choca con hombro)", !names.includes("Press inclinado"), names);
  assert("no incluye Press banca (choca con hombro)", !names.includes("Press banca"), names);
  console.log("  ejercicios generados:", names);
}

console.log("\n=== Con lesión de rodilla: evita sentadillas y usa alternativas ===");
{
  const plan = generateInitialPlan({ ...baseProfile, restrictions: ["knee_injury"] });
  const names = plan.days.flatMap((day) => day.exercises.map((exercise) => exercise.name));
  assert("no incluye Sentadilla (choca con rodilla)", !names.includes("Sentadilla"), names);
  assert("no incluye Prensa de piernas (choca con rodilla)", !names.includes("Prensa de piernas"), names);
}

console.log(`\n${passed} pruebas OK, ${failed} fallidas.\n`);
if (failed > 0) process.exitCode = 1;
