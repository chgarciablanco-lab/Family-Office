import React, { useState } from "react";
import { X } from "lucide-react";
import { Field, inputClass } from "./TramiteSection";
import { crearEvento } from "../lib/calendario";
import { formatFechaCorta } from "../lib/format";

export default function EventoCalendarioForm({ fecha, onClose, onSaved }) {
  const [titulo, setTitulo] = useState("");
  const [hora, setHora] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const error = await crearEvento({ titulo, fecha, hora, descripcion });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Nueva tarea o reunión</h2>
            <p className="text-xs text-slate-500 mt-0.5">{formatFechaCorta(fecha)}</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" className="p-5 flex flex-col gap-4">
          <Field label="Título">
            <input
              autoComplete="off"
              required
              autoFocus
              className={inputClass}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Reunión con notario, pago de..."
            />
          </Field>

          <Field label="Hora (opcional)">
            <input
              autoComplete="off"
              type="time"
              className={inputClass}
              value={hora}
              onChange={(e) => setHora(e.target.value)}
            />
          </Field>

          <Field label="Descripción (opcional)">
            <input
              autoComplete="off"
              className={inputClass}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detalle adicional"
            />
          </Field>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-violet-600 text-white font-semibold text-sm rounded-xl py-3 disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </form>
      </div>
    </div>
  );
}
