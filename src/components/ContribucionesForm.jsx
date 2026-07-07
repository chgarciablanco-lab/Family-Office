import React, { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { Field, inputClass, selectClass } from "./TramiteSection";
import ConfirmDialog from "./ConfirmDialog";
import { estadoConPago } from "../lib/format";

const cuotas = ["1era cuota (abril)", "2da cuota (junio)", "3era cuota (septiembre)", "4ta cuota (noviembre)"];
const estados = ["Pendiente", "Por vencer", "Vencido", "Pagado"];

function rolVacio(rol = "") {
  return { rol, valor: "", vencimiento: "", fecha_pago: "", estado: "Pendiente" };
}

export default function ContribucionesForm({ registro, propiedad, sociedadId, onClose, onSaved }) {
  const isEditing = Boolean(registro);
  const [cuota, setCuota] = useState(registro?.cuota || cuotas[0]);
  const [roles, setRoles] = useState(
    isEditing
      ? [
          {
            rol: registro.numero_cliente || "",
            valor: registro.valor ?? "",
            vencimiento: registro.vencimiento || "",
            fecha_pago: registro.fecha_pago || "",
            estado: registro.estado || "Pendiente",
          },
        ]
      : [rolVacio(propiedad.rol_avaluo || "")]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const actualizarRol = (idx, cambios) => {
    setRoles((prev) => prev.map((r, i) => (i === idx ? { ...r, ...cambios } : r)));
  };
  const agregarRol = () => setRoles((prev) => [...prev, rolVacio()]);
  const quitarRol = (idx) => setRoles((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const base = {
      tipo_servicio: "Contribuciones",
      propiedad_id: propiedad.id,
      sociedad_id: sociedadId,
      cuota,
      updated_at: new Date().toISOString(),
    };

    const payload =
      roles.length === 1
        ? {
            ...base,
            numero_cliente: roles[0].rol || null,
            valor: roles[0].valor ? parseFloat(roles[0].valor) : null,
            vencimiento: roles[0].vencimiento || null,
            fecha_pago: roles[0].fecha_pago || null,
            estado: estadoConPago(roles[0].estado, roles[0].fecha_pago),
            medidores: null,
          }
        : {
            ...base,
            numero_cliente: null,
            compania: null,
            valor: null,
            vencimiento: null,
            fecha_pago: null,
            estado: "Pendiente",
            medidores: roles.map((r) => ({
              numero_cliente: r.rol || null,
              compania: null,
              valor: r.valor ? parseFloat(r.valor) : null,
              vencimiento: r.vencimiento || null,
              fecha_pago: r.fecha_pago || null,
              estado: estadoConPago(r.estado, r.fecha_pago),
            })),
          };

    const query = isEditing
      ? supabase.from("servicios").update(payload).eq("id", registro.id)
      : supabase.from("servicios").insert(payload);

    const { error } = await query;

    if (error) {
      setSaving(false);
      setError(error.message);
      return;
    }
    await supabase.rpc("actualizar_estados_por_vencer");
    setSaving(false);
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
            {isEditing ? "Editar contribuciones" : "Nuevo pago de contribuciones"}
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
          <Field label="Cuota">
            <select className={selectClass} value={cuota} onChange={(e) => setCuota(e.target.value)}>
              {cuotas.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>

          <p className="text-sm text-slate-500 -mt-1">
            Si la propiedad tiene más de un rol, agrégalos todos aquí mismo — quedarán juntos en la misma cuota.
          </p>

          {roles.map((r, idx) => (
            <div key={idx} className="border border-slate-100 rounded-xl p-3 flex flex-col gap-3">
              {roles.length > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500">Rol {idx + 1}</p>
                  <button type="button" onClick={() => quitarRol(idx)} aria-label="Quitar este rol">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              )}

              <Field label="Rol de la propiedad">
                <input
                  autoComplete="off"
                  className={inputClass}
                  value={r.rol}
                  onChange={(e) => actualizarRol(idx, { rol: e.target.value })}
                  placeholder="Ej. 1234-5"
                />
              </Field>

              <div className="grid grid-cols-2 gap-x-3 gap-y-3">
                <Field label="Valor ($)">
                  <input
                    autoComplete="off"
                    required
                    type="number"
                    className={inputClass}
                    value={r.valor}
                    onChange={(e) => actualizarRol(idx, { valor: e.target.value })}
                    placeholder="0"
                  />
                </Field>
                <Field label="Vencimiento">
                  <input
                    autoComplete="off"
                    type="date"
                    className={inputClass}
                    value={r.vencimiento}
                    onChange={(e) => actualizarRol(idx, { vencimiento: e.target.value })}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-3">
                <Field label="Fecha de pago">
                  <input
                    autoComplete="off"
                    type="date"
                    className={inputClass}
                    value={r.fecha_pago}
                    onChange={(e) => actualizarRol(idx, { fecha_pago: e.target.value })}
                  />
                </Field>
                <Field label="Estado">
                  <select
                    className={selectClass}
                    value={r.estado}
                    onChange={(e) => actualizarRol(idx, { estado: e.target.value })}
                  >
                    {estados.map((e) => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={agregarRol}
            className="flex items-center justify-center gap-1.5 text-sm font-semibold text-violet-600 py-1"
          >
            <Plus className="w-4 h-4" strokeWidth={2.4} />
            Agregar otro rol
          </button>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex flex-col gap-2 mt-1">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-violet-600 text-white font-semibold text-sm rounded-xl py-3 disabled:opacity-60"
            >
              {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Agregar cuota"}
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
          title={"¿Eliminar este registro de contribuciones?"}
          message="Esta acción no se puede deshacer."
          onConfirm={() => { setConfirmDelete(false); handleDelete(); }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

    </div>
  );
}
