import { createAdminClient } from "@/lib/supabase/admin";

export type AnalyticsEventName = "dashboard_viewed" | "workout_started" | "workout_completed" | "weight_logged" | "plan_generated" | "signup_completed";

export async function trackAnalyticsEvent(userId: string, eventName: AnalyticsEventName, metadata: Record<string, string | number | boolean> = {}) {
  try {
    const db = createAdminClient();
    const { data: consent } = await db.from("user_consents").select("accepted").eq("user_id", userId).eq("consent_type", "analytics").order("accepted_at", { ascending: false }).limit(1).maybeSingle();
    if (!consent?.accepted) return;
    await db.from("analytics_events").insert({ user_id: userId, event_name: eventName, metadata });
  } catch {
    // Analytics must never block the user flow.
  }
}
