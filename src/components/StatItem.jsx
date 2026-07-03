import React from "react";
import { estadoPillClasses, formatCLP, formatMes, formatDia } from "../lib/format";

export default function StatItem({ icon: Icon, label, estado, vence, valor, tipoFecha = "month" }) {
  const p = estadoPillClasses(estado);
  const fechaTexto = tipoFecha === "dia" ? formatDia(vence) : formatMes(vence);
  return (
    <div className="flex items-center gap-3">
      <Icon className="w-5 h-5 text-slate-300 shrink-0" strokeWidth={1.8} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-slate-900 text-base leading-tight">{label}</p>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${p.bg} ${p.text}`}>{estado}</span>
        </div>
        <p className="text-sm text-slate-500 mt-1">Vence: {fechaTexto}</p>
      </div>
      <p className="text-sm font-bold text-slate-900 shrink-0">{formatCLP(valor)}</p>
    </div>
  );
}
