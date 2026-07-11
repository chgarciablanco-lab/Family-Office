import React, { useState } from "react";
import PinPad from "./PinPad";
import { verificarPin, quitarPin } from "../lib/pinLock";
import { supabase } from "../lib/supabaseClient";

const MAX_INTENTOS = 5;

export default function PinLockScreen({ onUnlock }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [intentos, setIntentos] = useState(0);
  const [verificando, setVerificando] = useState(false);

  const handleDigito = async (d) => {
    if (verificando || pin.length >= 4) return;
    const nuevo = pin + d;
    setPin(nuevo);
    setError(false);
    if (nuevo.length === 4) {
      setVerificando(true);
      const ok = await verificarPin(nuevo);
      setVerificando(false);
      if (ok) {
        onUnlock();
        return;
      }
      setError(true);
      setPin("");
      const restantes = intentos + 1;
      setIntentos(restantes);
      if (restantes >= MAX_INTENTOS) {
        quitarPin();
        await supabase.auth.signOut();
      }
    }
  };

  const handleBorrar = () => {
    setPin((p) => p.slice(0, -1));
    setError(false);
  };

  const handleOlvidoPin = async () => {
    quitarPin();
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-8">
      <img src="/logo.png" alt="García Blanco Family Office" className="w-32 h-32 object-contain mb-3" />
      <p className="text-sm text-slate-500">García Blanco Family Office</p>
      <p className="text-base font-bold text-slate-900 mt-1 mb-6">Ingresa tu PIN</p>

      <div className="flex gap-3 mb-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-3.5 h-3.5 rounded-full border-2 ${
              i < pin.length ? (error ? "bg-red-500 border-red-500" : "bg-violet-600 border-violet-600") : "border-slate-300"
            }`}
          />
        ))}
      </div>

      <p className="text-xs text-red-500 h-4 mb-6">{error ? "PIN incorrecto" : ""}</p>

      <PinPad onDigit={handleDigito} onBorrar={handleBorrar} />

      <button onClick={handleOlvidoPin} className="text-xs text-slate-400 mt-8 underline">
        Olvidé mi PIN, cerrar sesión
      </button>
    </div>
  );
}
