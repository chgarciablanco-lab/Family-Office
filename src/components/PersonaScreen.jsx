import React from "react";
import {
  ArrowLeft, MoreHorizontal, Home as HomeIcon, Users, Car,
  TrendingUp, ClipboardList, Info, Key, FileText,
} from "lucide-react";
import BottomNav from "./BottomNav";
import { usePermisos } from "../context/PermisosContext";

const secciones = [
  {
    key: "propiedades", title: "Propiedades", modulo: "propiedades",
    subtitle: "Controla tus propiedades\ny obligaciones.",
    icon: HomeIcon, bg: "bg-violet-100", fg: "text-violet-600", disponible: true,
  },
  {
    key: "arriendos-persona", title: "Arriendos", modulo: "arriendos",
    subtitle: "Administra contratos de arriendo\ny pagos asociados.",
    icon: Key, bg: "bg-orange-100", fg: "text-orange-500", disponible: true,
  },
  {
    key: "trabajadores-persona", title: "Trabajadores", modulo: "trabajadores",
    subtitle: "Gestiona tu equipo\ny documentación.",
    icon: Users, bg: "bg-emerald-100", fg: "text-emerald-600", disponible: true,
  },
  {
    key: "impuestos-persona", title: "Impuestos", modulo: "impuestos",
    subtitle: "Revisa y gestiona tus impuestos\ny declaraciones.",
    icon: FileText, bg: "bg-violet-100", fg: "text-violet-600", disponible: true,
  },
  {
    key: "autos", title: "Autos", modulo: "autos",
    subtitle: "Administra tus vehículos\ny vencimientos.",
    icon: Car, bg: "bg-emerald-100", fg: "text-emerald-600", disponible: true,
  },
  {
    key: "inversiones", title: "Inversiones", modulo: "inversiones",
    subtitle: "Controla tus inversiones\ny plazos.",
    icon: TrendingUp, bg: "bg-violet-100", fg: "text-violet-600", disponible: true,
  },
  {
    key: "otros-gastos-persona", title: "Otros gastos", modulo: "otros_gastos",
    subtitle: "Registra y controla tus\ngastos diarios.",
    icon: ClipboardList, bg: "bg-amber-100", fg: "text-amber-500", disponible: true,
  },
];

export default function PersonaScreen({ onNavigate }) {
  const { puedeVer } = usePermisos();
  const seccionesVisibles = secciones.filter((sec) => puedeVer(sec.modulo));

  return (
    <>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={() => onNavigate("home")} aria-label="Volver">
          <ArrowLeft className="w-6 h-6 text-blue-600" strokeWidth={2} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Gestión personal</h1>
        <button aria-label="Más opciones">
          <MoreHorizontal className="w-6 h-6 text-blue-600" strokeWidth={2.2} />
        </button>
      </div>

      <div className="px-5 flex flex-col gap-3 pb-4">
        {seccionesVisibles.map((sec) => (
          <button
            key={sec.key}
            onClick={() => sec.disponible && onNavigate(sec.key)}
            disabled={!sec.disponible}
            className={`w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 flex items-center gap-4 text-left transition-transform ${
              sec.disponible ? "active:scale-[0.98]" : "opacity-60"
            }`}
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${sec.bg}`}>
              <sec.icon className={`w-7 h-7 ${sec.fg}`} strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-base leading-tight">{sec.title}</p>
              <p className="text-sm text-slate-500 leading-snug whitespace-pre-line mt-0.5">
                {sec.disponible ? sec.subtitle : "Próximamente"}
              </p>
            </div>
          </button>
        ))}

        <div className="bg-white rounded-2xl border border-slate-100 px-4 py-4 flex items-start gap-3 mb-2">
          <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" strokeWidth={1.8} />
          <div>
            <p className="font-bold text-slate-900 text-sm">Gestión personal</p>
            <p className="text-sm text-slate-500 mt-0.5">
              Propiedades, autos e inversiones son distintos de los de tus sociedades.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1" />
      <BottomNav variant="home" onNavigate={onNavigate} />
    </>
  );
}
