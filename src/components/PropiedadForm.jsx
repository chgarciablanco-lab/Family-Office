import React, { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { Field, inputClass, SeccionTramite } from "./TramiteSection";

const coloresDisponibles = ["violet", "blue", "orange", "teal", "pink", "emerald"];

function emptyForm(propiedad) {
  return {
    nombre: propiedad?.nombre || "",
    tipo: propiedad?.tipo || "",
    direccion: propiedad?.direccion || "",
    comuna: propiedad?.comuna || "",
    rol_avaluo: propiedad?.rol_avaluo || "",
    superficie: propiedad?.superficie || "",
    color_tag: propiedad?.color_tag || "violet",
    contribuciones_estado: propiedad?.contribuciones_estado || "Al día",
    contribuciones_vence: propiedad?.contribuciones_vence || "",
    contribuciones_valor: propiedad?.contribuciones_valor || "",
    seguro_estado: propiedad?.seguro_estado || "Al día",
    seguro_dia_vencimiento: propiedad?.seguro_dia_vencimiento || "",
    seguro_valor: propiedad?.seguro_valor || "",
    gastos_comunes_estado: propiedad?.gastos_comunes_estado || "Al día",
    gastos_comunes_dia_vencimiento: propiedad?.gastos_comunes_dia_vencimiento || "",
    gastos_comunes_valor: propiedad?.gastos_comunes_valor || "",
  };
}

export default function PropiedadForm({ propiedad, sociedadId, onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm(propiedad));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEditing = Boolean(propiedad);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      sociedad_id: sociedadId || null,
      superficie: form.superficie ? parseFloat(form.superficie) : null,
      contribuciones_valor: form.contribuciones_valor ? parseFloat(form.contribuciones_valor) : null,
      seguro_valor: form.seguro_valor ? parseFloat(form.seguro_valor) : null,
      gastos_comunes_valor: form.gastos_comunes_valor ? parseFloat(form.gastos_comunes_valor) : null,
      contribuciones_vence: form.contribuciones_vence || null,
      seguro_dia_vencimiento: form.seguro_dia_vencimiento ? parseInt(form.seguro_dia_vencimiento, 10) : null,
      gastos_comunes_dia_vencimiento: form.gastos_comunes_dia_vencimiento
        ? parseInt(form.gastos_comunes_dia_vencimiento, 10)
        : null,
      updated_at: new Date().toISOString(),
    };

    const query = isEditing
      ? supabase.from("propiedades").update(payload).eq("id", propiedad.id)
      : supabase.from("propiedades").insert(payload);

    const { error } = await query;
    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }
    onSaved();
  };

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar la propiedad ${propiedad.nombre}? Esta acción no se puede deshacer.`)) return;
    setSaving(true);
    const { error } = await supabase.from("propiedades").delete().eq("id", propiedad.id);
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
            {isEditing ? "Editar propiedad" : "Nueva propiedad"}
          </h2>
          <button onClick={onClose} aria-label="Cerrar">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <Field label="Nombre">
            <input
              required
              className={inputClass}
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Casa Vitacura, Depto Providencia..."
            />
          </Field>

          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Tipo">
              <input
                required
                className={inputClass}
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                placeholder="Casa, Depto, Terreno..."
              />
            </Field>
            <Field label="Comuna">
              <input
                required
                className={inputClass}
                value={form.comuna}
                onChange={(e) => setForm({ ...form, comuna: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Dirección">
            <input
              required
              className={inputClass}
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
            />
          </Field>

          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Rol de avalúo (SII)">
              <input
                className={inputClass}
                value={form.rol_avaluo}
                onChange={(e) => setForm({ ...form, rol_avaluo: e.target.value })}
                placeholder="Opcional"
              />
            </Field>
            <Field label="Superficie (m²)">
              <input
                type="number"
                className={inputClass}
                value={form.superficie}
                onChange={(e) => setForm({ ...form, superficie: e.target.value })}
                placeholder="Opcional"
              />
            </Field>
          </div>

          <Field label="Color de tarjeta">
            <select
              className={inputClass}
              value={form.color_tag}
              onChange={(e) => setForm({ ...form, color_tag: e.target.value })}
            >
              {coloresDisponibles.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>

          <SeccionTramite titulo="Contribuciones" prefix="contribuciones" form={form} setForm={setForm} />
          <SeccionTramite titulo="Seguro" prefix="seguro" form={form} setForm={setForm} tipoFecha="dia" />
          <SeccionTramite titulo="Gastos comunes" prefix="gastos_comunes" form={form} setForm={setForm} tipoFecha="dia" />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex flex-col gap-2 mt-1">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-violet-600 text-white font-semibold text-sm rounded-xl py-3 disabled:opacity-60"
            >
              {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Agregar propiedad"}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="w-full text-red-500 font-semibold text-sm rounded-xl py-2.5 border border-red-200"
              >
                Eliminar propiedad
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
