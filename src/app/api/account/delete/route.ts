import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function DELETE() {
  const authClient = await createClient();
  const { data: auth } = await authClient.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const db = createAdminClient();
  const { error } = await db.auth.admin.deleteUser(auth.user.id);
  if (error) {
    console.error("Unable to delete account", error.message);
    return NextResponse.json({ error: "Unable to delete account." }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
