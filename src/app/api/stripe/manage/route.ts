import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe";

type ManageAction = "cancel" | "reactivate";

export async function POST(request: Request) {
  const authClient = await createClient();
  const { data: auth } = await authClient.auth.getUser();

  if (!auth.user?.email) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { action?: ManageAction } | null;
  if (body?.action !== "cancel" && body?.action !== "reactivate") {
    return NextResponse.json({ error: "Invalid subscription action." }, { status: 400 });
  }

  try {
    const stripe = getStripeClient();
    const db = createAdminClient();
    const { data: profile } = await db.from("profiles").select("subscription_renews_at").eq("user_id", auth.user.id).maybeSingle();
    const customers = await stripe.customers.list({ email: auth.user.email, limit: 10 });
    let subscription: Awaited<ReturnType<typeof stripe.subscriptions.list>>["data"][number] | undefined;

    for (const customer of customers.data) {
      const subscriptions = await stripe.subscriptions.list({ customer: customer.id, status: "all", limit: 10 });
      subscription = subscriptions.data.find((item) => item.metadata.user_id === auth.user?.id && ["active", "trialing"].includes(item.status));
      if (subscription) break;
    }

    if (!subscription) {
      return NextResponse.json({ error: "No active subscription found." }, { status: 404 });
    }

    const updated = await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: body.action === "cancel",
    });
    const currentPeriodEnd = (updated as unknown as { current_period_end?: number | null }).current_period_end;
    const renewsAt = typeof currentPeriodEnd === "number"
      ? new Date(currentPeriodEnd * 1000).toISOString()
      : profile?.subscription_renews_at ?? null;

    return NextResponse.json({
      ok: true,
      renewsAt,
      autoRenew: !updated.cancel_at_period_end,
    });
  } catch (error) {
    console.error("Unable to manage Stripe subscription", error);
    return NextResponse.json({ error: "Unable to update the subscription." }, { status: 500 });
  }
}