import React from "react";
import { Bell } from "lucide-react";

export default function Screen({ children, onNavigate, notifCount = 0, ocultarCampana = false }) {
  return (
    <div className="min-h-screen bg-slate-50 flex justify-center">
      <div className="w-full max-w-sm bg-slate-50 min-h-screen flex flex-col">
        {onNavigate && !ocultarCampana && (
          <div className="px-5 pt-5 flex justify-end">
            <button
              className="relative"
              aria-label="Ver notificaciones"
              onClick={() => onNavigate("notificaciones")}
            >
              <Bell className="w-6 h-6 text-slate-700" strokeWidth={1.8} />
              {notifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white" />
              )}
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
