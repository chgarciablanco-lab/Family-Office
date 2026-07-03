import React, { useState } from "react";
import { TreeDeciduous, Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function ResetPasswordScreen({ onDone }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    await supabase.auth.signOut();
    setLoading(false);
    setSuccess(true);
    setTimeout(onDone, 1800);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center items-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-24 h-24 rounded-full border border-gold-500 flex items-center justify-center mb-4">
            <TreeDeciduous className="w-12 h-12 text-gold-600" strokeWidth={1.3} />
          </div>
          <h1 className="font-serif text-3xl tracking-wide text-navy-900">GARCÍA BLANCO</h1>
          <p className="font-serif tracking-[0.3em] text-gold-600 text-sm mt-2">
            FAMILY OFFICE
          </p>
          <div className="w-10 h-px bg-gold-500 my-4" />
          <p className="font-serif text-navy-900 text-base">Crea tu nueva contraseña</p>
        </div>

        {success ? (
          <p className="text-center text-sm text-slate-600">
            Contraseña actualizada. Te llevamos al inicio de sesión...
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="font-serif text-navy-900 text-sm">Nueva contraseña</label>
              <div className="mt-1.5 flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-3 focus-within:border-gold-500">
                <Lock className="w-4 h-4 text-gold-600 shrink-0" strokeWidth={1.8} />
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
                    <EyeOff className="w-4 h-4 text-gold-600" strokeWidth={1.8} />
                  ) : (
                    <Eye className="w-4 h-4 text-gold-600" strokeWidth={1.8} />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="font-serif text-navy-900 text-sm">Confirmar contraseña</label>
              <div className="mt-1.5 flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-3 focus-within:border-gold-500">
                <Lock className="w-4 h-4 text-gold-600 shrink-0" strokeWidth={1.8} />
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

            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="bg-navy-900 text-white font-serif text-base rounded-lg py-3.5 mt-2 disabled:opacity-60"
            >
              {loading ? "Guardando..." : "Guardar nueva contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
