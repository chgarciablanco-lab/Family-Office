import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import LoginScreen from "./components/LoginScreen";
import MainApp from "./components/MainApp";
import ResetPasswordScreen from "./components/ResetPasswordScreen";
import PinLockScreen from "./components/PinLockScreen";
import { tienePin, necesitaPin, marcarActividad } from "./lib/pinLock";

function isRecoveryLink() {
  if (typeof window === "undefined") return false;
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const searchParams = new URLSearchParams(window.location.search);
  return hashParams.get("type") === "recovery" || searchParams.get("type") === "recovery";
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passwordRecovery, setPasswordRecovery] = useState(isRecoveryLink);
  const [bloqueado, setBloqueado] = useState(necesitaPin);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setPasswordRecovery(true);
      }
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Si al montar (carga en frío o recarga manual) no hace falta pedir el PIN, confirmamos
  // la actividad para que el próximo chequeo mida el tiempo desde ahora.
  useEffect(() => {
    if (!bloqueado) marcarActividad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) return;
      if (necesitaPin()) setBloqueado(true);
      else marcarActividad();
    };
    // Se marca actividad justo antes de que la página se recargue o se navegue fuera
    // (incluye el gesto de "deslizar para actualizar"), para que la próxima carga no
    // pida el PIN si la recarga fue mientras la app se estaba usando activamente.
    const onPageHide = () => marcarActividad();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-400 text-sm">Cargando...</p>
      </div>
    );
  }

  if (passwordRecovery) {
    return (
      <ResetPasswordScreen
        onDone={() => {
          setPasswordRecovery(false);
          window.history.replaceState(null, "", window.location.pathname);
        }}
      />
    );
  }

  if (!session) return <LoginScreen />;

  if (bloqueado && tienePin()) {
    return <PinLockScreen onUnlock={() => { marcarActividad(); setBloqueado(false); }} />;
  }

  return <MainApp session={session} />;
}
