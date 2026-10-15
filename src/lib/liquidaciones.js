import { supabase } from "./supabaseClient";
import { crearCarpeta, fetchCarpetas, subirDocumento } from "./documentos";
import { nuevoIdFila } from "./planilla";

export const CARPETA_LIQUIDACIONES = "Liquidaciones";
export const MAX_PAGINAS_LIQUIDACIONES = 12;

const normalizar = (s) =>
  (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

// RUT sin puntos ni guion, con dígito verificador en mayúscula: "10.588.070-7" → "105880707".
export const rutLimpio = (r) => (r || "").toString().replace(/[^0-9kK]/g, "").toUpperCase();

// Un RUT chileno real tiene 8-9 caracteres y dígito verificador correcto.
export function rutValido(r) {
  const limpio = rutLimpio(r);
  if (limpio.length < 8 || limpio.length > 9) return false;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  let suma = 0;
  let mult = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i], 10) * mult;
    mult = mult === 7 ? 2 : mult + 1;
  }
  const res = 11 - (suma % 11);
  const esperado = res === 11 ? "0" : res === 10 ? "K" : String(res);
  return dv === esperado;
}

export async function fetchTrabajadores() {
  const { data } = await supabase
    .from("trabajadores")
    .select("id, nombre, rut, cargo, sociedad_id, sociedades:sociedad_id(nombre)")
    .order("nombre");
  return (data || []).map((t) => ({ ...t, sociedadNombre: t.sociedades?.nombre || "Gestión familiar" }));
}

// Busca el trabajador de la app que corresponde a una liquidación: primero por RUT válido;
// si no, por nombre (todas las palabras del nombre en la app deben estar en el de la liquidación).
export function buscarTrabajador(liq, trabajadores) {
  const rut = rutLimpio(liq.rut_trabajador);
  if (rut) {
    const porRut = trabajadores.find((t) => rutValido(t.rut) && rutLimpio(t.rut) === rut);
    if (porRut) return { trabajador: porRut, por: "rut" };
  }
  const nombreLiq = normalizar(liq.nombre_trabajador).split(" ");
  const candidatos = trabajadores.filter((t) => {
    const palabras = normalizar(t.nombre).split(" ").filter(Boolean);
    return palabras.length >= 2 && palabras.every((w) => nombreLiq.includes(w));
  });
  if (candidatos.length === 1) return { trabajador: candidatos[0], por: "nombre" };
  return { trabajador: null, por: null };
}

export function filasDesdeLectura(lectura, trabajadores) {
  return (lectura.liquidaciones || []).map((l) => {
    const { trabajador, por } = buscarTrabajador(l, trabajadores);
    const actualizarRut = !!(trabajador && rutValido(l.rut_trabajador) && rutLimpio(trabajador.rut) !== rutLimpio(l.rut_trabajador));
    return {
      id: nuevoIdFila(),
      paginas: Array.isArray(l.paginas) && l.paginas.length ? l.paginas : [],
      nombre: l.nombre_trabajador || "",
      rut: l.rut_trabajador || "",
      empleador: l.empleador || "",
      mes: l.mes || null,
      anio: l.anio || null,
      imponible: l.total_imponible ?? null,
      descuentosLegales: l.descuentos_legales ?? null,
      liquido: l.alcance_liquido ?? null,
      dudoso: !!l.dudoso,
      nota: l.nota || "",
      trabajadorId: trabajador?.id || null,
      asignadoPor: por,
      actualizarRut,
    };
  });
}

