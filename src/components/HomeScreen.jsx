import React from "react";
import {
  TreeDeciduous, Car, Home as HomeIcon, Building2, Users, Landmark,
  Key, TrendingUp, Receipt, LogOut,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const modulosDisponibles = [
  { key: "autos", label: "Autos", icon: Car, color: "violet" },
  { key: "propiedades", label: "Propiedades", icon: HomeIcon, color: "blue" },
];

const modulosProximamente = [
  { label: "Sociedades", icon: Building2 },
  { label: "Trabajadores", icon: Users },
  { label: "Impuestos", icon: Landmark },
  { label: "Arriendos", icon: Key },
  { label: "Inversiones", icon: TrendingUp },
  { label: "Otros gastos", icon: Receipt },
];

const colorClasses = {
  violet: { bg: "bg-violet-100", fg: "text-violet-600" },
  blue: { bg: "bg-blue-100", fg: "text-blue-600" },
};

export default function HomeScreen({ session, onNavigate }) {
  return (
    <div className="min-h-screen bg-slate-50 flex justify-center">
      <div className="w-full max-w-sm bg-slate-50 min-h-screen flex flex-col">
        <div className="px-5 pt-6 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-gold-500 flex items-center justify-center shrink-0">
              <TreeDeciduous className="w-5 h-5 text-gold-600" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="font-serif text-lg text-navy-900 leading-tight">García Blanco</h1>
              <p className="text-xs text-slate-400">{session.user.email}</p>
            </div>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0"
            aria-label="Cerrar sesión"
          >
            <LogOut className="w-4 h-4 text-slate-500" strokeWidth={1.8} />
          </button>
        </div>

        <div className="px-5 flex flex-col gap-3 pb-6">
          <p className="font-bold text-slate-900 text-base">Módulos</p>
          <div className="grid grid-cols-2 gap-3">
            {modulosDisponibles.map(({ key, label, icon: Icon, color }) => {
              const c = colorClasses[color];
              return (
                <button
                  key={key}
                  onClick={() => onNavigate(key)}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-5 flex flex-col items-start gap-3 text-left active:scale-[0.98] transition-transform"
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.bg}`}>
                    <Icon className={`w-5 h-5 ${c.fg}`} strokeWidth={1.8} />
                  </div>
                  <p className="font-bold text-slate-900 text-sm">{label}</p>
                </button>
              );
            })}
          </div>

          <p className="font-bold text-slate-900 text-base mt-3">Próximamente</p>
          <div className="grid grid-cols-2 gap-3">
            {modulosProximamente.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="bg-white/60 rounded-2xl border border-slate-100 px-4 py-5 flex flex-col items-start gap-3 opacity-60"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-slate-100">
                  <Icon className="w-5 h-5 text-slate-400" strokeWidth={1.8} />
                </div>
                <p className="font-bold text-slate-500 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
