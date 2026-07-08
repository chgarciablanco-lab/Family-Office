import React, { useState } from "react";
import { Check, X } from "lucide-react";
import { estadoPillClasses } from "../lib/format";
import { marcarComoPagado, MODULO_DE_TABLA } from "../lib/pendientes";
import { Field, inputClass } from "./TramiteSection";
import { usePermisos } from "../context/PermisosContext";

export default function PendienteRow({ item, onDone }) {
  const { puedeEditar } = usePermisos();
  const editable = puedeEditar(MODULO_DE_TABLA[item.tabla]);
  const [showForm, setShowForm] = useState(false);
  const [monto, setMonto] = useState("");
  const [saving, setSaving] = useState(false);
  const p = estadoPillClasses(item.estado);
  const Icon = item.icon;

  const abrirForm = () => {
    setMonto(item.monto ?? "");
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await marcarComoPagado(item, monto);
    setSaving(false);
    setShowForm(false);
    onDone?.();
  };

  return (
    <div className="flex items-center gap-2 px-1">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.bg}`}>
        <Icon className={`w-4 h-4 ${item.fg}`} strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-slate-900 leading-tight truncate">{item.grupo} · {item.tipo}</p>
        <p className="text-[11.5px] text-slate-500 mt-0.5 truncate">{item.sub}</p>
      </div>
      <span className={`text-[10.5px] font-bold px-2.5 py-1 rounded-full shrink-0 ${p.bg} ${p.text}`}>
        {item.estado}
      </span>
      {editable && (
        <button
          onClick={abrirForm}
          aria-label="Marcar como pagado"
          className="w-7 h-7 rounded-full border border-emerald-200 bg-emerald-50 flex items-center justify-center shrink-0"
        >
          <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2.5} />
        </button>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl">
            <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">{item.grupo} · {item.tipo}</h2>
              <button onClick={() => setShowForm(false)} aria-label="Cerrar">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} autoComplete="off" className="p-5 flex flex-col gap-4">
              <Field label="Monto pagado ($)">
                <input
                  autoComplete="off"
                  autoFocus
                  type="number"
                  className={inputClass}
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="0"
                />
              </Field>

              <p className="text-xs text-slate-400 -mt-2">La fecha de pago quedará registrada como hoy.</p>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-violet-600 text-white font-semibold text-sm rounded-xl py-3 disabled:opacity-60"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
