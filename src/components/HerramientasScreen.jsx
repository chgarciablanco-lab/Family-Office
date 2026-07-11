import React from "react";
import { ArrowLeft } from "lucide-react";
import BottomNav from "./BottomNav";
import TareasScreen from "./TareasScreen";
import NotasScreen from "./NotasScreen";
import InformesScreen from "./InformesScreen";
import { usePermisos } from "../context/PermisosContext";

const TABS = [
  { key: "tareas", label: "Tareas", modulo: "calendario_tareas" },
  { key: "notas", label: "Notas", modulo: "notas" },
  { key: "informes", label: "Informes", modulo: "informes" },
];

export default function HerramientasScreen({ tab, onTabChange, backTo, onNavigate, onSelectNota }) {
  const { puedeVer } = usePermisos();
  const tabsVisibles = TABS.filter((t) => puedeVer(t.modulo));
  const tabActivo = tabsVisibles.some((t) => t.key === tab) ? tab : tabsVisibles[0]?.key;

  return (
    <>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={() => onNavigate(backTo)} aria-label="Volver">
          <ArrowLeft className="w-6 h-6 text-blue-600" strokeWidth={2} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Herramientas</h1>
        <div className="w-6" />
      </div>

      {tabsVisibles.length > 1 && (
        <div className="px-5 pb-1">
          <div className="bg-slate-100 rounded-xl p-1 flex gap-1">
            {tabsVisibles.map((t) => (
              <button
                key={t.key}
                onClick={() => onTabChange(t.key)}
                className={`flex-1 text-xs font-semibold rounded-lg py-2 transition-colors ${
                  tabActivo === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {tabActivo === "tareas" && <TareasScreen embedded onNavigate={onNavigate} />}
      {tabActivo === "notas" && <NotasScreen embedded onNavigate={onNavigate} onSelect={onSelectNota} />}
      {tabActivo === "informes" && <InformesScreen embedded onNavigate={onNavigate} />}

      <div className="flex-1" />
      <BottomNav onNavigate={onNavigate} />
    </>
  );
}
