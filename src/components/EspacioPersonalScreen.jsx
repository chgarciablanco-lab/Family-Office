import React from "react";
import { ArrowLeft, Briefcase, User, ChevronRight, Info } from "lucide-react";
import BottomNav from "./BottomNav";

export default function EspacioPersonalScreen({ onNavigate }) {
  return (
    <>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={() => onNavigate("espacio")} aria-label="Volver">
          <ArrowLeft className="w-6 h-6 text-blue-600" strokeWidth={2} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Mi info personal</h1>
        <div className="w-6" />
      </div>

      <div className="px-5 flex flex-col gap-3 pb-4">
        <button
          onClick={() => onNavigate("sociedades-personales")}
          className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
        >
          <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 bg-slate-200">
            <Briefcase className="w-7 h-7 text-slate-700" strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 text-base leading-tight">Mis sociedades</p>
            <p className="text-sm text-slate-500 leading-snug mt-0.5">
              Tus propias sociedades, privadas y separadas del family office.
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
        </button>

        <button
          onClick={() => onNavigate("gastos-personales")}
          className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
        >
          <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 bg-slate-200">
            <User className="w-7 h-7 text-slate-700" strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 text-base leading-tight">Mis gastos personales</p>
            <p className="text-sm text-slate-500 leading-snug mt-0.5">
              Tus propiedades, autos y gastos, privados y separados del family office.
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
        </button>

        <div className="bg-white rounded-2xl border border-slate-100 px-4 py-4 flex items-start gap-3 mb-2">
          <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" strokeWidth={1.8} />
          <div>
            <p className="font-bold text-slate-900 text-sm">Tu información privada</p>
            <p className="text-sm text-slate-500 mt-0.5">
              Solo tú puedes ver esta información, ni siquiera los administradores del family office.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1" />
      <BottomNav variant="personal" onNavigate={onNavigate} />
    </>
  );
}
