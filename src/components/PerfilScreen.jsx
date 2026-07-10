import React, { useEffect, useState } from "react";
import { ArrowLeft, User, LogOut, Pencil, X, Bell } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import BottomNav from "./BottomNav";
import { usePermisos } from "../context/PermisosContext";
import { actualizarMiNombre } from "../lib/usuarios";
import { Field, inputClass } from "./TramiteSection";
import {
  soportaNotificacionesPush, obtenerSuscripcionActual, activarNotificacionesPush, desactivarNotificacionesPush,
} from "../lib/push";

const esIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
const esStandalone =
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true);

export default function PerfilScreen({ session, onNavigate }) {
  const { esAdmin, perfil, recargar } = usePermisos();
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(perfil?.nombre || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const pushSoportado = soportaNotificacionesPush();
  const [pushActivo, setPushActivo] = useState(false);
  const [pushLoading, setPushLoading] = useState(true);
  const [pushError, setPushError] = useState("");

  useEffect(() => {
    if (!pushSoportado) {
      setPushLoading(false);
      return;
    }
    obtenerSuscripcionActual()
      .then((sub) => setPushActivo(Boolean(sub)))
      .catch(() => {})
      .finally(() => setPushLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTogglePush = async () => {
    setPushError("");
    setPushLoading(true);
    try {
      if (pushActivo) {
        await desactivarNotificacionesPush();
        setPushActivo(false);
      } else {
        const { error } = await activarNotificacionesPush();
        if (error) setPushError(error);
        else setPushActivo(true);
      }
    } catch (err) {
      setPushError(err?.message || "No se pudo cambiar el estado de las notificaciones.");
    } finally {
      setPushLoading(false);
    }
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const { error } = await actualizarMiNombre(nombre);
    setSaving(false);
    if (error) {
      setError(error);
      return;
    }
    setEditando(false);
    recargar();
  };

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
        <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
              <User className="w-7 h-7 text-violet-600" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-base leading-tight truncate">{perfil?.nombre || session.user.email}</p>
              <p className="text-sm text-slate-500 mt-0.5 truncate">{session.user.email}</p>
              <span className={`inline-block mt-1.5 text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${esAdmin ? "bg-amber-100 text-amber-700" : "bg-violet-100 text-violet-700"}`}>
                {esAdmin ? "Administrador" : "Ejecutivo"}
              </span>
            </div>
            <button onClick={() => { setNombre(perfil?.nombre || ""); setEditando(true); }} aria-label="Editar nombre" className="shrink-0">
              <Pencil className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {editando && (
            <form onSubmit={handleGuardar} className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-3">
              <Field label="Cómo quieres que te saluden">
                <input
                  autoComplete="off"
                  required
                  autoFocus
                  className={inputClass}
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu nombre"
                />
              </Field>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-violet-600 text-white font-semibold text-sm rounded-xl py-2.5 disabled:opacity-60"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditando(false)}
                  aria-label="Cancelar"
                  className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 text-blue-600" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-sm">Notificaciones push</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {pushSoportado ? "Recibe avisos en tu teléfono" : "No disponible en este navegador"}
              </p>
            </div>
            {pushSoportado && (!esIOS || esStandalone) && (
              <button
                type="button"
                onClick={handleTogglePush}
                disabled={pushLoading}
                aria-label={pushActivo ? "Desactivar notificaciones" : "Activar notificaciones"}
                className={`shrink-0 w-11 h-6 p-0 border-0 appearance-none rounded-full relative transition-colors ${pushActivo ? "bg-emerald-500" : "bg-slate-200"} disabled:opacity-50`}
                style={{ WebkitAppearance: "none" }}
              >
                <span
                  className={`absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${pushActivo ? "translate-x-5" : "translate-x-0"}`}
                />
              </button>
            )}
          </div>
          {pushSoportado && esIOS && !esStandalone && (
            <p className="text-xs text-amber-600 mt-3 pt-3 border-t border-slate-100">
              En iPhone primero debes instalar la app: toca Compartir → "Agregar a pantalla de inicio". Luego podrás activar las notificaciones desde aquí.
            </p>
          )}
          {pushError && <p className="text-xs text-red-500 mt-3 pt-3 border-t border-slate-100">{pushError}</p>}
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
