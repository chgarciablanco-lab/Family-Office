import React from "react";
import { Building2, User, ChevronRight, Bell } from "lucide-react";
import BottomNav from "./BottomNav";

const menuItems = [
  {
    key: "sociedades-list",
    title: "Sociedades",
    subtitle: "Gestiona tus sociedades\ny obligaciones",
    icon: Building2,
    bg: "bg-blue-100",
    fg: "text-blue-600",
  },
  {
    key: "persona",
    title: "Gestión personal",
    subtitle: "Propiedades, autos, trabajadores\ne inversiones personales",
    icon: User,
    bg: "bg-violet-100",
    fg: "text-violet-600",
  },
];

export default function HomeScreen({ session, onNavigate }) {
  const fecha = new Date().toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const fechaCap = fecha.charAt(0).toUpperCase() + fecha.slice(1);

  return (
    <>
      <div className="px-5 pt-6 pb-2 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="García Blanco Family Office" className="w-10 h-10 object-contain shrink-0" />
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">García Blanco Family Office</h1>
            <p className="text-sm text-slate-500 mt-1">{fechaCap}</p>
          </div>
        </div>
        <button className="relative mt-1 shrink-0" aria-label="Notificaciones">
          <Bell className="w-6 h-6 text-slate-700" strokeWidth={1.8} />
        </button>
      </div>

      <div className="px-5 pt-4 pb-3">
        <h2 className="text-lg font-bold text-slate-900">¿Qué quieres gestionar hoy?</h2>
        <p className="text-sm text-slate-500 mt-0.5">Selecciona una opción para comenzar</p>
      </div>

      <div className="px-5 flex flex-col gap-3 pb-4">
        {menuItems.map((item) => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${item.bg}`}>
              <item.icon className={`w-7 h-7 ${item.fg}`} strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-base leading-tight">{item.title}</p>
              <p className="text-sm text-slate-500 leading-snug whitespace-pre-line mt-0.5">{item.subtitle}</p>
              {item.key === "persona" && (
                <p className="text-xs text-slate-400 mt-1">{session.user.email}</p>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
          </button>
        ))}
      </div>

      <div className="flex-1" />
      <BottomNav variant="home" onNavigate={onNavigate} />
    </>
  );
}
