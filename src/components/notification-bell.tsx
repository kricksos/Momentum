"use client";

import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type NotificationBellProps = { daysSinceLastMeasurement: number | null; hasProfile: boolean; workoutLabel?: string | null; workoutHref?: string | null; workoutDue?: boolean };

const SEEN_KEY = "momentum_notif_seen_signature";

export function NotificationBell({ daysSinceLastMeasurement, hasProfile, workoutLabel, workoutHref, workoutDue = false }: NotificationBellProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [seenSignature, setSeenSignature] = useState<string | null>(null);
  const isOverdue = hasProfile && (daysSinceLastMeasurement === null || daysSinceLastMeasurement >= 14);
  const notifications = [
    isOverdue ? { id: `overdue-${daysSinceLastMeasurement ?? "none"}`, title: "Toca hacer seguimiento", message: daysSinceLastMeasurement === null ? "Aún no has registrado tu peso." : `Han pasado ${daysSinceLastMeasurement} días desde tu último registro.`, action: "Registrar peso" as const } : null,
    workoutDue && workoutLabel ? { id: `workout-${workoutLabel}`, title: "Entrenamiento pendiente", message: `Hoy toca ${workoutLabel}.`, action: "Comenzar entrenamiento" as const } : null,
  ].filter((notification): notification is { id: string; title: string; message: string; action: "Registrar peso" | "Comenzar entrenamiento" } => Boolean(notification));
  const signature = notifications.map((notification) => notification.id).join("|") || null;
  const showDot = Boolean(signature && signature !== seenSignature);

  // Read localStorage (an external system) after mount to avoid a server/client hydration mismatch.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setSeenSignature(window.localStorage.getItem(SEEN_KEY)); }, []);

  function toggleOpen() {
    setOpen((current) => !current);
    if (!open && signature) {
      window.localStorage.setItem(SEEN_KEY, signature);
      setSeenSignature(signature);
    }
  }

  function goToProgress() {
    if (window.location.pathname === "/dashboard") {
      window.dispatchEvent(new CustomEvent("dashboard:set-tab", { detail: "progress" }));
    } else {
      router.push("/dashboard?tab=progress");
    }
    setOpen(false);
  }

  function goToWorkout() {
    if (workoutHref) router.push(workoutHref);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button type="button" onClick={toggleOpen} aria-label="Notificaciones" className="relative grid size-10 place-items-center rounded-xl border border-[#d3dbcf] bg-white text-[#18231f]">
        <Bell size={18} />
        {showDot ? <span className="absolute right-2 top-2 size-2 rounded-full bg-[#c0492f]" /> : null}
      </button>
      {open ? (
        <>
          <button type="button" aria-label="Cerrar notificaciones" onClick={() => setOpen(false)} className="fixed inset-0 z-10 cursor-default" />
          <div className="absolute right-0 top-12 z-20 w-72 rounded-2xl border border-[#d3dbcf] bg-white p-4 shadow-lg">
            {notifications.length ? notifications.map((notification) => (
              <div key={notification.id} className="border-b border-[#e5e8e0] pb-4 last:border-0 last:pb-0">
                <p className="text-sm font-semibold text-[#18231f]">{notification.title}</p>
                <p className="mt-1 text-sm text-[#68736b]">{notification.message}{notification.action === "Registrar peso" ? " Te recomendamos medirte al menos cada 2 semanas." : ""}</p>
                <button type="button" onClick={notification.action === "Registrar peso" ? goToProgress : goToWorkout} className="mt-3 rounded-full bg-[#18231f] px-4 py-2 text-xs font-semibold text-white">{notification.action}</button>
              </div>
            )) : (
              <p className="text-sm text-[#68736b]">No tienes notificaciones nuevas.</p>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
