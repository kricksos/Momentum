import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { restrictionsFromInjuryLabels } from "@/lib/injuries";
import { foodRestrictionsFromLabels } from "@/lib/food-restrictions";
import { priorityTagsFromLabels } from "@/lib/priorities";

const convertSchema = z.object({
  sessionToken: z.string().min(32).optional(),
});

type OnboardingAnswer = {
  question_key: string;
  answer_value: unknown;
};

function answerMap(answers: OnboardingAnswer[]) {
  return new Map(answers.map((answer) => [answer.question_key, answer.answer_value]));
}

function textValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function numericValue(value: unknown) {
  return typeof value === "number" ? value : Number(value);
}

function sleepAverage(value: unknown) {
  const match = textValue(value).match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
  if (match) return (Number(match[1]) + Number(match[2])) / 2;
  if (textValue(value).includes("Menos")) return 4;
  if (textValue(value).includes("Más")) return 9;
  return numericValue(value);
}

function normalizeSex(value: unknown) {
  return textValue(value) === "Mujer" ? "female" : "male";
}

function firstNumber(value: unknown, fallback: number) {
  const match = textValue(value).match(/\d+/);
  return match ? Number(match[0]) : fallback;
}

function stringValues(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item !== "Ninguna") : [];
}

export async function POST(request: Request) {
  const parsedBody = convertSchema.safeParse(await request.json());

  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid onboarding session." }, { status: 400 });
  }

  const authClient = await createClient();
  const { data: authData } = await authClient.auth.getUser();

  if (!authData.user) {
    return NextResponse.json({ converted: false });
  }

  const cookieStore = await cookies();
  const sessionToken = parsedBody.data.sessionToken ?? cookieStore.get("momentum_onboarding_token")?.value;

  try {
    const supabase = createAdminClient();
    const { data: existingProfile, error: existingProfileError } = await supabase.from("profiles").select("user_id").eq("user_id", authData.user.id).maybeSingle();
    if (existingProfileError) return NextResponse.json({ error: "Unable to check existing profile." }, { status: 500 });
    if (existingProfile) return NextResponse.json({ converted: false, profileExists: true });

    const sessionQuery = supabase
      .from("onboarding_sessions")
      .select("id, status, expires_at, auth_user_id")
      .eq("status", "completed");
    const { data: session, error: sessionError } = sessionToken
      ? await sessionQuery.eq("session_token_hash", createHash("sha256").update(sessionToken).digest("hex")).maybeSingle()
      : await sessionQuery.eq("auth_user_id", authData.user.id).order("started_at", { ascending: false }).limit(1).maybeSingle();

    if (sessionError || !session || (session.auth_user_id && session.auth_user_id !== authData.user.id) || new Date(session.expires_at) <= new Date()) {
      return NextResponse.json({ error: "Onboarding session is invalid or expired." }, { status: sessionToken ? 401 : 409 });
    }

    const { data: answers, error: answersError } = await supabase
      .from("onboarding_answers")
      .select("question_key, answer_value")
      .eq("onboarding_session_id", session.id);

    if (answersError || !answers) {
      return NextResponse.json({ error: "Unable to read onboarding answers." }, { status: 500 });
    }

    const values = answerMap(answers);
    const profile = {
      user_id: authData.user.id,
      name: textValue(authData.user.user_metadata?.name) || "Usuario Momentum",
      motivation: textValue(values.get("motivation")) || null,
      sex: normalizeSex(values.get("sex")),
      age: numericValue(values.get("age")),
      height_cm: numericValue(values.get("height")),
      current_weight_kg: numericValue(values.get("weight")),
      target_weight_kg: values.get("target_weight") ? numericValue(values.get("target_weight")) : null,
      primary_goal: textValue(values.get("goal")),
      diet_preference: textValue(values.get("diet")) || "Omnívoro",
      experience: textValue(values.get("experience")),
      daily_activity: textValue(values.get("daily_activity")),
      sleep_hours: sleepAverage(values.get("sleep")),
      sleep_quality: "not_provided",
      stress_level: "not_provided",
      days_per_week: firstNumber(values.get("days_per_week"), 3),
      session_duration_minutes: firstNumber(values.get("session_duration"), 60),
      meal_count: firstNumber(values.get("meal_count"), 4),
      training_place: textValue(values.get("training_place")),
      workout_planning_mode: textValue(values.get("workout_planning_mode")) === "Manual" ? "manual" : "auto",
      restrictions: restrictionsFromInjuryLabels(values.get("injuries")),
      food_restrictions: foodRestrictionsFromLabels(values.get("food_restrictions")),
      priorities: priorityTagsFromLabels(values.get("priorities")),
      disliked_foods: stringValues(values.get("disliked_foods")),
      preferred_meal_styles: stringValues(values.get("preferred_meal_styles")),
      meals_out_slots: [],
    };

    if (!profile.primary_goal || !profile.experience || !profile.daily_activity || !Number.isFinite(profile.age) || !Number.isFinite(profile.height_cm) || !Number.isFinite(profile.current_weight_kg) || !Number.isFinite(profile.sleep_hours)) {
      return NextResponse.json({ error: "The onboarding profile is incomplete." }, { status: 400 });
    }

    const { error: consentsError } = await supabase.from("user_consents").insert([
      { user_id: authData.user.id, consent_type: "privacy_policy", accepted: true, document_version: textValue(authData.user.user_metadata?.consent_version) || "1.0", language: textValue(authData.user.user_metadata?.consent_language) || "es" },
      { user_id: authData.user.id, consent_type: "terms_conditions", accepted: true, document_version: textValue(authData.user.user_metadata?.consent_version) || "1.0", language: textValue(authData.user.user_metadata?.consent_language) || "es" },
    ]);
    if (consentsError) return NextResponse.json({ error: "Unable to save required consents." }, { status: 500 });

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(profile, { onConflict: "user_id" });

    if (profileError) {
      console.error("Unable to create profile", {
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
      });
      return NextResponse.json({ error: "Unable to create profile." }, { status: 500 });
    }

    const { data: existingMeasurement } = await supabase
      .from("body_measurements")
      .select("id")
      .eq("user_id", authData.user.id)
      .limit(1)
      .maybeSingle();
    if (!existingMeasurement) {
      const { error: measurementError } = await supabase.from("body_measurements").insert({ user_id: authData.user.id, weight_kg: profile.current_weight_kg });
      if (measurementError) return NextResponse.json({ error: "Unable to save initial measurement." }, { status: 500 });
    }

    await supabase
      .from("onboarding_sessions")
      .update({ status: "converted", converted_user_id: authData.user.id })
      .eq("id", session.id);

    const response = NextResponse.json({ converted: true, planningMode: profile.workout_planning_mode });
    response.cookies.delete("momentum_onboarding_token");
    return response;
  } catch {
    return NextResponse.json({ error: "Supabase server credentials are not configured." }, { status: 503 });
  }
}
