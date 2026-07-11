import React from "react";
import { Building2, User, ChevronRight } from "lucide-react";
import BottomNav from "./BottomNav";
import { usePermisos } from "../context/PermisosContext";

export default function EspacioScreen({ onNavigate }) {
  const { perfil } = usePermisos();
  const primerNombre = (perfil?.nombre || "").trim().split(" ")[0];

  return (
    <>
      <div className="px-5 pt-2 pb-2 flex items-center gap-3">
        <img src="/logo.png" alt="García Blanco Family Office" className="w-16 h-16 object-contain shrink-0" />
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-tight">
            García Blanco <span className="whitespace-nowrap">Family Office</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {primerNombre ? `Hola, ${primerNombre}` : "Bienvenido"}
          </p>
        </div>
      </div>

      <div className="px-5 pt-4 pb-3">
        <h2 className="text-lg font-bold text-slate-900">¿A dónde quieres entrar?</h2>
        <p className="text-sm text-slate-500 mt-0.5">Elige un espacio para continuar.</p>
      </div>

      <div className="px-5 flex flex-col gap-3 pb-4">
        <button
          onClick={() => onNavigate("home")}
          className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-5 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
        >
          <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 bg-blue-100">
            <Building2 className="w-7 h-7 text-blue-600" strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 text-base leading-tight">Family Office</p>
            <p className="text-sm text-slate-500 leading-snug mt-0.5">
              Sociedades, gestión y documentos compartidos de la familia.
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
        </button>

        <button
          onClick={() => onNavigate("espacio-personal")}
          className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-5 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
        >
          <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 bg-slate-200">
            <User className="w-7 h-7 text-slate-700" strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 text-base leading-tight">Mi info personal</p>
            <p className="text-sm text-slate-500 leading-snug mt-0.5">
              Tus propias sociedades y gastos, privados y separados del family office.
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
        </button>
      </div>

      <div className="flex-1" />
      <BottomNav variant="espacio" onNavigate={onNavigate} />
    </>
  );
}
