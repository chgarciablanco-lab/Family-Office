import React, { useState } from "react";
import { X } from "lucide-react";
import { Field, inputClass } from "./TramiteSection";
import { subirDocumento } from "../lib/documentos";

export default function NuevaCategoriaDocumentoForm({ entidadTipo, entidadId, onClose, onSaved }) {
  const [nombre, setNombre] = useState("");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Selecciona un archivo para subir.");
      return;
    }
    setSaving(true);
    setError("");
    const { error } = await subirDocumento(entidadTipo, entidadId, nombre.trim(), file);
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
          <h2 className="text-lg font-bold text-slate-900">Nuevo documento</h2>
          <button onClick={onClose} aria-label="Cerrar">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" className="p-5 flex flex-col gap-4">
          <Field label="Nombre del documento">
            <input
              autoComplete="off"
              required
              autoFocus
              className={inputClass}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Cotización remodelación"
            />
          </Field>

          <Field label="Archivo">
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-slate-600"
            />
          </Field>

          <p className="text-xs text-slate-400 -mt-1">
            Queda guardado como su propio documento, con este nombre, separado de las demás categorías.
          </p>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-violet-600 text-white font-semibold text-sm rounded-xl py-3 disabled:opacity-60"
          >
            {saving ? "Subiendo..." : "Subir"}
          </button>
        </form>
      </div>
    </div>
  );
}
