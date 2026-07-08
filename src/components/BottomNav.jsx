import React from "react";
import { Home as HomeIcon, Calendar, User, Bell } from "lucide-react";

export default function BottomNav({ variant, onNavigate, notifCount }) {
  if (variant === "home") {
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

  return (
    <div className="sticky bottom-0 bg-white border-t border-slate-100 px-4 py-2.5 flex items-center justify-around">
      <button onClick={() => onNavigate("home")} className="flex flex-col items-center gap-0.5 text-blue-600">
        <HomeIcon className="w-6 h-6" strokeWidth={2} />
        <span className="text-[11px] font-medium">Inicio</span>
      </button>
      <button className="relative flex flex-col items-center gap-0.5 text-slate-400">
        <span className="relative">
          <Bell className="w-6 h-6" strokeWidth={1.8} />
          {notifCount ? (
            <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
              {notifCount}
            </span>
          ) : null}
        </span>
        <span className="text-[11px] font-medium">Notificaciones</span>
      </button>
      <button onClick={() => onNavigate("perfil")} className="flex flex-col items-center gap-0.5 text-slate-400">
        <User className="w-6 h-6" strokeWidth={1.8} />
        <span className="text-[11px] font-medium">Perfil</span>
      </button>
    </div>
  );
}
