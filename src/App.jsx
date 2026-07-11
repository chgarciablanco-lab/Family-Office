import React, { useEffect, useRef, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import LoginScreen from "./components/LoginScreen";
import MainApp from "./components/MainApp";
import ResetPasswordScreen from "./components/ResetPasswordScreen";
import PinLockScreen from "./components/PinLockScreen";
import { tienePin } from "./lib/pinLock";

// Si la app estuvo oculta (segundo plano, pantalla apagada) más de esto, se vuelve a pedir
// el PIN al volver. Un umbral bajo evitaría que abrir el selector de archivos/cámara (que
// también oculta la página un instante) bloquee la app de inmediato.
const REBLOQUEO_MS = 30000;

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
  const [bloqueado, setBloqueado] = useState(tienePin);
  const ocultoDesdeRef = useRef(null);

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

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        ocultoDesdeRef.current = Date.now();
        return;
      }
      if (ocultoDesdeRef.current && tienePin() && Date.now() - ocultoDesdeRef.current > REBLOQUEO_MS) {
        setBloqueado(true);
      }
      ocultoDesdeRef.current = null;
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
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
    return <PinLockScreen onUnlock={() => setBloqueado(false)} />;
  }

  return <MainApp session={session} />;
}
