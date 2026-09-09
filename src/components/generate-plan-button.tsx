"use client";

import { LoaderCircle, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function GeneratePlanButton() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generatePlan() {
    setIsGenerating(true);
    setError(null);
    const response = await fetch("/api/plans/generate", { method: "POST" });
    if (!response.ok) {
      setError("No hemos podido preparar tu plan. Inténtalo de nuevo.");
      setIsGenerating(false);
      return;
    }
    router.refresh();
  }

  return <div><button type="button" onClick={generatePlan} disabled={isGenerating} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#d7f36b] px-5 py-3 text-sm font-semibold text-[#18231f] disabled:opacity-60">{isGenerating ? <LoaderCircle size={17} className="animate-spin" /> : <Sparkles size={17} />} {isGenerating ? "Preparando tu plan" : "Generar mi plan"}</button>{error && <p className="mt-3 text-sm text-[#a64e3c]">{error}</p>}</div>;
}
