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

export function formatTamano(bytes) {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
