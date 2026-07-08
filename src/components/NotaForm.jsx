import React, { useState } from "react";
import { X, Trash2 } from "lucide-react";
import { Field, inputClass } from "./TramiteSection";
import { colorClasses } from "../lib/format";
import { crearNota, actualizarNota, eliminarNota } from "../lib/notas";
import ConfirmDialog from "./ConfirmDialog";

const COLORES = ["amber", "violet", "blue", "emerald", "orange", "pink", "teal"];

export default function NotaForm({ nota, onClose, onSaved, onDeleted }) {
  const esEdicion = Boolean(nota);
  const [titulo, setTitulo] = useState(nota?.titulo || "");
  const [contenido, setContenido] = useState(nota?.contenido || "");
  const [color, setColor] = useState(nota?.color || "amber");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const err = esEdicion
      ? await actualizarNota(nota.id, { titulo, contenido, color })
      : await crearNota({ titulo, contenido, color });
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    onSaved();
  };

  const handleDelete = async () => {
    setConfirmDelete(false);
    await eliminarNota(nota.id);
    if (onDeleted) onDeleted();
    else onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">{esEdicion ? "Editar nota" : "Nueva nota"}</h2>
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
              placeholder="Título de la nota"
            />
          </Field>

          <Field label="Contenido">
            <textarea
              className={`${inputClass} h-64 py-2.5 resize-none`}
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              placeholder="Escribe aquí..."
            />
          </Field>

          <Field label="Color">
            <div className="flex items-center gap-2 flex-wrap">
              {COLORES.map((c) => {
                const cl = colorClasses[c];
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={`Color ${c}`}
                    className={`w-8 h-8 rounded-full ${cl.bg} flex items-center justify-center ${
                      color === c ? "ring-2 ring-offset-2 ring-violet-500" : ""
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full ${cl.fg.replace("text-", "bg-")}`} />
                  </button>
                );
              })}
            </div>
          </Field>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-violet-600 text-white font-semibold text-sm rounded-xl py-3 disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>

          {esEdicion && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="w-full flex items-center justify-center gap-2 text-red-500 font-semibold text-sm py-1"
            >
              <Trash2 className="w-4 h-4" strokeWidth={2} />
              Eliminar nota
            </button>
          )}
        </form>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="¿Eliminar esta nota?"
          message="Esta acción no se puede deshacer."
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
