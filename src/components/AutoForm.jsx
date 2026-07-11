import React, { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { Field, inputClass, selectClass } from "./TramiteSection";
import ConfirmDialog from "./ConfirmDialog";

const coloresDisponibles = ["violet", "blue", "orange", "teal", "pink", "emerald"];

function emptyForm(auto) {
  return {
    patente: auto?.patente || "",
    tipo: auto?.tipo || "",
    marca: auto?.marca || "",
    modelo: auto?.modelo || "",
    anio: auto?.anio || "",
    color_tag: auto?.color_tag || "violet",
  };
}

export default function AutoForm({ auto, ownerUserId = null, onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm(auto));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isEditing = Boolean(auto);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      anio: parseInt(form.anio, 10),
      updated_at: new Date().toISOString(),
    };

    const query = isEditing
      ? supabase.from("autos").update(payload).eq("id", auto.id)
      : supabase.from("autos").insert({ ...payload, owner_user_id: ownerUserId });

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
    const { error } = await supabase.from("autos").delete().eq("id", auto.id);
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
            {isEditing ? "Editar auto" : "Nuevo auto"}
          </h2>
          <button onClick={onClose} aria-label="Cerrar">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Patente">
              <input
              autoComplete="off"
                required
                className={inputClass}
                value={form.patente}
                onChange={(e) => setForm({ ...form, patente: e.target.value.toUpperCase() })}
                placeholder="ABC D12"
              />
            </Field>
            <Field label="Tipo">
              <input
              autoComplete="off"
                required
                className={inputClass}
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                placeholder="SUV, Sedán..."
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Marca">
              <input
              autoComplete="off"
                required
                className={inputClass}
                value={form.marca}
                onChange={(e) => setForm({ ...form, marca: e.target.value })}
              />
            </Field>
            <Field label="Modelo">
              <input
              autoComplete="off"
                required
                className={inputClass}
                value={form.modelo}
                onChange={(e) => setForm({ ...form, modelo: e.target.value })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Año">
              <input
              autoComplete="off"
                required
                type="number"
                className={inputClass}
                value={form.anio}
                onChange={(e) => setForm({ ...form, anio: e.target.value })}
              />
            </Field>
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
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex flex-col gap-2 mt-1">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-violet-600 text-white font-semibold text-sm rounded-xl py-3 disabled:opacity-60"
            >
              {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Agregar auto"}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={saving}
                className="w-full text-red-500 font-semibold text-sm rounded-xl py-2.5 border border-red-200"
              >
                Eliminar auto
              </button>
            )}
          </div>
        </form>
      </div>
      {confirmDelete && (
        <ConfirmDialog
          title={`¿Eliminar el auto ${auto.patente}?`}
          message="Esta acción no se puede deshacer."
          onConfirm={() => { setConfirmDelete(false); handleDelete(); }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

    </div>
  );
}
