import React, { useState } from "react";
import {
  ArrowLeft, MoreHorizontal, Building2, Calendar, Users, FileText,
  Home as HomeIcon, Key, ClipboardList, ChevronRight, Info,
} from "lucide-react";
import SociedadForm from "./SociedadForm";
import BottomNav from "./BottomNav";
import { colorClasses, estadoSociedadPillClasses, formatFechaCorta } from "../lib/format";

const secciones = [
  { key: "propiedades-sociedad", title: "Propiedades", subtitle: "Administra las propiedades y sus\ngastos básicos.", icon: HomeIcon, bg: "bg-blue-100", fg: "text-blue-600" },
  { key: "arriendos-sociedad", title: "Arriendos", subtitle: "Administra contratos de arriendo\ny pagos asociadas.", icon: Key, bg: "bg-orange-100", fg: "text-orange-500" },
  { key: "trabajadores-sociedad", title: "Trabajadores", subtitle: "Gestiona la información y contratos\nde los trabajadores.", icon: Users, bg: "bg-emerald-100", fg: "text-emerald-600" },
  { key: "impuestos-sociedad", title: "Impuestos", subtitle: "Revisa y gestiona impuestos y\ndeclaraciones.", icon: FileText, bg: "bg-violet-100", fg: "text-violet-600" },
  { key: "otros-gastos-sociedad", title: "Otros gastos", subtitle: "Registra y controla los gastos\ndiarios de la sociedad.", icon: ClipboardList, bg: "bg-amber-100", fg: "text-amber-500" },
];

export default function SociedadDetailScreen({ sociedad, onNavigate, onUpdated }) {
  const [showForm, setShowForm] = useState(false);
  const c = colorClasses[sociedad.color_tag] || colorClasses.violet;
  const p = estadoSociedadPillClasses(sociedad.estado);

  const handleSaved = () => {
    setShowForm(false);
    onUpdated();
  };

  return (
    <>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={() => onNavigate("sociedades-list")} aria-label="Volver">
          <ArrowLeft className="w-6 h-6 text-blue-600" strokeWidth={2} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">{sociedad.nombre}</h1>
        <button onClick={() => setShowForm(true)} aria-label="Editar sociedad">
          <MoreHorizontal className="w-6 h-6 text-blue-600" strokeWidth={2.2} />
        </button>
      </div>

      <div className="px-5 flex flex-col gap-3 pb-4">
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 pt-4 pb-3 text-left"
        >
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${c.bg}`}>
              <Building2 className={`w-7 h-7 ${c.fg}`} strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-lg leading-tight">{sociedad.nombre}</p>
              <p className="text-sm text-slate-500 mt-0.5">Rut: {sociedad.rut}</p>
              <span className={`inline-block mt-2 text-xs font-semibold px-2.5 py-0.5 rounded-full ${p.bg} ${p.text}`}>
                {sociedad.estado}
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-1">
              <Calendar className="w-4 h-4 text-slate-400" strokeWidth={1.8} />
              <p className="text-[11px] text-slate-500 leading-tight">Fecha de inicio</p>
              <p className="text-sm font-bold text-slate-900">{formatFechaCorta(sociedad.fecha_inicio)}</p>
            </div>
            <div className="flex flex-col gap-1">
              <Users className="w-4 h-4 text-slate-400" strokeWidth={1.8} />
              <p className="text-[11px] text-slate-500 leading-tight">Tipo de sociedad</p>
              <p className="text-sm font-bold text-slate-900">{sociedad.tipo}</p>
            </div>
            <div className="flex flex-col gap-1">
              <FileText className="w-4 h-4 text-slate-400" strokeWidth={1.8} />
              <p className="text-[11px] text-slate-500 leading-tight">Régimen tributario</p>
              <p className="text-sm font-bold text-slate-900">{sociedad.regimen || "-"}</p>
            </div>
          </div>
        </button>

        {secciones.map((sec) => (
          <button
            key={sec.key}
            onClick={() => onNavigate(sec.key)}
            className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${sec.bg}`}>
              <sec.icon className={`w-7 h-7 ${sec.fg}`} strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-base leading-tight">{sec.title}</p>
              <p className="text-sm text-slate-500 leading-snug whitespace-pre-line mt-0.5">{sec.subtitle}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
          </button>
        ))}

        <div className="bg-white rounded-2xl border border-slate-100 px-4 py-4 flex items-start gap-3 mb-2">
          <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" strokeWidth={1.8} />
          <div>
            <p className="font-bold text-slate-900 text-sm">Información importante</p>
            <p className="text-sm text-slate-500 mt-0.5">Mantén actualizada la información de tu sociedad para una correcta gestión y cumplimiento.</p>
          </div>
        </div>
      </div>

      <div className="flex-1" />
      <BottomNav variant="detail" onNavigate={onNavigate} />

      {showForm && (
        <SociedadForm sociedad={sociedad} onClose={() => setShowForm(false)} onSaved={handleSaved} />
      )}
    </>
  );
}
