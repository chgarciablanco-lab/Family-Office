import React, { useState } from "react";
import { X, Check } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { Field, inputClass } from "./TramiteSection";
import ConfirmDialog from "./ConfirmDialog";
import { colorClasses } from "../lib/format";
import { ICONOS_ETIQUETA, ICONOS_DISPONIBLES, COLORES_ETIQUETA } from "../lib/etiquetas";

export default function EtiquetaConfigForm({ etiqueta, onClose, onSaved }) {
  const isEditing = Boolean(etiqueta);
  const [nombre, setNombre] = useState(etiqueta?.nombre || "");
  const [icono, setIcono] = useState(etiqueta?.icono || "Tag");
  const [color, setColor] = useState(etiqueta?.color || "slate");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (isEditing) {
      const { error } = await supabase
        .from("etiquetas_gasto")
        .update({ nombre: nombre.trim(), icono, color })
        .eq("id", etiqueta.id);
      setSaving(false);
      if (error) { setError(error.message); return; }
      onSaved();
      return;
    }

    const { data: existentes } = await supabase
      .from("etiquetas_gasto")
      .select("orden")
      .order("orden", { ascending: false })
      .limit(1);
    const siguienteOrden = (existentes?.[0]?.orden || 0) + 1;

    const { error } = await supabase
      .from("etiquetas_gasto")
      .insert({ nombre: nombre.trim(), icono, color, orden: siguienteOrden });
    setSaving(false);
    if (error) { setError(error.message); return; }
    onSaved();
  };

  const handleDelete = async () => {
    setSaving(true);
    setError("");
    const { count } = await supabase
      .from("items_etiqueta_gasto")
      .select("id", { count: "exact", head: true })
      .eq("etiqueta_id", etiqueta.id);
    if ((count || 0) > 0) {
      setSaving(false);
      setError(`No puedes eliminar "${etiqueta.nombre}": tiene ${count} registro${count === 1 ? "" : "s"} guardado${count === 1 ? "" : "s"}. Elimínalos primero.`);
      return;
    }
    const { error } = await supabase.from("etiquetas_gasto").delete().eq("id", etiqueta.id);
    setSaving(false);
    if (error) { setError(error.message); return; }
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-5 pt-5 pb-3 flex items-center justify-between border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">{isEditing ? "Editar etiqueta" : "Nueva etiqueta"}</h2>
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
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Mascotas, Educación, Viajes..."
            />
          </Field>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Ícono</p>
            <div className="grid grid-cols-6 gap-2">
              {ICONOS_DISPONIBLES.map((key) => {
                const Icon = ICONOS_ETIQUETA[key];
                const activo = icono === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setIcono(key)}
                    aria-label={key}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 ${
                      activo ? "border-violet-600 bg-violet-50" : "border-transparent bg-slate-100"
                    }`}
                  >
                    <Icon className="w-5 h-5 text-slate-700" strokeWidth={1.8} />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Color</p>
            <div className="flex flex-wrap gap-2">
              {COLORES_ETIQUETA.map((key) => {
                const c = colorClasses[key];
                const activo = color === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setColor(key)}
                    aria-label={key}
                    className={`w-9 h-9 rounded-full flex items-center justify-center ${c.bg} ${
                      activo ? "ring-2 ring-offset-2 ring-violet-600" : ""
                    }`}
                  >
                    {activo && <Check className={`w-4 h-4 ${c.fg}`} strokeWidth={2.4} />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 px-4 py-3 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorClasses[color].bg}`}>
              {(() => {
                const Preview = ICONOS_ETIQUETA[icono];
                return <Preview className={`w-5 h-5 ${colorClasses[color].fg}`} strokeWidth={1.8} />;
              })()}
            </div>
            <p className="text-sm font-semibold text-slate-700">{nombre || "Vista previa"}</p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex flex-col gap-2 mt-1">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-violet-600 text-white font-semibold text-sm rounded-xl py-3 disabled:opacity-60"
            >
              {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear etiqueta"}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={saving}
                className="w-full text-red-500 font-semibold text-sm rounded-xl py-2.5 border border-red-200"
              >
                Eliminar etiqueta
              </button>
            )}
          </div>
        </form>
      </div>
      {confirmDelete && (
        <ConfirmDialog
          title={`¿Eliminar la etiqueta "${etiqueta.nombre}"?`}
          message="Esta acción no se puede deshacer."
          onConfirm={() => { setConfirmDelete(false); handleDelete(); }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
