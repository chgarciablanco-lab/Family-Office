import React, { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { Field, inputClass, selectClass } from "./TramiteSection";
import { formatMes } from "../lib/format";

const estados = ["Pendiente", "Por vencer", "Pagado"];

export default function MedidorMesForm({ registro, propiedad, tipoServicio, onClose, onSaved }) {
  const [items, setItems] = useState(
    registro.medidores.map((m) => ({
      numero_cliente: m.numero_cliente,
      compania: m.compania,
      valor: m.valor ?? "",
      vencimiento: m.vencimiento || "",
      fecha_pago: m.fecha_pago || "",
      estado: m.estado || "Pendiente",
    }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const actualizarItem = (idx, cambios) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...cambios } : it)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const medidoresFinal = items.map((it) => ({
      numero_cliente: it.numero_cliente,
      compania: it.compania,
      valor: it.valor ? parseFloat(it.valor) : null,
      vencimiento: it.vencimiento || null,
      fecha_pago: it.fecha_pago || null,
      estado: it.estado,
    }));

    const { error } = await supabase
      .from("servicios")
      .update({ medidores: medidoresFinal, updated_at: new Date().toISOString() })
      .eq("id", registro.id);

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
            {tipoServicio} · {formatMes(registro.periodo)}
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
          <p className="text-sm text-slate-500 -mt-1">
            Esta propiedad tiene más de un número de cliente. Edita el valor, la fecha de pago y el estado de cada
            uno para este mes.
          </p>

          {items.map((it, idx) => (
            <div key={idx} className="border border-slate-100 rounded-xl p-3 flex flex-col gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900">N° {it.numero_cliente || "-"}</p>
                <p className="text-xs text-slate-500">{it.compania || "-"}</p>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-3">
                <Field label="Valor ($)">
                  <input
                    autoComplete="off"
                    type="number"
                    className={inputClass}
                    value={it.valor}
                    onChange={(e) => actualizarItem(idx, { valor: e.target.value })}
                    placeholder="0"
                  />
                </Field>
                <Field label="Vencimiento">
                  <input
                    autoComplete="off"
                    type="date"
                    className={inputClass}
                    value={it.vencimiento}
                    onChange={(e) => actualizarItem(idx, { vencimiento: e.target.value })}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-3">
                <Field label="Fecha de pago">
                  <input
                    autoComplete="off"
                    type="date"
                    className={inputClass}
                    value={it.fecha_pago}
                    onChange={(e) => actualizarItem(idx, { fecha_pago: e.target.value })}
                  />
                </Field>
                <Field label="Estado">
                  <select
                    className={selectClass}
                    value={it.estado}
                    onChange={(e) => actualizarItem(idx, { estado: e.target.value })}
                  >
                    {estados.map((e) => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>
          ))}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-violet-600 text-white font-semibold text-sm rounded-xl py-3 disabled:opacity-60 mt-1"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </div>
    </div>
  );
}
