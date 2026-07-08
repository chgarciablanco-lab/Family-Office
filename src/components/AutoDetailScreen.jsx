import React, { useState } from "react";
import { ArrowLeft, MoreHorizontal, Car, ChevronRight } from "lucide-react";
import AutoForm from "./AutoForm";
import BottomNav from "./BottomNav";
import { colorClasses } from "../lib/format";
import { TIPOS_AUTO } from "../lib/autoTramites";

export default function AutoDetailScreen({ auto, backTo, onNavigate, onSelectTramite, onUpdated }) {
  const [showForm, setShowForm] = useState(false);
  const c = colorClasses[auto.color_tag] || colorClasses.violet;

  const handleSaved = () => {
    setShowForm(false);
    onUpdated();
  };

  return (
    <>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={() => onNavigate(backTo)} aria-label="Volver">
          <ArrowLeft className="w-6 h-6 text-blue-600" strokeWidth={2} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">{auto.marca} {auto.modelo}</h1>
        <button onClick={() => setShowForm(true)} aria-label="Editar auto">
          <MoreHorizontal className="w-6 h-6 text-blue-600" strokeWidth={2.2} />
        </button>
      </div>

      <div className="px-5 flex flex-col gap-3 pb-4">
        <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 flex items-center gap-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${c.bg}`}>
            <Car className={`w-7 h-7 ${c.fg}`} strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 text-lg leading-tight">{auto.marca} {auto.modelo}</p>
            <p className="text-sm text-slate-500 mt-0.5">{auto.patente} · {auto.tipo}</p>
            <p className="text-sm text-slate-500">Año {auto.anio}</p>
          </div>
        </div>

        {TIPOS_AUTO.map((t) => (
          <button
            key={t.key}
            onClick={() => onSelectTramite(t.key)}
            className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${t.bg}`}>
              <t.icon className={`w-7 h-7 ${t.fg}`} strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-base leading-tight">{t.titulo}</p>
              <p className="text-sm text-slate-500 leading-snug mt-0.5">{t.subtitle}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
          </button>
        ))}
      </div>

      <div className="flex-1" />
      <BottomNav variant="detail" onNavigate={onNavigate} />

      {showForm && (
        <AutoForm auto={auto} onClose={() => setShowForm(false)} onSaved={handleSaved} />
      )}
    </>
  );
}
