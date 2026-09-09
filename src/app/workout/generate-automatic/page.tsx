import { redirect } from "next/navigation";

import { AutomaticWorkoutRunner } from "@/components/automatic-workout-runner";
import { createClient } from "@/lib/supabase/server";

export default async function GenerateAutomaticWorkoutPage() {
  const authClient = await createClient();
  const { data: auth } = await authClient.auth.getUser();
  if (!auth.user) redirect("/login");
  return <AutomaticWorkoutRunner />;
}