import React, { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { Field, inputClass } from "./TramiteSection";

const tiposServicio = ["Luz", "Agua", "Gas", "Internet", "Gastos comunes", "Seguros"];
const estadosServicio = ["Pendiente", "Al día", "Por vencer", "Pagado"];

function emptyForm(servicio) {
  return {
    tipo_servicio: servicio?.tipo_servicio || tiposServicio[0],
    compania: servicio?.compania || "",
    numero_cliente: servicio?.numero_cliente || "",
    valor: servicio?.valor || "",
    vencimiento: servicio?.vencimiento || "",
    estado: servicio?.estado || "Pendiente",
  };
}

export default function ServicioForm({ servicio, sociedadId, propiedadId, onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm(servicio));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEditing = Boolean(servicio);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      sociedad_id: sociedadId,
      propiedad_id: propiedadId,
      valor: form.valor ? parseFloat(form.valor) : null,
      vencimiento: form.vencimiento || null,
      updated_at: new Date().toISOString(),
    };

    const query = isEditing
      ? supabase.from("servicios").update(payload).eq("id", servicio.id)
      : supabase.from("servicios").insert(payload);

    const { error } = await query;
    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }
    onSaved();
  };

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar este servicio (${servicio.tipo_servicio})? Esta acción no se puede deshacer.`)) return;
    setSaving(true);
    const { error } = await supabase.from("servicios").delete().eq("id", servicio.id);
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
            {isEditing ? "Editar servicio" : "Nuevo servicio"}
          </h2>
          <button onClick={onClose} aria-label="Cerrar">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <Field label="Tipo de servicio">
            <select
              className={inputClass}
              value={form.tipo_servicio}
              onChange={(e) => setForm({ ...form, tipo_servicio: e.target.value })}
            >
              {tiposServicio.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Compañía">
              <input
                className={inputClass}
                value={form.compania}
                onChange={(e) => setForm({ ...form, compania: e.target.value })}
                placeholder="Enel, Aguas Andinas..."
              />
            </Field>
            <Field label="N° de cliente">
              <input
                className={inputClass}
                value={form.numero_cliente}
                onChange={(e) => setForm({ ...form, numero_cliente: e.target.value })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Valor ($)">
              <input
                type="number"
                className={inputClass}
                value={form.valor}
                onChange={(e) => setForm({ ...form, valor: e.target.value })}
                placeholder="0"
              />
            </Field>
            <Field label="Vencimiento">
              <input
                type="date"
                className={inputClass}
                value={form.vencimiento}
                onChange={(e) => setForm({ ...form, vencimiento: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Estado">
            <select
              className={inputClass}
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value })}
            >
              {estadosServicio.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </Field>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex flex-col gap-2 mt-1">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-violet-600 text-white font-semibold text-sm rounded-xl py-3 disabled:opacity-60"
            >
              {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Agregar servicio"}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="w-full text-red-500 font-semibold text-sm rounded-xl py-2.5 border border-red-200"
              >
                Eliminar servicio
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
