import { supabase } from "./supabaseClient";
import { abrirPdf } from "./pdfjs";
import { medidoresDe, estadoResumen } from "./medidores";
import { tiposServicio } from "./servicioTipos";

export const TIPOS = tiposServicio.map((t) => t.tipo);
export const CARPETA_PLANILLAS = "Planillas de pago";

export const soloDigitos = (s) => (s || "").toString().replace(/\D/g, "");

let contadorIds = 0;
export const nuevoIdFila = () => `f${Date.now().toString(36)}${(contadorIds++).toString(36)}`;

// ---------------------------------------------------------------------------
// Catálogo: lo que la app ya sabe de cada propiedad (servicios y números de cliente).
// ---------------------------------------------------------------------------

export async function fetchCatalogo() {
  const [{ data: propiedades }, { data: servicios }] = await Promise.all([
    supabase.from("propiedades").select("id, nombre, sociedad_id").order("nombre"),
    supabase
      .from("servicios")
      .select("id, propiedad_id, tipo_servicio, compania, numero_cliente, medidores, periodo, valor")
      .not("propiedad_id", "is", null),
  ]);

  const props = propiedades || [];
  const porNumero = new Map(); // dígitos → { propiedadId, tipo, compania, numero }
  const entradas = new Map(); // "prop|tipo|numero" → entrada de plantilla

  (servicios || []).forEach((s) => {
    medidoresDe(s).forEach((m) => {
      const digitos = soloDigitos(m.numero_cliente);
      const clave = `${s.propiedad_id}|${s.tipo_servicio}|${digitos}`;
      if (!entradas.has(clave)) {
        entradas.set(clave, {
          propiedadId: s.propiedad_id,
          tipo: s.tipo_servicio,
          compania: m.compania || null,
          numero: m.numero_cliente || null,
        });
      }
      if (digitos.length >= 5 && !porNumero.has(digitos)) {
        porNumero.set(digitos, {
          propiedadId: s.propiedad_id, tipo: s.tipo_servicio, compania: m.compania || null, numero: m.numero_cliente,
        });
      }
    });
  });

  return { propiedades: props, porNumero, entradas: [...entradas.values()] };
}

// Tabla vacía con la misma estructura que la planilla, para llenar a mano.
export function plantillaManual(catalogo) {
  const nombre = (id) => catalogo.propiedades.find((p) => p.id === id)?.nombre || "";
  return catalogo.entradas
    .slice()
    .sort((a, b) => nombre(a.propiedadId).localeCompare(nombre(b.propiedadId)) || a.tipo.localeCompare(b.tipo))
    .map((e) => ({
      id: nuevoIdFila(),
      seccion: nombre(e.propiedadId),
      concepto: [e.tipo, e.compania].filter(Boolean).join(" "),
      numero_cliente: e.numero || "",
      valor: null,
      estado: "Pagado",
      fecha_pago: "",
      dudoso: false,
      nota: "",
      propiedadId: e.propiedadId,
      tipo: e.tipo,
      asignadoPor: "plantilla",
    }));
}

// ---------------------------------------------------------------------------
// Asignación automática de cada fila leída a una propiedad y tipo de servicio.
// ---------------------------------------------------------------------------

export function tipoDesdeConcepto(concepto) {
  const c = (concepto || "").toLowerCase();
  if (/gasto[s]?\s*com/.test(c)) return "Gastos comunes";
  if (/segur/.test(c)) return "Seguros";
  if (/contribuc/.test(c)) return "Contribuciones";
  if (/\bluz\b|cge|enel|chilquinta|frontel|saesa/.test(c)) return "Luz";
  if (/agua|aguas|aquagest|esval|essbio|nuevosur/.test(c)) return "Agua";
  if (/\bgas\b|gasco|abastible|lipigas|metrogas/.test(c)) return "Gas";
  if (/internet|vtr|entel|movistar|starlink|mundo|wom|claro|intercom|fibra/.test(c)) return "Internet";
  return null;
}

