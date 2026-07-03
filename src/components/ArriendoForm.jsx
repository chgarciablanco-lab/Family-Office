import React, { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { Field, inputClass } from "./TramiteSection";

const estadosArriendo = ["Pagado", "Pendiente", "Vencido"];
const relaciones = [
  { value: "propia", label: "Propiedad propia arrendada a terceros" },
  { value: "tercero", label: "Propiedad que la sociedad arrienda de terceros" },
];

function emptyForm(arriendo) {
  return {
    nombre: arriendo?.nombre || "",
    tipo: arriendo?.tipo || "",
    ubicacion: arriendo?.ubicacion || "",
    relacion: arriendo?.relacion || "propia",
    contraparte_nombre: arriendo?.contraparte_nombre || "",
    contraparte_rut: arriendo?.contraparte_rut || "",
    monto: arriendo?.monto || "",
    vencimiento: arriendo?.vencimiento || "",
    estado: arriendo?.estado || "Pendiente",
  };
}

export default function ArriendoForm({ arriendo, sociedadId, onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm(arriendo));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEditing = Boolean(arriendo);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      sociedad_id: sociedadId,
      monto: form.monto ? parseFloat(form.monto) : null,
      vencimiento: form.vencimiento || null,
      updated_at: new Date().toISOString(),
    };

    const query = isEditing
      ? supabase.from("arriendos").update(payload).eq("id", arriendo.id)
      : supabase.from("arriendos").insert(payload);

    const { error } = await query;
    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }
    onSaved();
  };

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar el arriendo "${arriendo.nombre}"? Esta acción no se puede deshacer.`)) return;
    setSaving(true);
    const { error } = await supabase.from("arriendos").delete().eq("id", arriendo.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    onSaved();
  };

  const contraparteLabel = form.relacion === "propia" ? "Arrendatario" : "Arrendador";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-5 pt-5 pb-3 flex items-center justify-between border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">
            {isEditing ? "Editar arriendo" : "Nuevo arriendo"}
          </h2>
          <button onClick={onClose} aria-label="Cerrar">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" className="p-5 flex flex-col gap-4">
          <Field label="Relación">
            <select
              className={inputClass}
              value={form.relacion}
              onChange={(e) => setForm({ ...form, relacion: e.target.value })}
            >
              {relaciones.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Nombre de la propiedad">
            <input
              autoComplete="off"
              required
              className={inputClass}
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Oficina Providencia 1201"
            />
          </Field>

          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Tipo">
              <input
              autoComplete="off"
                required
                className={inputClass}
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                placeholder="Oficina, Local..."
              />
            </Field>
            <Field label="Ubicación">
              <input
              autoComplete="off"
                className={inputClass}
                value={form.ubicacion}
                onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
                placeholder="Providencia, Santiago"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Field label={contraparteLabel}>
              <input
              autoComplete="off"
                className={inputClass}
                value={form.contraparte_nombre}
                onChange={(e) => setForm({ ...form, contraparte_nombre: e.target.value })}
              />
            </Field>
            <Field label="Rut">
              <input
              autoComplete="off"
                className={inputClass}
                value={form.contraparte_rut}
                onChange={(e) => setForm({ ...form, contraparte_rut: e.target.value })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Monto ($)">
              <input
              autoComplete="off"
                type="number"
                className={inputClass}
                value={form.monto}
                onChange={(e) => setForm({ ...form, monto: e.target.value })}
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

          <Field label="Estado">
            <select
              className={inputClass}
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value })}
            >
              {estadosArriendo.map((e) => (
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
              {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Agregar arriendo"}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="w-full text-red-500 font-semibold text-sm rounded-xl py-2.5 border border-red-200"
              >
                Eliminar arriendo
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
