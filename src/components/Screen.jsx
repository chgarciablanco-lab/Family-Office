import React, { useRef } from "react";
import { Bell } from "lucide-react";

const EDGE_ZONE_PX = 30;
const SWIPE_THRESHOLD_PX = 70;
const MAX_VERTICAL_DRIFT_PX = 40;

// Deslizar el dedo desde cerca del borde superior hacia abajo recarga la app, como el
// clásico "pull to refresh".
const REFRESH_ZONE_PX = 60;
const REFRESH_THRESHOLD_PX = 100;
const MAX_HORIZONTAL_DRIFT_PX = 50;

export default function Screen({ children, onNavigate, notifCount = 0, ocultarCampana = false, onSwipeBack }) {
  const touchRef = useRef(null);
  const refreshTouchRef = useRef(null);

  const handleTouchStart = (e) => {
    const t = e.touches[0];
    touchRef.current = t.clientX <= EDGE_ZONE_PX ? { startX: t.clientX, startY: t.clientY } : null;
    refreshTouchRef.current = t.clientY <= REFRESH_ZONE_PX ? { startX: t.clientX, startY: t.clientY } : null;
  };

  const handleTouchMove = (e) => {
    const t = e.touches[0];

    if (refreshTouchRef.current) {
      const dx = t.clientX - refreshTouchRef.current.startX;
      const dy = t.clientY - refreshTouchRef.current.startY;
      if (dy > REFRESH_THRESHOLD_PX && Math.abs(dx) < MAX_HORIZONTAL_DRIFT_PX) {
        refreshTouchRef.current = null;
        touchRef.current = null;
        window.location.reload();
        return;
      }
    }

    if (!touchRef.current || !onSwipeBack) return;
    const dx = t.clientX - touchRef.current.startX;
    const dy = t.clientY - touchRef.current.startY;
    if (dx > SWIPE_THRESHOLD_PX && Math.abs(dy) < MAX_VERTICAL_DRIFT_PX) {
      onSwipeBack();
      touchRef.current = null;
    }
  };

  const handleTouchEnd = () => {
    touchRef.current = null;
    refreshTouchRef.current = null;
  };

  return (
    <div
      className="min-h-screen bg-slate-50 flex justify-center"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
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
