import { supabase } from "./supabaseClient";

const BUCKET = "documentos";

// Id fijo para la "carpeta" de Documentos de Gestión personal, que no tiene una fila propia en ninguna tabla.
export const PERSONA_DOC_ID = "00000000-0000-0000-0000-000000000001";

export async function fetchCarpetas(entidadTipo, entidadId, carpetaPadreId) {
  let q = supabase
    .from("carpetas")
    .select("*")
    .eq("entidad_tipo", entidadTipo)
    .eq("entidad_id", entidadId)
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });
  q = carpetaPadreId ? q.eq("carpeta_padre_id", carpetaPadreId) : q.is("carpeta_padre_id", null);
  const { data, error } = await q;
  if (error) return [];
  return data || [];
}

export async function crearCarpeta(entidadTipo, entidadId, nombre, carpetaPadreId) {
  const { data: userData } = await supabase.auth.getUser();

  let q = supabase.from("carpetas").select("orden").eq("entidad_tipo", entidadTipo).eq("entidad_id", entidadId);
  q = carpetaPadreId ? q.eq("carpeta_padre_id", carpetaPadreId) : q.is("carpeta_padre_id", null);
  const { data: existentes } = await q.order("orden", { ascending: false }).limit(1);
  const siguienteOrden = (existentes?.[0]?.orden || 0) + 1;

  const { error } = await supabase.from("carpetas").insert({
    entidad_tipo: entidadTipo,
    entidad_id: entidadId,
    nombre: nombre.trim(),
    carpeta_padre_id: carpetaPadreId || null,
    created_by: userData?.user?.id || null,
    orden: siguienteOrden,
  });
  return { error };
}

export async function guardarOrdenCarpetas(idsEnOrden) {
  await Promise.all(idsEnOrden.map((id, i) => supabase.from("carpetas").update({ orden: i + 1 }).eq("id", id)));
}

export async function guardarOrdenDocumentos(idsEnOrden) {
  await Promise.all(idsEnOrden.map((id, i) => supabase.from("documentos").update({ orden: i + 1 }).eq("id", id)));
}

export async function renombrarCarpeta(carpetaId, nuevoNombre) {
  const { error } = await supabase.from("carpetas").update({ nombre: nuevoNombre.trim() }).eq("id", carpetaId);
  return { error };
}

export async function eliminarCarpeta(carpetaId) {
  // Solo se pueden borrar carpetas vacías (sin subcarpetas ni documentos), para no perder
  // contenido por accidente sin avisar.
  const [{ count: subcarpetas }, { count: docs }] = await Promise.all([
    supabase.from("carpetas").select("id", { count: "exact", head: true }).eq("carpeta_padre_id", carpetaId),
    supabase.from("documentos").select("id", { count: "exact", head: true }).eq("carpeta_id", carpetaId),
  ]);
  if ((subcarpetas || 0) > 0 || (docs || 0) > 0) {
    return { error: { message: "La carpeta no está vacía. Elimina su contenido primero." } };
  }
  const { error } = await supabase.from("carpetas").delete().eq("id", carpetaId);
  return { error };
}

export async function moverCarpeta(carpetaId, nuevaCarpetaPadreId) {
  const { error } = await supabase.from("carpetas").update({ carpeta_padre_id: nuevaCarpetaPadreId || null }).eq("id", carpetaId);
  return { error };
}

export async function moverDocumento(docId, nuevaCarpetaId) {
  const { error } = await supabase.from("documentos").update({ carpeta_id: nuevaCarpetaId || null }).eq("id", docId);
  return { error };
}

// Junta los ids de una carpeta y todas sus descendientes, para no dejar moverla dentro de
// sí misma (lo que crearía un ciclo en el árbol).
export async function fetchDescendientesCarpeta(carpetaId) {
  const ids = new Set([carpetaId]);
  let frontier = [carpetaId];
  while (frontier.length > 0) {
    const { data } = await supabase.from("carpetas").select("id").in("carpeta_padre_id", frontier);
    const nuevos = (data || []).map((c) => c.id).filter((id) => !ids.has(id));
    nuevos.forEach((id) => ids.add(id));
    frontier = nuevos;
  }
  return ids;
}

export async function fetchDocumentos(entidadTipo, entidadId, carpetaId) {
  let q = supabase
    .from("documentos")
    .select("*")
    .eq("entidad_tipo", entidadTipo)
    .eq("entidad_id", entidadId)
    .order("orden", { ascending: true })
    .order("created_at", { ascending: true });
  q = carpetaId ? q.eq("carpeta_id", carpetaId) : q.is("carpeta_id", null);
  const { data, error } = await q;
  if (error) return [];
  return data || [];
}

