import React, { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { estadoPillClasses } from "../lib/format";
import { marcarComoPagado } from "../lib/pendientes";
import ConfirmDialog from "./ConfirmDialog";

export default function PendienteRow({ item, onDone }) {
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const p = estadoPillClasses(item.estado);
  const Icon = item.icon;

  const handleConfirm = async () => {
    setConfirming(false);
    setSaving(true);
    await marcarComoPagado(item);
    setSaving(false);
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
      <button
        onClick={() => setConfirming(true)}
        disabled={saving}
        aria-label="Marcar como pagado"
        className="w-7 h-7 rounded-full border border-emerald-200 bg-emerald-50 flex items-center justify-center shrink-0 disabled:opacity-50"
      >
        {saving ? (
          <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
        ) : (
          <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2.5} />
        )}
      </button>

      {confirming && (
        <ConfirmDialog
          title="¿Marcar como pagado?"
          message={`${item.grupo} · ${item.tipo} se marcará como pagado hoy.`}
          confirmLabel="Marcar pagado"
          onConfirm={handleConfirm}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
