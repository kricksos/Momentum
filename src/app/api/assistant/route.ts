import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  message: z.string().trim().min(1).max(1200),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) })).max(10).default([]),
});

export async function POST(request: Request) {
  const authClient = await createClient();
  const { data: auth } = await authClient.auth.getUser();
  if (!auth.user) return Response.json({ error: "Necesitas iniciar sesión." }, { status: 401 });

  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) return Response.json({ error: "El asistente todavía no está configurado. Añade GOOGLE_GEMINI_API_KEY en el entorno del servidor." }, { status: 503 });

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Escribe una pregunta válida para el asistente." }, { status: 400 });

  const db = createAdminClient();
  const [{ data: profile }, { data: workoutPlan }, { data: nutritionPlan }, { data: measurements }] = await Promise.all([
    db.from("profiles").select("name, primary_goal, experience, daily_activity, sleep_hours, stress_level, food_restrictions, motivation").eq("user_id", auth.user.id).maybeSingle(),
    db.from("workout_plans").select("name, description").eq("user_id", auth.user.id).eq("active", true).maybeSingle(),
    db.from("nutrition_plans").select("name").eq("user_id", auth.user.id).eq("active", true).maybeSingle(),
    db.from("body_measurements").select("measured_at, weight_kg, waist_cm, chest_cm, arm_cm, thigh_cm").eq("user_id", auth.user.id).order("measured_at", { ascending: false }).limit(3),
  ]);

  const dietaryRestrictions = Array.isArray(profile?.food_restrictions) ? profile.food_restrictions : [];

  const context = JSON.stringify({
    objetivo: profile?.primary_goal ?? "no definido",
    experiencia: profile?.experience ?? "no definida",
    actividadDiaria: profile?.daily_activity ?? "no definida",
    horasSueno: profile?.sleep_hours ?? "no definidas",
    estres: profile?.stress_level ?? "no definido",
    motivacion: profile?.motivation ?? "no definida",
    rutina: workoutPlan ? { nombre: workoutPlan.name, descripcion: workoutPlan.description } : "no disponible",
    dieta: nutritionPlan?.name ?? "no disponible",
    restriccionesAlimentarias: dietaryRestrictions.length > 0 ? dietaryRestrictions : "ninguna",
    ultimasMediciones: measurements ?? [],
  });

  const systemMessage = `Eres el asistente personal de Momentum, una plataforma de entrenamiento, nutrición y progreso. Responde siempre en español, con tono cercano, claro y práctico. Usa el contexto del usuario para explicar su plan y dar recomendaciones útiles. Si el usuario pregunta por comida, dieta o nutrición, responde con ideas concretas adaptadas a su objetivo actual, a su dieta activa, a sus restricciones alimentarias y a su nivel de actividad. Si tiene alergias o intolerancias (lactosa, gluten, huevos, frutos secos, soja, marisco), evita sugerencias que las incluyan y ofrece alternativas seguras. Si la pregunta es sobre comida, sigue este formato recomendado: 1) recomendación rápida de desayuno, 2) idea de comida, 3) idea de cena, 4) ajuste simple para su objetivo. Mantén la respuesta breve y muy accionable, idealmente 4-6 líneas o 4 puntos claros. No inventes datos ni cambies directamente la rutina, dieta, objetivos o mediciones: si el usuario pide un cambio, recomiéndale usar el check-in. No diagnostiques lesiones ni enfermedades; ante dolor intenso, síntomas o dudas médicas, recomienda consultar a un profesional sanitario. Contexto actual del usuario: ${context}`;

  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite";
  const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemMessage }] },
      contents: [
        ...parsed.data.history.map((message) => ({ role: message.role === "assistant" ? "model" : "user", parts: [{ text: message.content }] })),
        { role: "user", parts: [{ text: parsed.data.message }] },
      ],
      generationConfig: { temperature: 0.4, maxOutputTokens: 500 },
    }),
  });

  if (!aiResponse.ok) return Response.json({ error: "No he podido responder ahora. Inténtalo de nuevo en unos segundos." }, { status: 502 });
  const data = await aiResponse.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const answer = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
  if (!answer) return Response.json({ error: "No he recibido una respuesta válida. Inténtalo de nuevo." }, { status: 502 });

  return Response.json({ answer });
}
