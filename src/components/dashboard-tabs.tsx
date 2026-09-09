"use client";

import { Apple, ChartNoAxesCombined, Dumbbell, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";

type DashboardTabsProps = {
  overview: ReactNode;
  training: ReactNode;
  nutrition: ReactNode;
  progress: ReactNode;
};

const tabs = [
  { id: "overview", label: "Resumen", icon: LayoutDashboard },
  { id: "training", label: "Entrenamiento", icon: Dumbbell },
  { id: "nutrition", label: "Nutrición", icon: Apple },
  { id: "progress", label: "Progreso", icon: ChartNoAxesCombined },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function DashboardTabs({ overview, training, nutrition, progress }: DashboardTabsProps) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const requestedTab = searchParams.get("tab");
    return tabs.some((tab) => tab.id === requestedTab) ? (requestedTab as TabId) : "overview";
  });
  const content = { overview, training, nutrition, progress };

  useEffect(() => {
    function handleSetTab(event: Event) {
      const tabId = (event as CustomEvent<TabId>).detail;
      if (tabs.some((tab) => tab.id === tabId)) setActiveTab(tabId);
    }
    window.addEventListener("dashboard:set-tab", handleSetTab);
    return () => window.removeEventListener("dashboard:set-tab", handleSetTab);
  }, []);

  return <div className="mt-10"><nav className="grid grid-cols-4 gap-1 rounded-2xl border border-[#d3dbcf] bg-[#eef0e8] p-1" aria-label="Secciones del dashboard">{tabs.map((tab) => { const Icon = tab.icon; const isActive = activeTab === tab.id; return <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-2 text-xs font-semibold transition sm:text-sm ${isActive ? "bg-[#18231f] text-[#f6f4ed] shadow-sm" : "text-[#68736b] hover:bg-white/70"}`}><Icon size={16} /><span className="hidden sm:inline">{tab.label}</span></button>; })}</nav>{activeTab === "training" && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d3dbcf] bg-[#f8f7f1] p-4"><div><p className="text-sm font-semibold">Configura tu rutina</p><p className="mt-1 text-sm text-[#68736b]">Crea una rutina, personaliza la actual o recupera una anterior.</p></div><Link href="/workout/builder" className="inline-flex items-center gap-2 rounded-full bg-[#18231f] px-4 py-2 text-sm font-semibold text-white"><Dumbbell size={16} /> Configurar rutinas</Link></div>}<div className="mt-7">{content[activeTab]}</div></div>;
}