// Cantidad de documentos por carpeta (solo directos, no cuenta los de subcarpetas), para
// mostrar en la etiqueta de cada carpeta.
export async function fetchConteoDocumentosPorCarpeta(entidadTipo, entidadId) {
  const { data, error } = await supabase
    .from("documentos")
    .select("carpeta_id")
    .eq("entidad_tipo", entidadTipo)
    .eq("entidad_id", entidadId)
    .not("carpeta_id", "is", null);
  if (error || !data) return {};
  const conteo = {};
  data.forEach((d) => { conteo[d.carpeta_id] = (conteo[d.carpeta_id] || 0) + 1; });
  return conteo;
}

export async function subirDocumento(entidadTipo, entidadId, carpetaId, file) {
  const nombreSeguro = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const sufijo = Math.random().toString(36).slice(2, 8);
  const path = `${entidadTipo}/${entidadId}/${carpetaId || "raiz"}/${Date.now()}-${sufijo}-${nombreSeguro}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || "application/octet-stream",
  });
  if (uploadError) return { error: uploadError };

  let q = supabase.from("documentos").select("orden").eq("entidad_tipo", entidadTipo).eq("entidad_id", entidadId);
  q = carpetaId ? q.eq("carpeta_id", carpetaId) : q.is("carpeta_id", null);
  const { data: existentes } = await q.order("orden", { ascending: false }).limit(1);
  const siguienteOrden = (existentes?.[0]?.orden || 0) + 1;

  const { error } = await supabase.from("documentos").insert({
    entidad_tipo: entidadTipo,
    entidad_id: entidadId,
    carpeta_id: carpetaId || null,
    nombre: file.name,
    storage_path: path,
    content_type: file.type || null,
    tamano_bytes: file.size,
    orden: siguienteOrden,
  });
  return { error };
}

export async function obtenerUrlPreview(storagePath) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 60 * 10);
  if (error) return null;
  return data.signedUrl;
}

export async function obtenerUrlCompartir(storagePath) {
  // 7 días: suficiente para que la otra persona lo abra sin dejar el link activo indefinidamente.
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 60 * 60 * 24 * 7);
  if (error) return null;
  return data.signedUrl;
}

export async function descargarDocumento(doc) {
  const { data, error } = await supabase.storage.from(BUCKET).download(doc.storage_path);
  if (error || !data) return { error };
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = doc.nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return { error: null };
}

export async function eliminarDocumento(doc) {
  await supabase.storage.from(BUCKET).remove([doc.storage_path]);
  const { error } = await supabase.from("documentos").delete().eq("id", doc.id);
  return error;
}

export async function fetchTodosLosDocumentos() {
  const { data, error } = await supabase
    .from("documentos")
    .select("*, carpetas:carpeta_id(nombre)")
    .order("created_at", { ascending: false });
  if (error || !data) return [];

  const idsPorTipo = { propiedad: new Set(), sociedad: new Set(), trabajador: new Set(), auto: new Set() };
  data.forEach((d) => {
    if (idsPorTipo[d.entidad_tipo]) idsPorTipo[d.entidad_tipo].add(d.entidad_id);
  });

  const [propiedades, sociedades, trabajadores, autos] = await Promise.all([
    idsPorTipo.propiedad.size
      ? supabase.from("propiedades").select("id, nombre").in("id", [...idsPorTipo.propiedad])
      : Promise.resolve({ data: [] }),
    idsPorTipo.sociedad.size
      ? supabase.from("sociedades").select("id, nombre").in("id", [...idsPorTipo.sociedad])
      : Promise.resolve({ data: [] }),
    idsPorTipo.trabajador.size
      ? supabase.from("trabajadores").select("id, nombre").in("id", [...idsPorTipo.trabajador])
      : Promise.resolve({ data: [] }),
    idsPorTipo.auto.size
      ? supabase.from("autos").select("id, marca, modelo, patente").in("id", [...idsPorTipo.auto])
      : Promise.resolve({ data: [] }),
  ]);

  const nombreDe = (tipo, id) => {
    if (tipo === "persona") return "Gestión personal";
    if (tipo === "propiedad") return propiedades.data?.find((p) => p.id === id)?.nombre ?? "Propiedad";
    if (tipo === "sociedad") return sociedades.data?.find((s) => s.id === id)?.nombre ?? "Sociedad";
    if (tipo === "trabajador") return trabajadores.data?.find((t) => t.id === id)?.nombre ?? "Trabajador";
    if (tipo === "auto") {
      const a = autos.data?.find((a) => a.id === id);
      return a ? `${a.marca} ${a.modelo}` : "Auto";
    }
    return tipo;
  };

  return data.map((d) => ({
    ...d,
    entidadNombre: nombreDe(d.entidad_tipo, d.entidad_id),
    carpetaNombre: d.carpetas?.nombre ?? null,
  }));
}

export function formatTamano(bytes) {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
