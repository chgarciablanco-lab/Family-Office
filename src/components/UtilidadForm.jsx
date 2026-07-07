import React, { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { Field, inputClass } from "./TramiteSection";
import ConfirmDialog from "./ConfirmDialog";
import { companiasLuz } from "../lib/companiasChile";

const estados = ["Pendiente", "Por vencer", "Pagado"];

function emptyForm(registro) {
  return {
    compania: registro?.compania || "",
    numero_cliente: registro?.numero_cliente || "",
    periodo: registro?.periodo || "",
    valor: registro?.valor || "",
    vencimiento: registro?.vencimiento || "",
    estado: registro?.estado || "Pendiente",
  };
}

export default function UtilidadForm({ registro, propiedad, sociedadId, tipoServicio, onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm(registro));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [companiaOtra, setCompaniaOtra] = useState(
    tipoServicio === "Luz" && registro?.compania && !companiasLuz.includes(registro.compania)
  );
  const isEditing = Boolean(registro);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      tipo_servicio: tipoServicio,
      propiedad_id: propiedad.id,
      sociedad_id: sociedadId,
      valor: form.valor ? parseFloat(form.valor) : null,
      vencimiento: form.vencimiento || null,
      periodo: form.periodo ? `${form.periodo}-01` : null,
      updated_at: new Date().toISOString(),
    };

    const query = isEditing
      ? supabase.from("servicios").update(payload).eq("id", registro.id)
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
    setSaving(true);
    const { error } = await supabase.from("servicios").delete().eq("id", registro.id);
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
            {isEditing ? `Editar ${tipoServicio.toLowerCase()}` : `Nuevo pago de ${tipoServicio.toLowerCase()}`}
          </h2>
          <button onClick={onClose} aria-label="Cerrar">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="px-5 pt-4">
          <div className="bg-slate-50 rounded-xl px-3.5 py-3">
            <p className="text-sm font-bold text-slate-900">{propiedad.nombre}</p>
            <p className="text-xs text-slate-500 mt-0.5">{propiedad.direccion}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Compañía">
              {tipoServicio === "Luz" ? (
                <>
                  <select
                    className={inputClass}
                    value={companiaOtra ? "Otra" : form.compania}
                    onChange={(e) => {
                      if (e.target.value === "Otra") {
                        setCompaniaOtra(true);
                        setForm({ ...form, compania: "" });
                      } else {
                        setCompaniaOtra(false);
                        setForm({ ...form, compania: e.target.value });
                      }
                    }}
                  >
                    <option value="" disabled>Selecciona una compañía</option>
                    {companiasLuz.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="Otra">Otra</option>
                  </select>
                  {companiaOtra && (
                    <input
                      autoComplete="off"
                      className={`${inputClass} mt-2`}
                      value={form.compania}
                      onChange={(e) => setForm({ ...form, compania: e.target.value })}
                      placeholder="Nombre de la compañía"
                    />
                  )}
                </>
              ) : (
                <input
                  autoComplete="off"
                  className={inputClass}
                  value={form.compania}
                  onChange={(e) => setForm({ ...form, compania: e.target.value })}
                  placeholder="Enel, Aguas Andinas..."
                />
              )}
            </Field>
            <Field label="N° de cliente">
              <input
              autoComplete="off"
                className={inputClass}
                value={form.numero_cliente}
                onChange={(e) => setForm({ ...form, numero_cliente: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Período facturado (mes)">
            <input
              autoComplete="off"
              type="month"
              className={inputClass}
              value={(form.periodo || "").slice(0, 7)}
              onChange={(e) => setForm({ ...form, periodo: e.target.value })}
            />
          </Field>

          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Valor ($)">
              <input
              autoComplete="off"
                required
                type="number"
                className={inputClass}
                value={form.valor}
                onChange={(e) => setForm({ ...form, valor: e.target.value })}
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
              {estados.map((e) => (
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
          title={`¿Eliminar este registro de ${tipoServicio.toLowerCase()}?`}
          message="Esta acción no se puede deshacer."
          onConfirm={() => { setConfirmDelete(false); handleDelete(); }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

    </div>
  );
}
