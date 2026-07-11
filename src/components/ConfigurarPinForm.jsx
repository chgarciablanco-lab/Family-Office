import React, { useState } from "react";
import { X } from "lucide-react";
import PinPad from "./PinPad";
import { configurarPin } from "../lib/pinLock";

export default function ConfigurarPinForm({ onClose, onSaved }) {
  const [paso, setPaso] = useState("crear"); // crear | confirmar
  const [primerPin, setPrimerPin] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleDigito = (d) => {
    if (pin.length >= 4) return;
    const nuevo = pin + d;
    setPin(nuevo);
    if (nuevo.length !== 4) return;

    if (paso === "crear") {
      setPrimerPin(nuevo);
      setPin("");
      setPaso("confirmar");
      return;
    }

    if (nuevo === primerPin) {
      configurarPin(nuevo).then(onSaved);
    } else {
      setError("Los PIN no coinciden, intenta de nuevo.");
      setPrimerPin("");
      setPin("");
      setPaso("crear");
    }
  };

  const handleBorrar = () => setPin((p) => p.slice(0, -1));

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl px-5 pt-5 pb-8 flex flex-col items-center">
        <div className="w-full flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">{paso === "crear" ? "Crea tu PIN" : "Confirma tu PIN"}</h2>
          <button onClick={onClose} aria-label="Cerrar">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex gap-3 mb-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full border-2 ${i < pin.length ? "bg-violet-600 border-violet-600" : "border-slate-300"}`}
            />
          ))}
        </div>
        <p className="text-xs text-red-500 h-4 mb-4">{error}</p>

        <PinPad onDigit={handleDigito} onBorrar={handleBorrar} />
      </div>
    </div>
  );
}
