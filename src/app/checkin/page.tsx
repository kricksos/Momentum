import Link from "next/link";

import { CheckinWizard } from "@/components/checkin-wizard";
import { foodRestrictionLabelsFromRestrictions } from "@/lib/food-restrictions";
import { injuryLabelsFromRestrictions } from "@/lib/injuries";
import { getDaysSinceLastMeasurement } from "@/lib/last-measurement";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function CheckinPage() {
  const authClient = await createClient();
  const { data: auth } = await authClient.auth.getUser();

  if (!auth.user) return <main className="grid min-h-screen place-items-center bg-[#f4f1e9] text-center text-[#18231f]"><div><h1 className="text-3xl font-semibold">Necesitas iniciar sesión</h1><Link href="/login" className="mt-6 inline-flex rounded-full bg-[#18231f] px-5 py-3 text-sm font-semibold text-white">Ir al acceso</Link></div></main>;

  const db = createAdminClient();
  const { data: profile } = await db.from("profiles").select("name, primary_goal, days_per_week, session_duration_minutes, training_place, restrictions, food_restrictions").eq("user_id", auth.user.id).maybeSingle();

  if (!profile) return <main className="grid min-h-screen place-items-center bg-[#f4f1e9] text-center text-[#18231f]"><div><h1 className="text-3xl font-semibold">Completa primero tu perfil inicial</h1><Link href="/dashboard" className="mt-6 inline-flex rounded-full bg-[#18231f] px-5 py-3 text-sm font-semibold text-white">Volver al panel</Link></div></main>;

  const daysSinceLastMeasurement = await getDaysSinceLastMeasurement(db, auth.user.id);
  const accountName = profile.name ?? (typeof auth.user.user_metadata?.name === "string" ? auth.user.user_metadata.name : "Mi cuenta");

  return (
    <CheckinWizard
      initialGoal={profile.primary_goal}
      initialDaysPerWeek={profile.days_per_week ?? 3}
      initialSessionDuration={profile.session_duration_minutes ?? 60}
      initialTrainingPlace={profile.training_place ?? "Gimnasio completo"}
      initialInjuries={injuryLabelsFromRestrictions(profile.restrictions)}
      initialFoodRestrictions={foodRestrictionLabelsFromRestrictions(profile.food_restrictions)}
      email={auth.user.email ?? ""}
      name={accountName}
      daysSinceLastMeasurement={daysSinceLastMeasurement}
    />
  );
}
