import React, { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { Field, inputClass, selectClass } from "./TramiteSection";
import ConfirmDialog from "./ConfirmDialog";

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
  };
}

export default function PropiedadForm({ propiedad, sociedadId, ownerUserId = null, onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm(propiedad));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isEditing = Boolean(propiedad);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      sociedad_id: sociedadId || null,
      superficie: form.superficie ? parseFloat(form.superficie) : null,
      updated_at: new Date().toISOString(),
    };

    const query = isEditing
      ? supabase.from("propiedades").update(payload).eq("id", propiedad.id)
      : supabase.from("propiedades").insert({ ...payload, owner_user_id: ownerUserId });

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

        <form onSubmit={handleSubmit} autoComplete="off" className="p-5 flex flex-col gap-4">
          <Field label="Nombre">
            <input
              autoComplete="off"
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
              autoComplete="off"
                required
                className={inputClass}
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                placeholder="Casa, Depto, Terreno..."
              />
            </Field>
            <Field label="Comuna">
              <input
              autoComplete="off"
                required
                className={inputClass}
                value={form.comuna}
                onChange={(e) => setForm({ ...form, comuna: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Dirección">
            <input
              autoComplete="off"
              required
              className={inputClass}
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
            />
          </Field>

          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Rol de avalúo (SII)">
              <input
              autoComplete="off"
                className={inputClass}
                value={form.rol_avaluo}
                onChange={(e) => setForm({ ...form, rol_avaluo: e.target.value })}
                placeholder="Opcional"
              />
            </Field>
            <Field label="Superficie (m²)">
              <input
              autoComplete="off"
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
              className={selectClass}
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
              {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Agregar propiedad"}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={saving}
                className="w-full text-red-500 font-semibold text-sm rounded-xl py-2.5 border border-red-200"
              >
                Eliminar propiedad
              </button>
            )}
          </div>
        </form>
      </div>
      {confirmDelete && (
        <ConfirmDialog
          title={`¿Eliminar la propiedad ${propiedad.nombre}?`}
          message="Esta acción no se puede deshacer."
          onConfirm={() => { setConfirmDelete(false); handleDelete(); }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

    </div>
  );
}
