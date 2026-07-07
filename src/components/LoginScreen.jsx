import React, { useState } from "react";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResetSent(false);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError("Usuario o contraseña incorrectos.");
  };

  const handleForgotPassword = async () => {
    setError("");
    setResetSent(false);
    if (!email) {
      setError('Escribe tu correo arriba y luego toca "¿Olvidaste tu contraseña?".');
      return;
    }
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    setResetLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setResetSent(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center items-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <img src="/logo.png" alt="García Blanco Family Office" className="w-36 h-36 object-contain mb-4" />
          <h1 className="font-serif text-3xl tracking-wide text-navy-900">GARCÍA BLANCO</h1>
          <p className="font-serif tracking-[0.3em] text-gold-600 text-sm mt-2">
            FAMILY OFFICE
          </p>
          <div className="w-10 h-px bg-gold-500 my-4" />
          <p className="font-serif text-navy-900 text-base">Gestión patrimonial privada</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="font-serif text-navy-900 text-sm">Usuario</label>
            <div className="mt-1.5 flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-3 focus-within:border-gold-500">
              <User className="w-4 h-4 text-gold-600 shrink-0" strokeWidth={1.8} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ingresa tu usuario"
                className="flex-1 outline-none text-sm text-slate-700 placeholder-slate-400 bg-transparent"
              />
            </div>
          </div>

          <div>
            <label className="font-serif text-navy-900 text-sm">Contraseña</label>
            <div className="mt-1.5 flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-3 focus-within:border-gold-500">
              <Lock className="w-4 h-4 text-gold-600 shrink-0" strokeWidth={1.8} />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
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

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          {resetSent && (
            <p className="text-sm text-emerald-600 text-center">
              Te enviamos un correo para restablecer tu contraseña.
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-navy-900 text-white font-serif text-base rounded-lg py-3.5 mt-2 disabled:opacity-60"
          >
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleForgotPassword}
          disabled={resetLoading}
          className="block w-full text-center text-gold-600 font-serif text-sm mt-5 disabled:opacity-60"
        >
          {resetLoading ? "Enviando..." : "¿Olvidaste tu contraseña?"}
        </button>
      </div>
    </div>
  );
}
