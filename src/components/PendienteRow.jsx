import React from "react";
import { estadoPillClasses } from "../lib/format";

export default function PendienteRow({ item }) {
  const p = estadoPillClasses(item.estado);
  const Icon = item.icon;
  return (
    <div className="flex items-center gap-3 px-1">
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
    </div>
  );
}
