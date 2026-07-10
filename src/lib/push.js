import { supabase } from "./supabaseClient";

// Clave pública VAPID: no es secreta, se usa en el navegador para suscribirse a push.
const VAPID_PUBLIC_KEY = "BFaoH-jylMgOzHJd48ox-0Fviyi8GBQRq3_9sR5-WYvhbrYHPtkS2J-3pwxq-FnJNCoQwNNtpEEzElBOwu3-QKw";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function soportaNotificacionesPush() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function registrarServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js").catch(() => {
    // si falla el registro simplemente no habrá notificaciones push disponibles
  });
}

export async function obtenerSuscripcionActual() {
  if (!soportaNotificacionesPush()) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export async function activarNotificacionesPush() {
  if (!soportaNotificacionesPush()) {
    return { error: "Este navegador no soporta notificaciones push." };
  }

  try {
    const permiso = await Notification.requestPermission();
    if (permiso !== "granted") {
      return { error: "No diste permiso para recibir notificaciones." };
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return { error: "No se pudo identificar tu sesión." };

    const raw = subscription.toJSON();
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: userId,
        endpoint: raw.endpoint,
        p256dh: raw.keys.p256dh,
        auth_key: raw.keys.auth,
      },
      { onConflict: "endpoint" }
    );

    if (error) return { error: error.message };
    return { data: true };
  } catch (err) {
    return { error: err?.message || "No se pudo activar las notificaciones." };
  }
}

export async function desactivarNotificacionesPush() {
  const subscription = await obtenerSuscripcionActual();
  if (!subscription) return { data: true };

  await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
  await subscription.unsubscribe();
  return { data: true };
}
