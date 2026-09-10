import { NextResponse } from "next/server";
import Stripe from "stripe";

import { createAdminClient } from "@/lib/supabase/admin";
import { getProfilePlanFromStripePlan, getStripeClient } from "@/lib/stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  if (!webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook secret is not configured." }, { status: 500 });
  }

  const stripe = getStripeClient();
  const rawBody = await request.text();

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Invalid Stripe event signature", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const plan = session.metadata?.plan;

    if (!userId || !plan) {
      return NextResponse.json({ ok: true });
    }

    const normalizedPlan = getProfilePlanFromStripePlan(plan);
    const startedAt = new Date();
    const renewalDate = normalizedPlan === "free" ? null : new Date(startedAt.getTime());

    if (normalizedPlan === "monthly") renewalDate?.setUTCMonth(renewalDate.getUTCMonth() + 1);
    if (normalizedPlan === "quarterly") renewalDate?.setUTCMonth(renewalDate.getUTCMonth() + 3);
    if (normalizedPlan === "annual") renewalDate?.setUTCFullYear(renewalDate.getUTCFullYear() + 1);

    const db = createAdminClient();
    const { error } = await db.from("profiles").update({
      subscription_plan: normalizedPlan,
      subscription_status: "active",
      subscription_started_at: startedAt.toISOString(),
      subscription_renews_at: renewalDate ? renewalDate.toISOString() : null,
      subscription_auto_renew: true,
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId);

    if (error) {
      console.error("Unable to update user subscription from Stripe webhook", error);
      return NextResponse.json({ ok: false }, { status: 500 });
    }
  }

  if (event.type === "customer.subscription.deleted" || event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription;
    const currentStatus = subscription.status;
    const userId = typeof subscription.metadata?.user_id === "string" ? subscription.metadata.user_id : null;

    if (!userId) {
      return NextResponse.json({ ok: true });
    }

    const db = createAdminClient();
    const plan = typeof subscription.metadata?.plan === "string" ? subscription.metadata.plan : null;
    const normalizedPlan = getProfilePlanFromStripePlan(plan ?? "free");
    const currentPeriodEnd = (subscription as unknown as { current_period_end?: number | null }).current_period_end;
    const periodEnd = typeof currentPeriodEnd === "number"
      ? new Date(currentPeriodEnd * 1000).toISOString()
      : undefined;
    const isDeleted = event.type === "customer.subscription.deleted";

    const { error: subscriptionUpdateError } = await db.from("profiles").update({
      subscription_plan: isDeleted ? "free" : normalizedPlan,
      subscription_status: isDeleted ? "cancelled" : currentStatus === "active" ? "active" : "cancelled",
      ...(periodEnd ? { subscription_renews_at: periodEnd } : {}),
      subscription_auto_renew: !isDeleted && !subscription.cancel_at_period_end && currentStatus === "active",
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId);
    if (subscriptionUpdateError) {
      console.error("Unable to sync subscription update from Stripe webhook", subscriptionUpdateError);
      return NextResponse.json({ ok: false }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