const normalizar = (s) =>
  (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

function propiedadPorNombre(seccion, propiedades) {
  const n = normalizar(seccion);
  if (!n) return null;
  const exacta = propiedades.find((p) => normalizar(p.nombre) === n);
  if (exacta) return exacta.id;
  // Coincidencia por palabras: la propiedad cuyo nombre comparte más palabras significativas.
  const palabras = n.split(" ").filter((w) => w.length > 2 && !["casa", "dpto", "depto", "departamento", "oficina"].includes(w));
  let mejor = null;
  let mejorPuntaje = 0;
  propiedades.forEach((p) => {
    const np = normalizar(p.nombre);
    const puntaje = palabras.filter((w) => np.includes(w)).length;
    if (puntaje > mejorPuntaje) {
      mejor = p.id;
      mejorPuntaje = puntaje;
    }
  });
  return mejor;
}

// Recibe las filas tal como las leyó la IA y les asigna propiedad/tipo:
// 1) por número de cliente (lo más confiable), 2) la sección hereda la propiedad que salió
//    de sus filas con número, 3) por nombre de la sección, 4) el tipo por palabras del concepto.
export function asignarFilas(filasLeidas, catalogo) {
  const filas = filasLeidas.map((f) => {
    const digitos = soloDigitos(f.numero_cliente);
    const match = digitos.length >= 5 ? catalogo.porNumero.get(digitos) : null;
    return {
      id: nuevoIdFila(),
      seccion: f.seccion || "",
      concepto: f.concepto || "",
      numero_cliente: f.numero_cliente || "",
      valor: Number.isFinite(f.valor) ? Math.round(f.valor) : null,
      estado: f.estado === "Pendiente" ? "Pendiente" : "Pagado",
      fecha_pago: f.fecha_pago || "",
      dudoso: !!f.dudoso,
      nota: f.nota || "",
      propiedadId: match?.propiedadId || null,
      tipo: match?.tipo || null,
      asignadoPor: match ? "numero" : null,
    };
  });

  // Propiedad mayoritaria por sección, según las filas que calzaron por número.
  const votos = {};
  filas.forEach((f) => {
    if (f.asignadoPor !== "numero") return;
    votos[f.seccion] = votos[f.seccion] || {};
    votos[f.seccion][f.propiedadId] = (votos[f.seccion][f.propiedadId] || 0) + 1;
  });
  const propiedadDeSeccion = {};
  Object.entries(votos).forEach(([sec, v]) => {
    propiedadDeSeccion[sec] = Object.entries(v).sort((a, b) => b[1] - a[1])[0][0];
  });

  filas.forEach((f) => {
    if (f.asignadoPor === "numero") return;
    f.propiedadId = propiedadDeSeccion[f.seccion] || propiedadPorNombre(f.seccion, catalogo.propiedades);
    f.tipo = tipoDesdeConcepto(f.concepto);
    f.asignadoPor = f.propiedadId && f.tipo ? "seccion" : null;
  });

  return filas;
}

// ---------------------------------------------------------------------------
// Lectura con IA (edge function leer-planilla).
// ---------------------------------------------------------------------------

const MAX_LADO = 2000;
export const MAX_PAGINAS_PDF = 4;

const blobABase64 = (blob) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1]);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });

async function canvasAPagina(canvas) {
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  return { blob, base64: await blobABase64(blob), previewUrl: URL.createObjectURL(blob) };
}

// Achica la foto antes de enviarla: más rápida y barata de leer, sin perder legibilidad.
export async function prepararImagen(file, maxLado = MAX_LADO) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const escala = Math.min(1, maxLado / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * escala);
    canvas.height = Math.round(img.naturalHeight * escala);
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvasAPagina(canvas);
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Convierte cada página de un PDF (hasta MAX_PAGINAS_PDF) en una imagen para leerla y mostrarla.
async function prepararPdf(file, maxPaginas = MAX_PAGINAS_PDF) {
  const pdf = await abrirPdf({ data: new Uint8Array(await file.arrayBuffer()) });
  const total = Math.min(pdf.numPages, maxPaginas);
  const paginas = [];
  for (let i = 1; i <= total; i++) {
    const page = await pdf.getPage(i);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: MAX_LADO / Math.max(base.width, base.height) });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    paginas.push(await canvasAPagina(canvas));
  }
  return { paginas, paginasOmitidas: pdf.numPages - total };
}

