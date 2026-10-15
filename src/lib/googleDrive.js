import { supabase } from "./supabaseClient";

async function llamar(accion) {
  const { data, error } = await supabase.functions.invoke(`google-drive?accion=${accion}`, { body: {} });
  if (error) {
    let detalle = null;
    try {
      detalle = await error.context?.json?.();
    } catch {
      /* sin cuerpo */
    }
    return { error: detalle?.error || "error", mensaje: detalle?.mensaje || error.message };
  }
  return data;
}

// null si el usuario no es admin; si no, { conectado, email, respaldados, total, ... }.
export async function estadoDrive() {
  const { data, error } = await supabase.rpc("drive_estado");
  if (error) return { error: error.message };
  return data;
}

export const urlAutorizacionDrive = () => llamar("url");
export const sincronizarDrive = () => llamar("sincronizar");
export const desconectarDrive = () => llamar("desconectar");

// ---------------------------------------------------------------------------
// Selector de archivos de Google Drive (Google Picker)
// ---------------------------------------------------------------------------

let cargaPicker = null;
function cargarPicker() {
  if (!cargaPicker) {
    cargaPicker = new Promise((resolve, reject) => {
      const listo = () => window.gapi.load("picker", { callback: resolve, onerror: reject });
      if (window.gapi) return listo();
      const s = document.createElement("script");
      s.src = "https://apis.google.com/js/api.js";
      s.async = true;
      s.onload = listo;
      s.onerror = () => reject(new Error("No se pudo cargar el selector de Google Drive"));
      document.head.appendChild(s);
    }).catch((e) => {
      cargaPicker = null;
      throw e;
    });
  }
  return cargaPicker;
}

const TIPOS_GOOGLE_A_PDF = "application/vnd.google-apps.";

async function descargarDeDrive(token, doc) {
  const esNativo = (doc.mimeType || "").startsWith(TIPOS_GOOGLE_A_PDF);
  const url = esNativo
    ? `https://www.googleapis.com/drive/v3/files/${doc.id}/export?mimeType=application/pdf`
    : `https://www.googleapis.com/drive/v3/files/${doc.id}?alt=media`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`No se pudo descargar "${doc.name}" desde Drive (${r.status}).`);
  const blob = await r.blob();
  const nombre = esNativo && !/\.pdf$/i.test(doc.name) ? `${doc.name}.pdf` : doc.name;
  return new File([blob], nombre, { type: esNativo ? "application/pdf" : blob.type || doc.mimeType });
}

// Abre el selector de Drive y devuelve el archivo elegido como File (o null si se cancela).
export async function elegirArchivoDeDrive() {
  const cred = await llamar("token");
  if (cred?.error) throw new Error(cred.mensaje || "Google Drive no está disponible.");
  await cargarPicker();
  const { google } = window;

  const elegido = await new Promise((resolve) => {
    const vista = new google.picker.DocsView(google.picker.ViewId.DOCS)
      .setIncludeFolders(true)
      .setSelectFolderEnabled(false)
      .setMode(google.picker.DocsViewMode.LIST);
    const picker = new google.picker.PickerBuilder()
      .addView(vista)
      .addView(new google.picker.DocsUploadView())
      .setOAuthToken(cred.access_token)
      .setDeveloperKey(cred.api_key)
      .setAppId(cred.app_id)
      .setLocale("es")
      .setTitle("Elige un documento")
      .setCallback((data) => {
        if (data.action === google.picker.Action.PICKED) resolve(data.docs?.[0] || null);
        else if (data.action === google.picker.Action.CANCEL) resolve(null);
      })
      .build();
    picker.setVisible(true);
  });

  if (!elegido) return null;
  return descargarDeDrive(cred.access_token, elegido);
}
