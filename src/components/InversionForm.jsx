import React, { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { Field, inputClass, selectClass } from "./TramiteSection";
import ConfirmDialog from "./ConfirmDialog";

const estadosInversion = ["Activa", "Por vencer", "Vencida", "Liquidada"];

function emptyForm(inversion) {
  return {
    nombre: inversion?.nombre || "",
    institucion: inversion?.institucion || "",
    monto: inversion?.monto || "",
    fecha: inversion?.fecha || new Date().toISOString().slice(0, 10),
    rentabilidad: inversion?.rentabilidad || "",
    vencimiento: inversion?.vencimiento || "",
    estado: inversion?.estado || "Activa",
    observaciones: inversion?.observaciones || "",
  };
}

export default function InversionForm({ inversion, sociedadId, onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm(inversion));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isEditing = Boolean(inversion);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      sociedad_id: sociedadId || null,
      monto: form.monto ? parseFloat(form.monto) : null,
      fecha: form.fecha || null,
      vencimiento: form.vencimiento || null,
      updated_at: new Date().toISOString(),
    };

    const query = isEditing
      ? supabase.from("inversiones").update(payload).eq("id", inversion.id)
      : supabase.from("inversiones").insert(payload);

    const { error } = await query;

    if (error) {
      setSaving(false);
      setError(error.message);
      return;
    }
    await supabase.rpc("actualizar_estados_por_vencer");
    setSaving(false);
    onSaved();
  };

  const handleDelete = async () => {
    setSaving(true);
    const { error } = await supabase.from("inversiones").delete().eq("id", inversion.id);
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
            {isEditing ? "Editar inversión" : "Nueva inversión"}
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
              placeholder="Depósito a plazo, Fondo mutuo..."
            />
          </Field>

          <Field label="Institución">
            <input
              autoComplete="off"
              className={inputClass}
              value={form.institucion}
              onChange={(e) => setForm({ ...form, institucion: e.target.value })}
              placeholder="Banco, corredora..."
            />
          </Field>

          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Monto invertido ($)">
              <input
                autoComplete="off"
                type="number"
                className={inputClass}
                value={form.monto}
                onChange={(e) => setForm({ ...form, monto: e.target.value })}
                placeholder="0"
              />
            </Field>
            <Field label="Rentabilidad">
              <input
                autoComplete="off"
                className={inputClass}
                value={form.rentabilidad}
                onChange={(e) => setForm({ ...form, rentabilidad: e.target.value })}
                placeholder="Ej. 5% anual"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Fecha de inversión">
              <input
                autoComplete="off"
                type="date"
                className={inputClass}
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              />
            </Field>
            <Field label="Vencimiento">
              <input
                autoComplete="off"
                type="date"
                className={inputClass}
                value={form.vencimiento}
                onChange={(e) => setForm({ ...form, vencimiento: e.target.value })}
                placeholder="Opcional"
              />
            </Field>
          </div>

          <Field label="Estado">
            <select
              className={selectClass}
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value })}
            >
              {estadosInversion.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </Field>

          <Field label="Observaciones">
            <input
              autoComplete="off"
              className={inputClass}
              value={form.observaciones}
              onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
              placeholder="Opcional"
            />
          </Field>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex flex-col gap-2 mt-1">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-violet-600 text-white font-semibold text-sm rounded-xl py-3 disabled:opacity-60"
            >
              {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Agregar inversión"}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={saving}
                className="w-full text-red-500 font-semibold text-sm rounded-xl py-2.5 border border-red-200"
              >
                Eliminar inversión
              </button>
            )}
          </div>
        </form>
      </div>
      {confirmDelete && (
        <ConfirmDialog
          title={`¿Eliminar la inversión "${inversion.nombre}"?`}
          message="Esta acción no se puede deshacer."
          onConfirm={() => { setConfirmDelete(false); handleDelete(); }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
