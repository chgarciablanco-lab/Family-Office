const STORAGE_KEY = "familyOfficePin";
const ACTIVIDAD_KEY = "familyOfficePinActividad";

// Cuánto tiempo puede pasar sin actividad confirmada (app oculta, o recién recargada)
// antes de que la próxima vez que se abra pida el PIN de nuevo.
export const UMBRAL_BLOQUEO_MS = 2 * 60 * 1000;

function bufferAHex(buffer) {
  return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function saltAleatorio() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return bufferAHex(arr.buffer);
}

async function hashPin(pin, salt) {
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bufferAHex(digest);
}

export function tienePin() {
  return Boolean(localStorage.getItem(STORAGE_KEY));
}

export async function configurarPin(pin) {
  const salt = saltAleatorio();
  const hash = await hashPin(pin, salt);
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ salt, hash }));
}

export async function verificarPin(pin) {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return true;
  const { salt, hash } = JSON.parse(raw);
  const intento = await hashPin(pin, salt);
  return intento === hash;
}

export function quitarPin() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(ACTIVIDAD_KEY);
}

// Se llama cada vez que confirmamos que la app sigue siendo usada activamente (justo
// después de desbloquear, al recuperar el foco a tiempo, o justo antes de recargar la
// página), para que el próximo chequeo mida el tiempo desde este momento.
export function marcarActividad() {
  localStorage.setItem(ACTIVIDAD_KEY, String(Date.now()));
}

export function necesitaPin() {
  if (!tienePin()) return false;
  const ultima = Number(localStorage.getItem(ACTIVIDAD_KEY) || 0);
  if (!ultima) return true;
  return Date.now() - ultima > UMBRAL_BLOQUEO_MS;
}
