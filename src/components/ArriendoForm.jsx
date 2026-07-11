import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { Field, inputClass, selectClass } from "./TramiteSection";
import ConfirmDialog from "./ConfirmDialog";

const estadosArriendo = ["Pagado", "Pendiente", "Vencido"];
const relaciones = [
  { value: "propia", label: "Propiedad propia arrendada a terceros" },
  { value: "tercero", label: "Propiedad que la sociedad arrienda de terceros" },
];

function emptyForm(arriendo) {
  return {
    propiedad_id: arriendo?.propiedad_id || "",
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

export default function ArriendoForm({ arriendo, sociedadId, ownerUserId = null, onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm(arriendo));
  const [propiedades, setPropiedades] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isEditing = Boolean(arriendo);

  useEffect(() => {
    if (form.relacion !== "propia") return;
    let query = supabase.from("propiedades").select("id, nombre, direccion").order("nombre");
    if (sociedadId) {
      query = query.eq("sociedad_id", sociedadId);
    } else {
      query = query.is("sociedad_id", null);
      query = ownerUserId ? query.eq("owner_user_id", ownerUserId) : query.is("owner_user_id", null);
    }
    query.then(({ data }) => setPropiedades(data || []));
  }, [form.relacion, sociedadId, ownerUserId]);

  const seleccionarPropiedad = (propiedadId) => {
    const p = propiedades.find((x) => x.id === propiedadId);
    setForm({
      ...form,
      propiedad_id: propiedadId,
      nombre: p ? p.nombre : form.nombre,
      ubicacion: p ? p.direccion : form.ubicacion,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.relacion === "propia" && !form.propiedad_id) {
      setError("Selecciona a qué propiedad corresponde este arriendo.");
      return;
    }

    setSaving(true);

    const payload = {
      ...form,
      propiedad_id: form.relacion === "propia" ? form.propiedad_id || null : null,
      sociedad_id: sociedadId,
      monto: form.monto ? parseFloat(form.monto) : null,
      vencimiento: form.vencimiento || null,
      updated_at: new Date().toISOString(),
    };

    const query = isEditing
      ? supabase.from("arriendos").update(payload).eq("id", arriendo.id)
      : supabase.from("arriendos").insert({ ...payload, owner_user_id: ownerUserId });

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
              className={selectClass}
              value={form.relacion}
              onChange={(e) => setForm({ ...form, relacion: e.target.value })}
            >
              {relaciones.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </Field>

          {form.relacion === "propia" && (
            <Field label="Propiedad">
              <select
                className={selectClass}
                value={form.propiedad_id}
                onChange={(e) => seleccionarPropiedad(e.target.value)}
              >
                <option value="" disabled>Selecciona una propiedad</option>
                {propiedades.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1">
                {form.propiedad_id
                  ? "Vinculada: esta propiedad ya no muestra Gastos básicos porque los paga el arrendatario."
                  : "Sin propiedad seleccionada, Gastos básicos seguirá visible para esa propiedad."}
              </p>
            </Field>
          )}

          <Field label="Nombre de la propiedad">
            <input
              autoComplete="off"
              required
              disabled={form.relacion === "propia" && Boolean(form.propiedad_id)}
              className={`${inputClass} disabled:bg-slate-50 disabled:text-slate-400`}
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
                disabled={form.relacion === "propia" && Boolean(form.propiedad_id)}
                className={`${inputClass} disabled:bg-slate-50 disabled:text-slate-400`}
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
              className={selectClass}
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
                onClick={() => setConfirmDelete(true)}
                disabled={saving}
                className="w-full text-red-500 font-semibold text-sm rounded-xl py-2.5 border border-red-200"
              >
                Eliminar arriendo
              </button>
            )}
          </div>
        </form>
      </div>
      {confirmDelete && (
        <ConfirmDialog
          title={`¿Eliminar el arriendo "${arriendo.nombre}"?`}
          message="Esta acción no se puede deshacer."
          onConfirm={() => { setConfirmDelete(false); handleDelete(); }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

    </div>
  );
}
