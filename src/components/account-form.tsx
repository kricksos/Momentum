"use client";

import { LoaderCircle } from "lucide-react";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

type AccountFormProps = { initialName: string; initialEmail: string };

export function AccountForm({ initialName, initialEmail }: AccountFormProps) {
  const [name, setName] = useState(initialName);
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  async function saveName() {
    if (!name.trim()) { setNameMessage("El nombre no puede estar vacío."); return; }
    setIsSavingName(true);
    setNameMessage(null);
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    const [{ error: metadataError }, { error: profileError }] = await Promise.all([
      supabase.auth.updateUser({ data: { name: name.trim() } }),
      auth.user ? supabase.from("profiles").update({ name: name.trim() }).eq("user_id", auth.user.id) : Promise.resolve({ error: null }),
    ]);
    setIsSavingName(false);
    setNameMessage(metadataError || profileError ? "No hemos podido guardar tu nombre. Inténtalo de nuevo." : "Nombre actualizado.");
  }

  async function savePassword() {
    if (newPassword.length < 8) { setPasswordMessage("La contraseña debe tener al menos 8 caracteres."); return; }
    if (newPassword !== confirmPassword) { setPasswordMessage("Las contraseñas no coinciden."); return; }
    setIsSavingPassword(true);
    setPasswordMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsSavingPassword(false);
    setPasswordMessage(error ? "No hemos podido actualizar tu contraseña. Inténtalo de nuevo." : "Contraseña actualizada.");
    if (!error) { setNewPassword(""); setConfirmPassword(""); }
  }

  return (
    <div className="mt-8 space-y-6">
      <section className="rounded-3xl border border-[#d3dbcf] bg-[#f8f7f1] p-6">
        <h2 className="text-lg font-semibold">Nombre</h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input value={name} onChange={(event) => setName(event.target.value)} className="w-full max-w-xs rounded-xl border border-[#d3dbcf] bg-white px-3 py-2 text-base" />
          <button type="button" disabled={isSavingName} onClick={saveName} className="flex items-center gap-2 rounded-full bg-[#18231f] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {isSavingName ? <LoaderCircle size={16} className="animate-spin" /> : "Guardar"}
          </button>
        </div>
        {nameMessage ? <p className="mt-3 text-sm text-[#68736b]">{nameMessage}</p> : null}
      </section>

      <section className="rounded-3xl border border-[#d3dbcf] bg-[#f8f7f1] p-6">
        <h2 className="text-lg font-semibold">Email</h2>
        <p className="mt-2 text-sm text-[#68736b]">El email es la identidad principal del usuario y no se modifica desde aquí.</p>
        <div className="mt-4 rounded-xl border border-[#d3dbcf] bg-white px-3 py-2 text-sm font-medium text-[#18231f]">{initialEmail}</div>
      </section>

      <section className="rounded-3xl border border-[#d3dbcf] bg-[#f8f7f1] p-6">
        <h2 className="text-lg font-semibold">Contraseña</h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input type="password" placeholder="Nueva contraseña" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="w-full max-w-xs rounded-xl border border-[#d3dbcf] bg-white px-3 py-2 text-base" />
          <input type="password" placeholder="Confirmar contraseña" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full max-w-xs rounded-xl border border-[#d3dbcf] bg-white px-3 py-2 text-base" />
          <button type="button" disabled={isSavingPassword} onClick={savePassword} className="flex items-center gap-2 rounded-full bg-[#18231f] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {isSavingPassword ? <LoaderCircle size={16} className="animate-spin" /> : "Guardar"}
          </button>
        </div>
        {passwordMessage ? <p className="mt-3 text-sm text-[#68736b]">{passwordMessage}</p> : null}
      </section>
    </div>
  );
}
