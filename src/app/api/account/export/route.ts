import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const authClient = await createClient();
  const { data: auth } = await authClient.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const db = createAdminClient();
  const userId = auth.user.id;

  const [
    user,
    profile,
    goals,
    measurements,
    consents,
    workoutPlans,
    workoutSessions,
    nutritionPlans,
    activityEvents,
    analyticsEvents,
    cardioPreferences,
    cardioSessions,
  ] = await Promise.all([
    db.from("users").select("id, email, created_at, updated_at").eq("id", userId).maybeSingle(),
    db.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    db.from("goals").select("*").eq("user_id", userId).order("created_at"),
    db.from("body_measurements").select("*").eq("user_id", userId).order("measured_at", { ascending: false }),
    db.from("user_consents").select("*").eq("user_id", userId).order("accepted_at", { ascending: false }),
    db.from("workout_plans").select("*, workout_plan_versions(*, workout_days(*, workout_exercises(*, exercises(*))) )").eq("user_id", userId).order("created_at"),
    db.from("workout_sessions").select("*, exercise_logs(*)").eq("user_id", userId).order("started_at", { ascending: false }),
    db.from("nutrition_plans").select("*, nutrition_plan_versions(*, nutrition_meals(*, nutrition_meal_items(*)))").eq("user_id", userId).order("created_at"),
    db.from("activity_events").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    db.from("analytics_events").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    db.from("cardio_preferences").select("*").eq("user_id", userId).order("created_at"),
    db.from("cardio_sessions").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
  ]);

  const queryErrors = [
    user.error,
    profile.error,
    goals.error,
    measurements.error,
    consents.error,
    workoutPlans.error,
    workoutSessions.error,
    nutritionPlans.error,
    activityEvents.error,
    analyticsEvents.error,
    cardioPreferences.error,
    cardioSessions.error,
  ].filter(Boolean);

  if (queryErrors.length > 0) {
    console.error("Unable to export account data", queryErrors.map((error) => error?.message));
    return NextResponse.json({ error: "Unable to export account data." }, { status: 500 });
  }

  const exportData = {
    export_version: "1.0",
    exported_at: new Date().toISOString(),
    account: {
      auth_user_id: userId,
      email: auth.user.email ?? null,
      metadata: auth.user.user_metadata ?? {},
      record: user.data,
    },
    profile: profile.data,
    goals: goals.data ?? [],
    measurements: measurements.data ?? [],
    consents: consents.data ?? [],
    workout_plans: workoutPlans.data ?? [],
    workout_sessions: workoutSessions.data ?? [],
    nutrition_plans: nutritionPlans.data ?? [],
    activity_events: activityEvents.data ?? [],
    analytics_events: analyticsEvents.data ?? [],
    cardio_preferences: cardioPreferences.data ?? [],
    cardio_sessions: cardioSessions.data ?? [],
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="momentum-datos-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
