import { supabase } from "./supabaseClient";

const BUCKET = "documentos";

export const CATEGORIAS_DOCUMENTOS = {
  propiedad: ["Escritura", "Dominio vigente", "Hipoteca", "Contrato de arriendo", "Comprobantes"],
  sociedad: ["Escritura de constitución", "Estatutos", "Modificaciones", "Contratos", "Comprobantes"],
  trabajador: ["Contrato", "Liquidaciones"],
  auto: ["Padrón", "Seguro", "Revisión técnica", "Permiso de circulación"],
  persona: ["Cédula de identidad", "Comprobantes"],
};

// Id fijo para la "carpeta" de Documentos de Gestión personal, que no tiene una fila propia en ninguna tabla.
export const PERSONA_DOC_ID = "00000000-0000-0000-0000-000000000001";

export async function fetchDocumentos(entidadTipo, entidadId) {
  const { data, error } = await supabase
    .from("documentos")
    .select("*")
    .eq("entidad_tipo", entidadTipo)
    .eq("entidad_id", entidadId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return data || [];
}

export async function subirDocumento(entidadTipo, entidadId, categoria, file) {
  const nombreSeguro = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const categoriaSegura = categoria.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${entidadTipo}/${entidadId}/${categoriaSegura}/${Date.now()}-${nombreSeguro}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || "application/octet-stream",
  });
  if (uploadError) return { error: uploadError };

  const { error } = await supabase.from("documentos").insert({
    entidad_tipo: entidadTipo,
    entidad_id: entidadId,
    categoria,
    nombre: file.name,
    storage_path: path,
    content_type: file.type || null,
    tamano_bytes: file.size,
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

export async function renombrarCategoria(entidadTipo, entidadId, categoriaVieja, categoriaNueva) {
  const { error } = await supabase
    .from("documentos")
    .update({ categoria: categoriaNueva })
    .eq("entidad_tipo", entidadTipo)
    .eq("entidad_id", entidadId)
    .eq("categoria", categoriaVieja);
  return error;
}

export async function fetchTodosLosDocumentos() {
  const { data, error } = await supabase
    .from("documentos")
    .select("*")
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

  return data.map((d) => ({ ...d, entidadNombre: nombreDe(d.entidad_tipo, d.entidad_id) }));
}

export async function buscarEntidadPorNombre(entidadTipo, nombre) {
  const q = (nombre || "").trim();
  if (!q) return null;
  if (entidadTipo === "persona") return { id: PERSONA_DOC_ID, nombre: "Gestión personal" };
  if (entidadTipo === "sociedad") {
    const { data } = await supabase.from("sociedades").select("id, nombre").ilike("nombre", `%${q}%`).limit(1);
    return data?.[0] ? { id: data[0].id, nombre: data[0].nombre } : null;
  }
  if (entidadTipo === "propiedad") {
    const { data } = await supabase.from("propiedades").select("id, nombre").ilike("nombre", `%${q}%`).limit(1);
    return data?.[0] ? { id: data[0].id, nombre: data[0].nombre } : null;
  }
  if (entidadTipo === "trabajador") {
    const { data } = await supabase.from("trabajadores").select("id, nombre").ilike("nombre", `%${q}%`).limit(1);
    return data?.[0] ? { id: data[0].id, nombre: data[0].nombre } : null;
  }
  if (entidadTipo === "auto") {
    const { data } = await supabase
      .from("autos")
      .select("id, marca, modelo, patente")
      .or(`marca.ilike.%${q}%,modelo.ilike.%${q}%,patente.ilike.%${q}%`)
      .limit(1);
    return data?.[0] ? { id: data[0].id, nombre: `${data[0].marca} ${data[0].modelo}` } : null;
  }
  return null;
}

// Manda el PDF escaneado a un modelo con visión para identificar de qué se trata.
// Devuelve null si la función aún no está configurada (sin API key) o si algo falla,
// para que quien la llama pueda caer de vuelta al flujo manual sin mostrar un error.
export async function clasificarDocumento(pdfBase64) {
  try {
    const { data, error } = await supabase.functions.invoke("clasificar-documento", {
      body: { pdf: pdfBase64 },
    });
    if (error || !data || data.error) return null;
    return data;
  } catch {
    return null;
  }
}

export function formatTamano(bytes) {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
