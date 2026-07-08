import React, { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { Field, inputClass, selectClass } from "./TramiteSection";
import { estadoConPago } from "../lib/format";

const estados = ["Pendiente", "Por vencer", "Vencido", "Pagado"];

export default function PatenteSociedadPagoForm({ pago, titulo, onClose, onSaved }) {
  const [form, setForm] = useState({
    monto: pago.monto ?? "",
    vencimiento: pago.vencimiento || "",
    fecha_pago: pago.fecha_pago || "",
    estado: pago.estado || "Pendiente",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      monto: form.monto ? parseFloat(form.monto) : null,
      vencimiento: form.vencimiento || null,
      fecha_pago: form.fecha_pago || null,
      estado: estadoConPago(form.estado, form.fecha_pago),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("patentes_sociedad").update(payload).eq("id", pago.id);

    if (error) {
      setSaving(false);
      setError(error.message);
      return;
    }
    await supabase.rpc("actualizar_estados_por_vencer");
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-5 pt-5 pb-3 flex items-center justify-between border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 capitalize">{titulo}</h2>
          <button onClick={onClose} aria-label="Cerrar">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" className="p-5 flex flex-col gap-4">
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

          <div className="grid grid-cols-2 gap-x-3 gap-y-3">
            <Field label="Vencimiento">
              <input
                autoComplete="off"
                type="date"
                className={inputClass}
                value={form.vencimiento}
                onChange={(e) => setForm({ ...form, vencimiento: e.target.value })}
              />
            </Field>
            <Field label="Fecha de pago">
              <input
                autoComplete="off"
                type="date"
                className={inputClass}
                value={form.fecha_pago}
                onChange={(e) => setForm({ ...form, fecha_pago: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Estado">
            <select
              className={selectClass}
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value })}
            >
              {estados.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </Field>

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
