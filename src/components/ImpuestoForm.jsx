import React, { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { Field, inputClass, selectClass } from "./TramiteSection";
import ConfirmDialog from "./ConfirmDialog";
import { estadoConPago } from "../lib/format";

const estadosImpuesto = ["Pendiente", "Por vencer", "Vencido", "Pagado"];

function emptyForm(registro) {
  return {
    periodo: registro?.periodo || "",
    total_iva: registro?.total_iva || "",
    vencimiento: registro?.vencimiento || "",
    fecha_pago: registro?.fecha_pago || "",
    estado: registro?.estado || "Pendiente",
  };
}

export default function ImpuestoForm({ registro, sociedadId, onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm(registro));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isEditing = Boolean(registro);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      sociedad_id: sociedadId,
      total_iva: form.total_iva ? parseFloat(form.total_iva) : null,
      vencimiento: form.vencimiento || null,
      fecha_pago: form.fecha_pago || null,
      estado: estadoConPago(form.estado, form.fecha_pago),
      updated_at: new Date().toISOString(),
    };

    const query = isEditing
      ? supabase.from("impuestos").update(payload).eq("id", registro.id)
      : supabase.from("impuestos").insert(payload);

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
    const { error } = await supabase.from("impuestos").delete().eq("id", registro.id);
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
            {isEditing ? "Editar F29" : "Nuevo F29"}
          </h2>
          <button onClick={onClose} aria-label="Cerrar">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" className="p-5 flex flex-col gap-4">
          <Field label="Período (mes)">
            <input
              autoComplete="off"
              required
              type="month"
              className={inputClass}
              value={(form.periodo || "").slice(0, 7)}
              onChange={(e) => setForm({ ...form, periodo: e.target.value ? `${e.target.value}-01` : "" })}
            />
          </Field>

          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Total IVA a pagar ($)">
              <input
              autoComplete="off"
                type="number"
                className={inputClass}
                value={form.total_iva}
                onChange={(e) => setForm({ ...form, total_iva: e.target.value })}
                placeholder="0"
              />
            </Field>
            <Field label="Vencimiento">
              <input
              autoComplete="off"
                type="date"
                className={inputClass}
                value={form.vencimiento}
                onChange={(e) => setForm({ ...form, vencimiento: e.target.value })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Fecha de pago">
              <input
                autoComplete="off"
                type="date"
                className={inputClass}
                value={form.fecha_pago}
                onChange={(e) => setForm({ ...form, fecha_pago: e.target.value })}
              />
            </Field>
            <Field label="Estado">
              <select
                className={selectClass}
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value })}
              >
                {estadosImpuesto.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </Field>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex flex-col gap-2 mt-1">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-violet-600 text-white font-semibold text-sm rounded-xl py-3 disabled:opacity-60"
            >
              {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Agregar F29"}
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
          title={"¿Eliminar este registro de impuestos?"}
          message="Esta acción no se puede deshacer."
          onConfirm={() => { setConfirmDelete(false); handleDelete(); }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

    </div>
  );
}
