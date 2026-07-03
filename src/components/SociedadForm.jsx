import React, { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { Field, inputClass } from "./TramiteSection";

const coloresDisponibles = ["violet", "blue", "orange", "teal", "pink", "emerald"];
const estadosSociedad = ["Activa", "Suspendida", "Cerrada"];

function emptyForm(sociedad) {
  return {
    nombre: sociedad?.nombre || "",
    rut: sociedad?.rut || "",
    tipo: sociedad?.tipo || "",
    regimen: sociedad?.regimen || "",
    fecha_inicio: sociedad?.fecha_inicio || "",
    estado: sociedad?.estado || "Activa",
    color_tag: sociedad?.color_tag || "violet",
  };
}

export default function SociedadForm({ sociedad, onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm(sociedad));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEditing = Boolean(sociedad);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      fecha_inicio: form.fecha_inicio || null,
      updated_at: new Date().toISOString(),
    };

    const query = isEditing
      ? supabase.from("sociedades").update(payload).eq("id", sociedad.id)
      : supabase.from("sociedades").insert(payload);

    const { error } = await query;
    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }
    onSaved();
  };

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar la sociedad ${sociedad.nombre}? Esta acción no se puede deshacer.`)) return;
    setSaving(true);
    const { error } = await supabase.from("sociedades").delete().eq("id", sociedad.id);
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
            {isEditing ? "Editar sociedad" : "Nueva sociedad"}
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
              placeholder="Garcia Blanco SpA"
            />
          </Field>

          <Field label="Rut">
            <input
              required
              className={inputClass}
              value={form.rut}
              onChange={(e) => setForm({ ...form, rut: e.target.value })}
              placeholder="76.123.456-7"
            />
          </Field>

          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Tipo">
              <input
                required
                className={inputClass}
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                placeholder="SpA, EIRL..."
              />
            </Field>
            <Field label="Régimen tributario">
              <input
                className={inputClass}
                value={form.regimen}
                onChange={(e) => setForm({ ...form, regimen: e.target.value })}
                placeholder="Semi integrado..."
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Fecha de inicio">
              <input
                type="date"
                className={inputClass}
                value={form.fecha_inicio}
                onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
              />
            </Field>
            <Field label="Estado">
              <select
                className={inputClass}
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value })}
              >
                {estadosSociedad.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
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

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex flex-col gap-2 mt-1">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-violet-600 text-white font-semibold text-sm rounded-xl py-3 disabled:opacity-60"
            >
              {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Agregar sociedad"}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="w-full text-red-500 font-semibold text-sm rounded-xl py-2.5 border border-red-200"
              >
                Eliminar sociedad
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