const esPdf = (file) => file.type === "application/pdf" || /\.pdf$/i.test(file.name || "");

// Foto de la cámara, imagen de la galería o documento (imagen o PDF) → páginas listas para
// leer y mostrar, más el archivo que se guardará como respaldo en Documentos.
export async function prepararArchivo(file, { maxPaginas } = {}) {
  if (esPdf(file)) {
    const { paginas, paginasOmitidas } = await prepararPdf(file, maxPaginas);
    if (paginas.length === 0) throw new Error("PDF sin páginas");
    return { paginas, paginasOmitidas, respaldo: file, esPdf: true };
  }
  const pagina = await prepararImagen(file);
  return { paginas: [pagina], paginasOmitidas: 0, respaldo: pagina.blob, esPdf: false };
}

export function liberarArchivo(archivo) {
  archivo?.paginas?.forEach((p) => URL.revokeObjectURL(p.previewUrl));
}

export async function leerPlanillaConIA(paginas, catalogo) {
  const pistas = catalogo.propiedades.map((p) => ({
    propiedad: p.nombre,
    numeros: catalogo.entradas.filter((e) => e.propiedadId === p.id && e.numero).map((e) => `${e.tipo}: ${e.numero}`),
  }));
  const { data, error } = await supabase.functions.invoke("leer-planilla", {
    body: { imagenes: paginas.map((p) => p.base64), media_type: "image/jpeg", pistas },
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
// Traspaso: cada fila confirmada se registra en el servicio del mes de su propiedad.
// ---------------------------------------------------------------------------

function ultimoDiaMes(anio, mes) {
  return new Date(anio, mes, 0).getDate();
}

function vencimientoEnMes(vencimientoOriginal, periodo) {
  if (!vencimientoOriginal) return null;
  const dia = parseInt(vencimientoOriginal.slice(8, 10), 10);
  const anio = parseInt(periodo.slice(0, 4), 10);
  const mes = parseInt(periodo.slice(5, 7), 10);
  return `${periodo.slice(0, 7)}-${String(Math.min(dia, ultimoDiaMes(anio, mes))).padStart(2, "0")}`;
}

const filaVacia = (r) => !r.periodo && medidoresDe(r).every((m) => m.valor === null || m.valor === undefined || m.valor === "");

export function filasParaTraspasar(filas) {
  return filas.filter((f) => f.valor !== null && f.valor !== "" && f.propiedadId && f.tipo);
}

export async function traspasarPlanilla(filas, periodo, propiedades) {
  const listas = filasParaTraspasar(filas);
  const grupos = new Map();
  listas.forEach((f) => {
    const k = `${f.propiedadId}|${f.tipo}`;
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k).push(f);
  });

  const resultados = [];
  for (const [k, filasGrupo] of grupos) {
    const [propiedadId, tipo] = k.split("|");
    try {
      await traspasarGrupo(propiedadId, tipo, filasGrupo, periodo, propiedades);
      resultados.push({ propiedadId, tipo, ok: true, n: filasGrupo.length });
    } catch (e) {
      resultados.push({ propiedadId, tipo, ok: false, n: filasGrupo.length, error: e.message || String(e) });
    }
  }
  await supabase.rpc("actualizar_estados_por_vencer");
  return resultados;
}

async function traspasarGrupo(propiedadId, tipo, filasGrupo, periodo, propiedades) {
  const { data: existentes, error } = await supabase
    .from("servicios")
    .select("*")
    .eq("propiedad_id", propiedadId)
    .eq("tipo_servicio", tipo)
    .order("periodo", { ascending: false, nullsFirst: false });
  if (error) throw error;

  // Destino, en orden de preferencia: el registro del mes que ya tiene esos números de cliente,
  // un registro vacío (sin mes ni montos) que los tenga, cualquier registro del mes, o uno vacío.
  const numerosGrupo = new Set(filasGrupo.map((f) => soloDigitos(f.numero_cliente)).filter(Boolean));
  const tieneNumeros = (r) => numerosGrupo.size > 0 && medidoresDe(r).some((m) => numerosGrupo.has(soloDigitos(m.numero_cliente)));
  const lista = existentes || [];
  const delMes =
    lista.find((r) => r.periodo === periodo && tieneNumeros(r)) ||
    (numerosGrupo.size === 0 || !lista.some((r) => filaVacia(r) && tieneNumeros(r))
      ? lista.find((r) => r.periodo === periodo)
      : null);
  const placeholder = !delMes && (lista.find((r) => filaVacia(r) && tieneNumeros(r)) || lista.find(filaVacia));
  const destino = delMes || placeholder || null;
  const modelo = destino || (existentes || [])[0] || null;
  const copiandoDeOtroMes = !destino;

  // Medidores de partida: los del registro destino, o los del último mes con valores reseteados.
  let medidores = modelo
    ? medidoresDe(modelo).map((m) =>
        copiandoDeOtroMes || (placeholder && !delMes)
          ? { ...m, valor: null, estado: "Pendiente", fecha_pago: null, vencimiento: vencimientoEnMes(m.vencimiento, periodo) }
          : { ...m })
    : [];

  filasGrupo.forEach((f) => {
    const digitos = soloDigitos(f.numero_cliente);
    let idx = digitos ? medidores.findIndex((m) => soloDigitos(m.numero_cliente) === digitos) : -1;
    // Sin número de cliente solo se reutiliza un medidor que tampoco tenga número (ej. gastos
    // comunes); nunca se pisa el pago de otro medidor identificado.
    if (idx === -1 && !digitos) idx = medidores.findIndex((m) => !soloDigitos(m.numero_cliente) && !m._usado);
    const datos = {
      valor: Number(f.valor),
      estado: f.estado === "Pendiente" ? "Pendiente" : "Pagado",
      fecha_pago: f.estado === "Pendiente" ? null : f.fecha_pago || null,
    };
    if (idx === -1) {
      medidores.push({
        _usado: true,
        numero_cliente: f.numero_cliente || null,
        compania: f.concepto || null,
        vencimiento: null,
        ...datos,
      });
    } else {
      medidores[idx] = { ...medidores[idx], ...datos, _usado: true };
    }
  });
  medidores = medidores.map(({ _usado, ...m }) => m);

  const propiedad = propiedades.find((p) => p.id === propiedadId);
  const comun = {
    propiedad_id: propiedadId,
    sociedad_id: propiedad?.sociedad_id || null,
    tipo_servicio: tipo,
    periodo,
    updated_at: new Date().toISOString(),
  };
  const campos =
    medidores.length === 1
      ? {
          ...comun,
          compania: medidores[0].compania || null,
          numero_cliente: medidores[0].numero_cliente || null,
          valor: medidores[0].valor,
          estado: medidores[0].estado,
          fecha_pago: medidores[0].fecha_pago || null,
          vencimiento: medidores[0].vencimiento || null,
          medidores: null,
        }
      : {
          ...comun,
          compania: null,
          numero_cliente: null,
          valor: null,
          fecha_pago: null,
          vencimiento: null,
          medidores,
          estado: estadoResumen({ medidores }),
        };

  const op = destino
    ? supabase.from("servicios").update(campos).eq("id", destino.id)
    : supabase.from("servicios").insert(campos);
  const { error: errorGuardar } = await op;
  if (errorGuardar) throw errorGuardar;
}
