const STORAGE_KEY = "familyOfficePin";

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
}
