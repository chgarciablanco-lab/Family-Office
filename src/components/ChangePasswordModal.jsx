import React, { useState } from "react";
import { X, Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function ChangePasswordModal({ onClose }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }
    setSuccess(true);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-5 pt-5 pb-3 flex items-center justify-between border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Cambiar contraseña</h2>
          <button onClick={onClose} aria-label="Cerrar">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {success ? (
          <div className="p-5 flex flex-col gap-4">
            <p className="text-sm text-slate-600">Tu contraseña se actualizó correctamente.</p>
            <button
              onClick={onClose}
              className="w-full bg-violet-600 text-white font-semibold text-sm rounded-xl py-3"
            >
              Listo
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500">Nueva contraseña</label>
              <div className="mt-1 flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2.5 focus-within:border-violet-400">
                <Lock className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={1.8} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="flex-1 outline-none text-sm text-slate-700 placeholder-slate-400 bg-transparent"
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label="Mostrar contraseña">
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-slate-400" strokeWidth={1.8} />
                  ) : (
                    <Eye className="w-4 h-4 text-slate-400" strokeWidth={1.8} />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500">Confirmar contraseña</label>
              <div className="mt-1 flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2.5 focus-within:border-violet-400">
                <Lock className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={1.8} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="flex-1 outline-none text-sm text-slate-700 placeholder-slate-400 bg-transparent"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-violet-600 text-white font-semibold text-sm rounded-xl py-3 disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Guardar nueva contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
