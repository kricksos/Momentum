"use client";

import { Download, LoaderCircle } from "lucide-react";
import { useState } from "react";

export function AccountDataExport() {
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function exportData() {
    setExporting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/account/export", { cache: "no-store" });
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "momentum-datos.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setMessage("Tus datos se han descargado.");
    } catch {
      setMessage("No hemos podido preparar tus datos. Inténtalo de nuevo.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <section className="rounded-3xl border border-[#d3dbcf] bg-[#f8f7f1] p-6">
      <div className="flex items-start gap-3">
        <Download className="mt-0.5 text-[#72873f]" size={20} />
        <div>
          <h2 className="text-lg font-semibold">Descargar mis datos</h2>
          <p className="mt-2 text-sm leading-6 text-[#68736b]">Descarga una copia en JSON de tu perfil, objetivos, medidas, planes, entrenamientos, nutrición, consentimientos y actividad.</p>
        </div>
      </div>
      <button type="button" disabled={exporting} onClick={exportData} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#18231f] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
        {exporting ? <LoaderCircle size={15} className="animate-spin" /> : <Download size={15} />}
        {exporting ? "Preparando..." : "Descargar mis datos"}
      </button>
      {message ? <p className="mt-4 text-sm font-semibold text-[#60703d]">{message}</p> : null}
    </section>
  );
}
