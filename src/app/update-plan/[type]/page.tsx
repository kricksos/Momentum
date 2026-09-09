import { notFound } from "next/navigation";

import { PlanReviewRunner } from "@/components/plan-review-runner";

export default async function UpdatePlanPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (type !== "nutrition" && type !== "workout") notFound();
  return <PlanReviewRunner type={type} />;
}