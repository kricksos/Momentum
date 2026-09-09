import { cardioByWorkoutDay, cardioRecommendations } from "../src/features/planning/cardio";

function assert(description: string, condition: boolean) {
  if (!condition) throw new Error(description);
  console.log(`PASS  ${description}`);
}

const fatLoss = cardioRecommendations("Perder grasa", "Entre 1 y 3 años");
assert("Pérdida de grasa propone tres sesiones", fatLoss.length === 3);
assert("Pérdida de grasa incluye intervalos opcionales", fatLoss.some((session) => session.intensity === "Intervalos"));

const muscleGain = cardioRecommendations("Ganar masa muscular", "Entre 1 y 3 años");
assert("Ganancia muscular mantiene cardio suave", muscleGain.every((session) => session.intensity === "Suave"));
assert("Ganancia muscular limita las sesiones a 20 minutos", muscleGain.every((session) => session.durationMinutes === 20));

const performance = cardioRecommendations("Mejorar rendimiento", "Entre 1 y 3 años");
assert("Rendimiento combina base e intervalos", performance.some((session) => session.intensity === "Moderada") && performance.some((session) => session.intensity === "Intervalos"));

const fourDaySchedule = cardioByWorkoutDay(fatLoss, 4);
assert("Cuatro días separan el cardio con al menos un día de fuerza", Boolean(fourDaySchedule[0]) && fourDaySchedule[1] === null && Boolean(fourDaySchedule[2]) && fourDaySchedule[3] === null);