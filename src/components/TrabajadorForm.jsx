import React, { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { Field, inputClass } from "./TramiteSection";
import ConfirmDialog from "./ConfirmDialog";

function emptyForm(trabajador) {
  return {
    nombre: trabajador?.nombre || "",
    cargo: trabajador?.cargo || "",
    rut: trabajador?.rut || "",
    fecha_contrato: trabajador?.fecha_contrato || "",
    liquidacion: trabajador?.liquidacion || "",
    previred: trabajador?.previred || "",
  };
}

export default function TrabajadorForm({ trabajador, sociedadId, onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm(trabajador));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isEditing = Boolean(trabajador);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      sociedad_id: sociedadId || null,
      fecha_contrato: form.fecha_contrato || null,
      liquidacion: form.liquidacion ? parseFloat(form.liquidacion) : null,
      previred: form.previred ? parseFloat(form.previred) : null,
      updated_at: new Date().toISOString(),
    };

    const query = isEditing
      ? supabase.from("trabajadores").update(payload).eq("id", trabajador.id)
      : supabase.from("trabajadores").insert(payload);

    const { error } = await query;
    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }
    onSaved();
  };

  const handleDelete = async () => {
    setSaving(true);
    const { error } = await supabase.from("trabajadores").delete().eq("id", trabajador.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-5 pt-5 pb-3 flex items-center justify-between border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">
            {isEditing ? "Editar trabajador" : "Nuevo trabajador"}
          </h2>
          <button onClick={onClose} aria-label="Cerrar">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" className="p-5 flex flex-col gap-4">
          <Field label="Nombre">
            <input
              autoComplete="off"
              required
              className={inputClass}
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </Field>

          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Cargo">
              <input
              autoComplete="off"
                required
                className={inputClass}
                value={form.cargo}
                onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                placeholder="Vendedor, Contador..."
              />
            </Field>
            <Field label="Rut">
              <input
              autoComplete="off"
                required
                className={inputClass}
                value={form.rut}
                onChange={(e) => setForm({ ...form, rut: e.target.value })}
                placeholder="12.345.678-9"
              />
            </Field>
          </div>

          <Field label="Fecha de contrato">
            <input
              autoComplete="off"
              type="date"
              className={inputClass}
              value={form.fecha_contrato}
              onChange={(e) => setForm({ ...form, fecha_contrato: e.target.value })}
            />
          </Field>

          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Liquidación ($)">
              <input
              autoComplete="off"
                type="number"
                className={inputClass}
                value={form.liquidacion}
                onChange={(e) => setForm({ ...form, liquidacion: e.target.value })}
                placeholder="0"
              />
            </Field>
            <Field label="Previred a pagar ($)">
              <input
              autoComplete="off"
                type="number"
                className={inputClass}
                value={form.previred}
                onChange={(e) => setForm({ ...form, previred: e.target.value })}
                placeholder="0"
              />
            </Field>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex flex-col gap-2 mt-1">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-violet-600 text-white font-semibold text-sm rounded-xl py-3 disabled:opacity-60"
            >
              {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Agregar trabajador"}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={saving}
                className="w-full text-red-500 font-semibold text-sm rounded-xl py-2.5 border border-red-200"
              >
                Eliminar trabajador
              </button>
            )}
          </div>
        </form>
      </div>
      {confirmDelete && (
        <ConfirmDialog
          title={`¿Eliminar a ${trabajador.nombre}?`}
          message="Esta acción no se puede deshacer."
          onConfirm={() => { setConfirmDelete(false); handleDelete(); }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

    </div>
  );
}
