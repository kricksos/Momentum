"use client";

import { AlertTriangle, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";

const FOOD_RESTRICTIONS = [
  { id: "lactose", label: "Intolerancia a la lactosa" },
  { id: "gluten", label: "Intolerancia al gluten" },
  { id: "eggs", label: "Alergia a huevos" },
  { id: "nuts", label: "Alergia a frutos secos" },
  { id: "soy", label: "Alergia a soja" },
  { id: "seafood", label: "Alergia a mariscos" },
];

const INJURIES = [
  { id: "Ninguna", label: "Ninguna" },
  { id: "Hombro", label: "Lesión de hombro" },
  { id: "Rodilla", label: "Lesión de rodilla" },
  { id: "Espalda", label: "Lesión de espalda" },
  { id: "Codo", label: "Lesión de codo" },
  { id: "Tobillo", label: "Lesión de tobillo" },
  { id: "Cuello", label: "Lesión de cuello" },
  { id: "Muñeca", label: "Lesión de muñeca" },
];

type Props = {
  userId: string;
};

export function AdminRestrictionsForm({ userId }: Props) {
  const [foodRestrictions, setFoodRestrictions] = useState<Set<string>>(new Set());
  const [savedFoodRestrictions, setSavedFoodRestrictions] = useState<Set<string>>(new Set());
  const [selectedInjury, setSelectedInjury] = useState<string>("Ninguna");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "warning" | "error"; text: string } | null>(null);

  // Fetch initial restrictions
  useEffect(() => {
    const fetchRestrictions = async () => {
      try {
        const response = await fetch(`/api/admin/users/${userId}/restrictions`);
        if (!response.ok) throw new Error("Failed to fetch restrictions");

        const data = await response.json();
        const savedRestrictions = new Set<string>(Array.isArray(data.foodRestrictions) ? data.foodRestrictions.filter((restriction: unknown): restriction is string => typeof restriction === "string") : []);
        setFoodRestrictions(savedRestrictions);
        setSavedFoodRestrictions(savedRestrictions);
        setSelectedInjury((data.injuries && data.injuries[0]) || "Ninguna");
      } catch (error) {
        console.error("Error fetching restrictions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestrictions();
  }, [userId]);

  const toggleFoodRestriction = (restrictionId: string) => {
    const newSet = new Set(foodRestrictions);
    if (newSet.has(restrictionId)) {
      newSet.delete(restrictionId);
    } else {
      newSet.add(restrictionId);
    }
    setFoodRestrictions(newSet);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    const foodRestrictionsChanged =
      foodRestrictions.size !== savedFoodRestrictions.size ||
      [...foodRestrictions].some((restriction) => !savedFoodRestrictions.has(restriction));

    try {
      const response = await fetch(`/api/admin/users/${userId}/restrictions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodRestrictions: Array.from(foodRestrictions),
          injuries: selectedInjury === "Ninguna" ? [] : [selectedInjury],
        }),
      });

      if (!response.ok) {
        throw new Error("Error al guardar restricciones");
      }

      setSavedFoodRestrictions(new Set(foodRestrictions));
      setMessage(
        foodRestrictionsChanged
          ? { type: "warning", text: "Intolerancias actualizadas. Revisa el plan nutricional para comprobar que sigue siendo compatible." }
          : { type: "success", text: "Restricciones actualizadas correctamente." },
      );
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Error desconocido" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="space-y-6 rounded-3xl border border-[#d3dbcf] bg-[#f8f7f1] p-6">
        <div className="flex items-center justify-center py-8">
          <LoaderCircle size={20} className="animate-spin text-[#60703d]" />
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6 rounded-3xl border border-[#d3dbcf] bg-[#f8f7f1] p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#819078]">Restricciones</p>
        <h3 className="mt-2 text-xl font-semibold">Alergias, intolerancias y lesiones</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-[#18231f]">Restricciones alimentarias</label>
          <div className="mt-3 space-y-2">
            {FOOD_RESTRICTIONS.map((restriction) => (
              <label key={restriction.id} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={foodRestrictions.has(restriction.id)}
                  onChange={() => toggleFoodRestriction(restriction.id)}
                  className="h-4 w-4 rounded border-[#d3dbcf] accent-[#60703d]"
                />
                <span className="text-sm text-[#68736b]">{restriction.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#18231f]">Lesiones o molestias</label>
          <select
            value={selectedInjury}
            onChange={(e) => setSelectedInjury(e.target.value)}
            className="mt-2 w-full rounded-xl border border-[#d3dbcf] bg-white px-3 py-2 text-sm text-[#18231f] focus:border-[#60703d] focus:outline-none"
          >
            {INJURIES.map((injury) => (
              <option key={injury.id} value={injury.id}>
                {injury.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-[#e7f5b4] text-[#60703d]"
              : message.type === "warning"
                ? "flex gap-2 bg-[#fff1c6] text-[#795d10]"
                : "bg-[#ffd9d9] text-[#c42c2c]"
          }`}
        >
          {message.type === "warning" && <AlertTriangle className="mt-0.5 shrink-0" size={16} />}
          {message.text}
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="flex items-center justify-center gap-2 rounded-xl bg-[#60703d] px-6 py-2 text-sm font-semibold text-white hover:bg-[#4a5430] disabled:opacity-60"
      >
        {saving && <LoaderCircle size={16} className="animate-spin" />}
        {saving ? "Guardando..." : "Guardar restricciones"}
      </button>
    </section>
  );
}
