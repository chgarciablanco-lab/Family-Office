import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import LoginScreen from "./components/LoginScreen";
import MainApp from "./components/MainApp";
import ResetPasswordScreen from "./components/ResetPasswordScreen";

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

  return <MainApp session={session} />;
}
