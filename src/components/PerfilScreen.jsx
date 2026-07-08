import React from "react";
import { ArrowLeft, User, LogOut } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import BottomNav from "./BottomNav";
import { usePermisos } from "../context/PermisosContext";

export default function PerfilScreen({ session, onNavigate }) {
  const { esAdmin } = usePermisos();
  return (
    <>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={() => onNavigate("home")} aria-label="Volver">
          <ArrowLeft className="w-6 h-6 text-blue-600" strokeWidth={2} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Perfil</h1>
        <div className="w-6" />
      </div>

      <div className="px-5 flex flex-col gap-3 pb-4">
        <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
            <User className="w-7 h-7 text-violet-600" strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 text-base leading-tight">{session.user.email}</p>
            <p className="text-sm text-slate-500 mt-0.5">{esAdmin ? "Administrador" : "Ejecutivo"}</p>
          </div>
        </div>

        <button
          onClick={() => supabase.auth.signOut()}
          className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
        >
          <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <LogOut className="w-5 h-5 text-red-500" strokeWidth={1.8} />
          </div>
          <p className="font-bold text-red-500 text-sm">Cerrar sesión</p>
        </button>
      </div>

      <div className="flex-1" />
      <BottomNav variant="home" onNavigate={onNavigate} />
    </>
  );
}