export async function leerLiquidacionesConIA(paginas) {
  const { data, error } = await supabase.functions.invoke("leer-liquidaciones", {
    body: { imagenes: paginas.map((p) => p.base64), media_type: "image/jpeg" },
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

// ---------------------------------------------------------------------------
// Respaldo: el PDF (o foto) de cada trabajador en sus Documentos → "Liquidaciones".
// ---------------------------------------------------------------------------

// Carpeta (en la raíz de Documentos del trabajador) con ese nombre; se crea si no existe.
// Sin nombre, el documento queda en la raíz.
async function carpetaDeTrabajador(trabajadorId, nombre) {
  const buscado = (nombre || "").trim();
  if (!buscado) return null;
  const igual = (c) => c.nombre.toLowerCase() === buscado.toLowerCase();
  let carpetas = await fetchCarpetas("trabajador", trabajadorId, null);
  let carpeta = carpetas.find(igual);
  if (!carpeta) {
    await crearCarpeta("trabajador", trabajadorId, buscado, null);
    carpetas = await fetchCarpetas("trabajador", trabajadorId, null);
    carpeta = carpetas.find(igual);
  }
  return carpeta?.id || null;
}

// Extrae solo las páginas de ese trabajador (numeradas desde 1) a un PDF nuevo.
async function pdfDePaginas(archivoPdf, paginas) {
  const { PDFDocument } = await import("pdf-lib");
  const original = await PDFDocument.load(await archivoPdf.arrayBuffer());
  const total = original.getPageCount();
  const indices = paginas.map((n) => n - 1).filter((i) => i >= 0 && i < total);
  if (indices.length === 0) return null;
  const nuevo = await PDFDocument.create();
  const copiadas = await nuevo.copyPages(original, indices);
  copiadas.forEach((p) => nuevo.addPage(p));
  return new Blob([await nuevo.save()], { type: "application/pdf" });
}

async function respaldoDeFila(fila, archivo, nombreBase) {
  if (archivo.esPdf) {
    const blob = fila.paginas.length ? await pdfDePaginas(archivo.respaldo, fila.paginas) : null;
    return new File([blob || archivo.respaldo], `${nombreBase}.pdf`, { type: "application/pdf" });
  }
  const pagina = archivo.paginas[(fila.paginas[0] || 1) - 1] || archivo.paginas[0];
  return new File([pagina.blob], `${nombreBase}.jpg`, { type: "image/jpeg" });
}

// ---------------------------------------------------------------------------
// Traspaso: el líquido va al pago del mes del trabajador (se crea si no existe).
// ---------------------------------------------------------------------------

export function filasListas(filas) {
  return filas.filter((f) => f.trabajadorId && f.liquido !== null && f.liquido !== "");
}

// opciones: { guardar: si se guarda la liquidación en Documentos del trabajador, carpeta }
export async function traspasarLiquidaciones(filas, periodo, archivo, trabajadores, opciones = {}) {
  const { guardar = true, carpeta = CARPETA_LIQUIDACIONES } = opciones;
  const mesTexto = new Date(`${periodo}T00:00:00`).toLocaleDateString("es-CL", { month: "long", year: "numeric" });
  const resultados = [];

  for (const f of filasListas(filas)) {
    const t = trabajadores.find((x) => x.id === f.trabajadorId);
    try {
      const { data: existente, error: errorBuscar } = await supabase
        .from("pagos_trabajador")
        .select("id")
        .eq("trabajador_id", f.trabajadorId)
        .eq("periodo", periodo)
        .maybeSingle();
      if (errorBuscar) throw errorBuscar;

      const op = existente
        ? supabase
            .from("pagos_trabajador")
            .update({ liquidacion: Number(f.liquido), updated_at: new Date().toISOString() })
            .eq("id", existente.id)
        : supabase
            .from("pagos_trabajador")
            .insert({ trabajador_id: f.trabajadorId, periodo, liquidacion: Number(f.liquido), estado: "Pendiente" });
      const { error } = await op;
      if (error) throw error;

      if (f.actualizarRut && rutValido(f.rut)) {
        await supabase.from("trabajadores").update({ rut: f.rut }).eq("id", f.trabajadorId);
      }

      let documento = false;
      if (guardar && archivo?.respaldo) {
        const carpetaId = await carpetaDeTrabajador(f.trabajadorId, carpeta);
        const file = await respaldoDeFila(f, archivo, `Liquidación ${mesTexto} - ${t?.nombre?.trim() || f.nombre}`);
        const { error: errorDoc } = await subirDocumento("trabajador", f.trabajadorId, carpetaId, file);
        documento = !errorDoc;
      }
      resultados.push({ fila: f, ok: true, documento });
    } catch (e) {
      resultados.push({ fila: f, ok: false, error: e.message || String(e) });
    }
  }
  await supabase.rpc("actualizar_estados_por_vencer");
  return resultados;
}
