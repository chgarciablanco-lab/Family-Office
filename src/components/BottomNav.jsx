import React from "react";
import { Home as HomeIcon, Calendar, User } from "lucide-react";

export default function BottomNav({ onNavigate }) {
  return (
    <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-2.5 flex items-center justify-around">
      <button onClick={() => onNavigate("home")} className="flex flex-col items-center gap-0.5 text-blue-600">
        <HomeIcon className="w-6 h-6" strokeWidth={2} />
        <span className="text-[11px] font-medium">Inicio</span>
      </button>
      <button onClick={() => onNavigate("calendario")} className="flex flex-col items-center gap-0.5 text-slate-400">
        <Calendar className="w-6 h-6" strokeWidth={1.8} />
        <span className="text-[11px] font-medium">Calendario</span>
      </button>
      <button onClick={() => onNavigate("perfil")} className="flex flex-col items-center gap-0.5 text-slate-400">
        <User className="w-6 h-6" strokeWidth={1.8} />
        <span className="text-[11px] font-medium">Perfil</span>
      </button>
    </div>
  );
}
