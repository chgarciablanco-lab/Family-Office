import { supabase } from "./supabaseClient";
import { crearCarpeta, fetchCarpetas, subirDocumento, PERSONA_DOC_ID } from "./documentos";

export const MAX_PAGINAS_DOCUMENTO = 12;

// Todos los lugares donde se puede guardar un documento ("Documentos" de cada entidad).
export async function fetchDestinos() {
  const [soc, prop, trab, autos] = await Promise.all([
    supabase.from("sociedades").select("id, nombre").order("nombre"),
    supabase.from("propiedades").select("id, nombre, direccion, comuna").order("nombre"),
    supabase.from("trabajadores").select("id, nombre, rut").order("nombre"),
    supabase.from("autos").select("id, marca, modelo, patente").order("marca"),
  ]);
  return [
    { tipo: "persona", id: PERSONA_DOC_ID, nombre: "Gestión familiar", grupo: "General" },
    ...(soc.data || []).map((s) => ({ tipo: "sociedad", id: s.id, nombre: s.nombre, grupo: "Sociedades" })),
    ...(prop.data || []).map((p) => ({
      tipo: "propiedad", id: p.id, nombre: p.nombre, grupo: "Propiedades",
      pista: [p.direccion, p.comuna].filter(Boolean).join(", "),
    })),
    ...(trab.data || []).map((t) => ({ tipo: "trabajador", id: t.id, nombre: t.nombre.trim(), grupo: "Trabajadores", pista: t.rut })),
    ...(autos.data || []).map((a) => ({
      tipo: "auto", id: a.id, nombre: `${a.marca} ${a.modelo}`, grupo: "Autos", pista: a.patente,
    })),
  ];
}

export async function leerDocumentoConIA(paginas, catalogo, destinos) {
  const pistas_planilla = (catalogo?.propiedades || []).map((p) => ({
    propiedad: p.nombre,
    numeros: catalogo.entradas.filter((e) => e.propiedadId === p.id && e.numero).map((e) => `${e.tipo}: ${e.numero}`),
  }));
  const { data, error } = await supabase.functions.invoke("leer-documento", {
    body: {
      imagenes: paginas.map((p) => p.base64),
      media_type: "image/jpeg",
      pistas_planilla,
      destinos: destinos.map(({ tipo, id, nombre, pista }) => ({ tipo, id, nombre, pista })),
    },
  });
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

// Guarda el archivo original en Documentos del destino, dentro de una carpeta (se crea si no existe).
export async function guardarEnDocumentos({ archivoOriginal, destino, carpetaNombre, nombre }) {
  let carpetaId = null;
  const carpetaLimpia = (carpetaNombre || "").trim();
  if (carpetaLimpia) {
    let carpetas = await fetchCarpetas(destino.tipo, destino.id, null);
    let carpeta = carpetas.find((c) => c.nombre.toLowerCase() === carpetaLimpia.toLowerCase());
    if (!carpeta) {
      await crearCarpeta(destino.tipo, destino.id, carpetaLimpia, null);
      carpetas = await fetchCarpetas(destino.tipo, destino.id, null);
      carpeta = carpetas.find((c) => c.nombre.toLowerCase() === carpetaLimpia.toLowerCase());
    }
    carpetaId = carpeta?.id || null;
  }
  const extension = (archivoOriginal.name || "").match(/\.[a-z0-9]+$/i)?.[0] || (archivoOriginal.type === "application/pdf" ? ".pdf" : ".jpg");
  const nombreFinal = `${(nombre || "Documento").trim()}${extension}`;
  const file = new File([archivoOriginal], nombreFinal, { type: archivoOriginal.type || "application/octet-stream" });
  return subirDocumento(destino.tipo, destino.id, carpetaId, file);
}
