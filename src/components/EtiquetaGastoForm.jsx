import React, { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { Field, inputClass, selectClass } from "./TramiteSection";
import ConfirmDialog from "./ConfirmDialog";

const metodosPago = ["Efectivo", "Tarjeta", "Transferencia"];

function emptyForm(item) {
  return {
    titulo: item?.titulo || "",
    descripcion: item?.descripcion || "",
    monto: item?.monto || "",
    metodo_pago: item?.metodo_pago || "Efectivo",
    fecha: item?.fecha || new Date().toISOString().slice(0, 10),
  };
}

export default function EtiquetaGastoForm({ item, etiquetaId, ownerUserId = null, onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isEditing = Boolean(item);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      monto: parseFloat(form.monto),
      updated_at: new Date().toISOString(),
    };

    const query = isEditing
      ? supabase.from("items_etiqueta_gasto").update(payload).eq("id", item.id)
      : supabase.from("items_etiqueta_gasto").insert({ ...payload, etiqueta_id: etiquetaId, owner_user_id: ownerUserId });

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
    const { error } = await supabase.from("items_etiqueta_gasto").delete().eq("id", item.id);
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
            {isEditing ? "Editar registro" : "Nuevo registro"}
          </h2>
          <button onClick={onClose} aria-label="Cerrar">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" className="p-5 flex flex-col gap-4">
          <Field label="Título">
            <input
              autoComplete="off"
              required
              className={inputClass}
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Descripción breve"
            />
          </Field>

          <Field label="Descripción">
            <input
              autoComplete="off"
              className={inputClass}
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Opcional"
            />
          </Field>

          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Monto ($)">
              <input
                autoComplete="off"
                required
                type="number"
                className={inputClass}
                value={form.monto}
                onChange={(e) => setForm({ ...form, monto: e.target.value })}
                placeholder="0"
              />
            </Field>
            <Field label="Método de pago">
              <select
                className={selectClass}
                value={form.metodo_pago}
                onChange={(e) => setForm({ ...form, metodo_pago: e.target.value })}
              >
                {metodosPago.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Fecha">
            <input
              autoComplete="off"
              required
              type="date"
              className={inputClass}
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            />
          </Field>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex flex-col gap-2 mt-1">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-violet-600 text-white font-semibold text-sm rounded-xl py-3 disabled:opacity-60"
            >
              {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Agregar registro"}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={saving}
                className="w-full text-red-500 font-semibold text-sm rounded-xl py-2.5 border border-red-200"
              >
                Eliminar registro
              </button>
            )}
          </div>
        </form>
      </div>
      {confirmDelete && (
        <ConfirmDialog
          title={`¿Eliminar el registro "${item.titulo}"?`}
          message="Esta acción no se puede deshacer."
          onConfirm={() => { setConfirmDelete(false); handleDelete(); }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
