import { completedNutritionDayCount } from "../src/features/planning/nutrition-compliance";

let passed = 0;
let failed = 0;

function assert(description: string, condition: boolean, details?: unknown) {
  if (condition) { passed += 1; console.log(`  PASS  ${description}`); }
  else { failed += 1; console.log(`  FAIL  ${description}`, details ?? ""); }
}

console.log("\n=== cumplimiento nutricional por días completos ===");
{
  const completedDays = completedNutritionDayCount([
    { completed_on: "2026-08-20" },
    { completed_on: "2026-08-20" },
    { completed_on: "2026-08-20" },
    { completed_on: "2026-08-21" },
    { completed_on: "2026-08-21" },
    { completed_on: "2026-08-22" },
    { completed_on: "2026-08-22" },
    { completed_on: "2026-08-22" },
  ], 3);

  assert("solo cuentan los días con todas las comidas registradas", completedDays === 2, completedDays);
}

{
  const completedDays = completedNutritionDayCount([{ completed_on: "2026-08-20" }, { completed_on: null }], 1);
  assert("ignora fechas nulas y mantiene mínimo de una comida esperada", completedDays === 1, completedDays);
}

console.log(`\n${passed} pruebas OK, ${failed} fallidas.\n`);
if (failed > 0) process.exitCode = 1;