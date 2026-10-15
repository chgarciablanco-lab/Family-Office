import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, Camera, Images, FileUp, PenLine, Loader2, AlertTriangle, Trash2, Plus, Check, ChevronDown, ChevronUp, X, CheckCircle2,
  ImageIcon, XCircle,
} from "lucide-react";
import BottomNav from "./BottomNav";
import { formatCLP, formatFechaCorta } from "../lib/format";
import { usePermisos } from "../context/PermisosContext";
import DestinoDocumento, { claveDestino } from "./DestinoDocumento";
import { fetchDestinos, guardarEnDocumentos } from "../lib/cargaDocumento";
import { PERSONA_DOC_ID } from "../lib/documentos";
import {
  TIPOS, fetchCatalogo, plantillaManual, asignarFilas, prepararArchivo, liberarArchivo, leerPlanillaConIA, traspasarPlanilla,
  filasParaTraspasar, nuevoIdFila, tipoDesdeConcepto, CARPETA_PLANILLAS,
} from "../lib/planilla";

const inputCls =
  "w-full h-9 border border-slate-200 rounded-lg px-2.5 text-sm text-slate-900 bg-white outline-none focus:border-violet-400";
const labelCls = "text-[11px] font-semibold text-slate-500 mb-0.5 block";

const mesActual = () => new Date().toISOString().slice(0, 7);
const formatMiles = (n) => (n === null || n === undefined || n === "" ? "" : Number(n).toLocaleString("es-CL"));
const parseMonto = (s) => {
  const d = (s || "").replace(/\D/g, "");
  return d ? parseInt(d, 10) : null;
};

function problemasDe(f) {
  const p = [];
  if (f.valor === null || f.valor === "") return p; // sin monto = se ignora, no es un problema
  if (!f.propiedadId) p.push("Falta la propiedad");
  if (!f.tipo) p.push("Falta el tipo de servicio");
  if (f.estado === "Pagado" && !f.fecha_pago) p.push("Sin fecha de pago");
  return p;
}

function FilaPlanilla({ fila, propiedades, abierta, onToggle, onChange, onEliminar }) {
  const sinMonto = fila.valor === null || fila.valor === "";
  const problemas = problemasDe(fila);
  const alerta = !sinMonto && (fila.dudoso || problemas.length > 0);
  const propNombre = propiedades.find((p) => p.id === fila.propiedadId)?.nombre;

  return (
    <div
      className={`rounded-xl border px-3 py-2.5 ${
        alerta ? "bg-amber-50 border-amber-200" : sinMonto ? "bg-slate-50 border-slate-100" : "bg-white border-slate-100"
      }`}
    >
      <button onClick={onToggle} className="w-full flex items-start gap-2 text-left">
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${sinMonto ? "text-slate-400" : "text-slate-900"}`}>
            {fila.concepto || "Sin concepto"}
          </p>
          <p className="text-[11px] text-slate-500 truncate">
            {fila.numero_cliente ? `N° ${fila.numero_cliente} · ` : ""}
            {propNombre && fila.tipo ? `→ ${propNombre} · ${fila.tipo}` : "Sin destino"}
          </p>
          {!sinMonto && (fila.dudoso || problemas.length > 0) && (
            <p className="text-[11px] text-amber-700 mt-0.5 flex items-start gap-1">
              <AlertTriangle className="w-3 h-3 mt-[1px] shrink-0" strokeWidth={2.2} />
              <span>{[fila.dudoso && (fila.nota || "Lectura dudosa, revisa"), ...problemas].filter(Boolean).join(" · ")}</span>
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className={`text-sm font-bold ${sinMonto ? "text-slate-300" : "text-slate-900"}`}>
            {sinMonto ? "Sin monto" : formatCLP(fila.valor)}
          </p>
          {!sinMonto && (
            <p className={`text-[11px] font-semibold ${fila.estado === "Pagado" ? "text-emerald-600" : "text-red-500"}`}>
              {fila.estado}
              {fila.estado === "Pagado" && fila.fecha_pago ? ` · ${formatFechaCorta(fila.fecha_pago)}` : ""}
            </p>
          )}
        </div>
        {abierta ? (
          <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        )}
      </button>

      {abierta && (
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <div className="col-span-2">
            <label className={labelCls}>Concepto</label>
            <input
              className={inputCls}
              value={fila.concepto}
              onChange={(e) => onChange({ concepto: e.target.value })}
              onBlur={(e) => !fila.tipo && onChange({ tipo: tipoDesdeConcepto(e.target.value) })}
            />
          </div>
          <div>
            <label className={labelCls}>Monto ($)</label>
            <input
              className={inputCls}
              inputMode="numeric"
              placeholder="Sin monto"
              value={formatMiles(fila.valor)}
              onChange={(e) => onChange({ valor: parseMonto(e.target.value), dudoso: false })}
            />
          </div>
          <div>
            <label className={labelCls}>N° cliente</label>
            <input className={inputCls} value={fila.numero_cliente} onChange={(e) => onChange({ numero_cliente: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Estado</label>
            <select className={inputCls} value={fila.estado} onChange={(e) => onChange({ estado: e.target.value })}>
              <option>Pagado</option>
              <option>Pendiente</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Fecha de pago</label>
            <input
              type="date"
              className={inputCls}
              value={fila.fecha_pago || ""}
              disabled={fila.estado !== "Pagado"}
              onChange={(e) => onChange({ fecha_pago: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Propiedad</label>
            <select
              className={inputCls}
              value={fila.propiedadId || ""}
              onChange={(e) => onChange({ propiedadId: e.target.value || null, asignadoPor: "manual" })}
            >
              <option value="">— Elegir propiedad —</option>
              {propiedades.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Tipo</label>
            <select
              className={inputCls}
              value={fila.tipo || ""}
              onChange={(e) => onChange({ tipo: e.target.value || null, asignadoPor: "manual" })}
            >
              <option value="">— Elegir —</option>
              {TIPOS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            {fila.dudoso && (
              <button
                onClick={() => onChange({ dudoso: false })}
                className="flex-1 h-9 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center justify-center gap-1"
              >
                <Check className="w-3.5 h-3.5" strokeWidth={2.4} /> Está bien
              </button>
            )}
            <button
              onClick={onEliminar}
              aria-label="Eliminar fila"
              className="h-9 w-9 shrink-0 rounded-lg bg-red-50 flex items-center justify-center ml-auto"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// `inicial` (opcional): { archivo, lectura } o { manual: true } cuando la pantalla se abre desde
// "Cargar documento" con el archivo ya leído; `onVolverInicio` vuelve a esa pantalla.
export default function PlanillaScreen({ backTo, onNavigate, inicial, onVolverInicio }) {
  const { puedeEditar } = usePermisos();
  const editable = puedeEditar("propiedades");
  const inputCamaraRef = useRef(null);
  const inputGaleriaRef = useRef(null);
  const inputDocumentoRef = useRef(null);

  const [paso, setPaso] = useState(inicial ? "leyendo" : "inicio"); // inicio | leyendo | revision | confirmar | guardando | listo
  const [catalogo, setCatalogo] = useState(null);
  const [mes, setMes] = useState(mesActual());
  const [foto, setFoto] = useState(null); // { paginas: [{ blob, base64, previewUrl }], paginasOmitidas, respaldo, esPdf }
  const [verFoto, setVerFoto] = useState(false);
  const [filas, setFilas] = useState([]);
  const [abierta, setAbierta] = useState(null);
  const [aviso, setAviso] = useState(null); // { tipo: "info" | "error", texto }
  const [soloAlertas, setSoloAlertas] = useState(false);
  const [resultado, setResultado] = useState(null);
  // Guardar el documento en la app (opcional): dónde, en qué carpeta y con qué nombre.
  const [destinos, setDestinos] = useState(null);
  const [guardarDoc, setGuardarDoc] = useState(true);
  const [destinoDoc, setDestinoDoc] = useState(`persona:${PERSONA_DOC_ID}`);
  const [carpetaDoc, setCarpetaDoc] = useState(CARPETA_PLANILLAS);
  const [nombreDoc, setNombreDoc] = useState("");

  useEffect(() => {
    fetchCatalogo().then(setCatalogo);
    fetchDestinos().then(setDestinos);
  }, []);

  useEffect(() => () => liberarArchivo(foto), [foto]);
  const portada = foto?.paginas?.[0]?.previewUrl;

  const propiedades = catalogo?.propiedades || [];
  const periodo = `${mes}-01`;

  const cambiarFila = (id, cambios) => setFilas((fs) => fs.map((f) => (f.id === id ? { ...f, ...cambios } : f)));
  const eliminarFila = (id) => setFilas((fs) => fs.filter((f) => f.id !== id));
  const agregarFila = (seccion, propiedadId) => {
    const nueva = {
      id: nuevoIdFila(), seccion, concepto: "", numero_cliente: "", valor: null, estado: "Pagado", fecha_pago: "",
      dudoso: false, nota: "", propiedadId: propiedadId || null, tipo: null, asignadoPor: "manual",
    };
    setFilas((fs) => {
      const ultimo = fs.map((f) => f.seccion).lastIndexOf(seccion);
      const copia = fs.slice();
      copia.splice(ultimo + 1, 0, nueva);
      return copia;
    });
    setAbierta(nueva.id);
  };

  const empezarManual = (avisoTexto) => {
    if (!catalogo) return;
    setFilas((fs) => (fs.length ? fs : plantillaManual(catalogo)));
    setAviso(avisoTexto ? { tipo: "error", texto: avisoTexto } : null);
    setPaso("revision");
  };

  const handleFoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !catalogo) return;
    setAviso(null);
    setPaso("leyendo");
    let preparada;
    try {
      preparada = await prepararArchivo(file);
    } catch {
      setPaso("inicio");
      setAviso({
        tipo: "error",
        texto: "No se pudo abrir el archivo. Usa una foto (JPG, PNG) o un PDF; si es una foto del iPhone en formato HEIC, compártela como JPG.",
      });
      return;
    }
    setFoto(preparada);
    aplicarLectura(preparada, await leerPlanillaConIA(preparada.paginas, catalogo));
  };

  const aplicarLectura = (preparada, r) => {
    if (r?.error) {
      const texto =
        r.error === "sin_key"
          ? "La lectura automática aún no está activada. Puedes ingresar los montos a mano mirando el documento."
          : `${r.mensaje || "No se pudo leer la planilla."} Puedes ingresar los montos a mano mirando el documento.`;
      setFilas(plantillaManual(catalogo));
      setAviso({ tipo: "error", texto });
      setPaso("revision");
      return;
    }

    if (r.mes && r.anio) setMes(`${r.anio}-${String(r.mes).padStart(2, "0")}`);
    const asignadas = asignarFilas(r.filas || [], catalogo);
    setFilas(asignadas);
    const dudosas = asignadas.filter((f) => f.dudoso || problemasDe(f).length > 0).length;
    const omitidas = preparada.paginasOmitidas
      ? ` Solo se leyeron las primeras ${preparada.paginas.length} páginas del PDF.`
      : "";
    setAviso({
      tipo: "info",
      texto: `Se leyeron ${asignadas.length} filas.${dudosas ? ` ${dudosas} necesitan revisión (en amarillo).` : " Revisa que todo calce con el documento."}${omitidas}`,
    });
    setPaso("revision");
  };

  // Abierta desde "Cargar documento": aplicar la lectura apenas esté el catálogo.
  const inicialAplicado = useRef(false);
  useEffect(() => {
    if (!inicial || !catalogo || inicialAplicado.current) return;
    inicialAplicado.current = true;
    if (inicial.manual) {
      empezarManual();
      return;
    }
    setFoto(inicial.archivo);
    aplicarLectura(inicial.archivo, inicial.lectura);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inicial, catalogo]);

  // Agrupa por sección manteniendo el orden de la planilla.
  const secciones = useMemo(() => {
    const orden = [];
    const mapa = new Map();
    filas.forEach((f) => {
      const k = f.seccion || "Sin sección";
      if (!mapa.has(k)) {
        mapa.set(k, []);
        orden.push(k);
      }
      mapa.get(k).push(f);
    });
    return orden.map((k) => ({ nombre: k, filas: mapa.get(k) }));
  }, [filas]);

  const conMonto = filas.filter((f) => f.valor !== null && f.valor !== "");
  const conProblemas = conMonto.filter((f) => f.dudoso || problemasDe(f).length > 0);
  const listas = filasParaTraspasar(filas);
  const sinDestino = conMonto.filter((f) => !f.propiedadId || !f.tipo);
  const total = listas.reduce((s, f) => s + Number(f.valor), 0);

  const resumenPorPropiedad = useMemo(() => {
    const mapa = new Map();
    listas.forEach((f) => {
      if (!mapa.has(f.propiedadId)) mapa.set(f.propiedadId, []);
      mapa.get(f.propiedadId).push(f);
    });
    return [...mapa.entries()]
      .map(([id, fs]) => ({ id, nombre: propiedades.find((p) => p.id === id)?.nombre || "Propiedad", filas: fs }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [listas, propiedades]);

  const confirmar = async () => {
    setPaso("guardando");
    const res = await traspasarPlanilla(filas, periodo, propiedades);
    let fotoGuardada = false;
    const destino = destinos?.find((d) => claveDestino(d) === destinoDoc);
    if (guardarDoc && foto?.respaldo && destino && res.some((r) => r.ok)) {
      const { error } = await guardarEnDocumentos({
        archivoOriginal: foto.respaldo,
        destino,
        carpetaNombre: carpetaDoc,
        nombre: nombreDoc || `Planilla ${mesTexto}`,
      });
      fotoGuardada = !error;
    }
    setResultado({ res, fotoGuardada, destino, carpeta: carpetaDoc.trim() });
    setPaso("listo");
  };

  const irAtras = () => {
    if (paso === "confirmar") setPaso("revision");
    else if (paso === "revision") (onVolverInicio ? onVolverInicio() : setPaso("inicio"));
    else onNavigate(backTo);
  };

  const mesTexto = new Date(`${periodo}T00:00:00`).toLocaleDateString("es-CL", { month: "long", year: "numeric" });

  const titulo = { inicio: "Cargar planilla", leyendo: "Leyendo...", revision: "Revisar datos", confirmar: "Confirmar", guardando: "Guardando...", listo: "Listo" }[paso];

  return (
    <>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={irAtras} aria-label="Volver" disabled={paso === "guardando" || paso === "leyendo"}>
          <ArrowLeft className="w-6 h-6 text-blue-600" strokeWidth={2} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">{titulo}</h1>
        <div className="w-6" />
      </div>

      <div className="px-5 flex flex-col gap-3 pb-28">
        {!editable && (
          <div className="bg-white rounded-2xl border border-slate-100 px-4 py-8 text-center">
            <p className="text-sm text-slate-500">No tienes permiso para registrar pagos de propiedades.</p>
          </div>
        )}

        {editable && paso === "inicio" && (
          <>
            <p className="text-sm text-slate-500 -mt-1">
              Sube tu planilla de cuentas por pagar: una foto nueva, una imagen de la galería o un PDF. La app
              lee los montos, tú los revisas y al confirmar se registran en cada propiedad.
            </p>
            <div>
              <label className={labelCls}>Mes de la planilla</label>
              <input type="month" className={inputCls} value={mes} onChange={(e) => setMes(e.target.value)} />
            </div>
            <button
              onClick={() => inputCamaraRef.current?.click()}
              disabled={!catalogo}
              className="w-full bg-violet-600 text-white rounded-2xl px-4 py-4 flex items-center justify-center gap-2.5 font-semibold disabled:opacity-50"
            >
              <Camera className="w-5 h-5" strokeWidth={2} /> Sacar foto
            </button>
            <div className="flex gap-2.5">
              <button
                onClick={() => inputGaleriaRef.current?.click()}
                disabled={!catalogo}
                className="flex-1 bg-white border border-slate-200 rounded-2xl px-3 py-3.5 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Images className="w-4 h-4 text-violet-600" strokeWidth={1.8} />
                <span className="text-sm font-semibold text-slate-700">Galería</span>
              </button>
              <button
                onClick={() => inputDocumentoRef.current?.click()}
                disabled={!catalogo}
                className="flex-1 bg-white border border-slate-200 rounded-2xl px-3 py-3.5 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FileUp className="w-4 h-4 text-violet-600" strokeWidth={1.8} />
                <span className="text-sm font-semibold text-slate-700">Documento / PDF</span>
              </button>
            </div>
            <button
              onClick={() => empezarManual()}
              disabled={!catalogo}
              className="w-full border-2 border-dashed border-slate-200 rounded-2xl px-4 py-3.5 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <PenLine className="w-4 h-4 text-violet-600" strokeWidth={1.8} />
              <span className="text-sm font-semibold text-slate-700">Ingresar a mano (sin foto)</span>
            </button>
            <input ref={inputCamaraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFoto} />
            <input ref={inputGaleriaRef} type="file" accept="image/*" className="hidden" onChange={handleFoto} />
            <input ref={inputDocumentoRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={handleFoto} />
            {!catalogo && <p className="text-xs text-slate-400 text-center">Cargando propiedades...</p>}
            {aviso && <p className="text-xs text-red-500">{aviso.texto}</p>}
          </>
        )}

        {paso === "leyendo" && (
          <div className="flex flex-col items-center gap-4 py-6">
            {portada && <img src={portada} alt="Planilla" className="w-40 rounded-xl border border-slate-200 shadow-sm" />}
            <Loader2 className="w-7 h-7 text-violet-600 animate-spin" />
            <p className="text-sm text-slate-500 text-center">Leyendo la planilla... puede tardar hasta un minuto.</p>
          </div>
        )}

        {paso === "revision" && (
          <>
            <div className="flex items-center gap-3">
              {portada && (
                <button onClick={() => setVerFoto(true)} className="shrink-0" aria-label="Ver documento completo">
                  <img src={portada} alt="Planilla" className="w-14 h-[72px] object-cover object-top rounded-lg border border-slate-200" />
                </button>
              )}
              <div className="flex-1 min-w-0">
                <label className={labelCls}>Mes</label>
                <input type="month" className={inputCls} value={mes} onChange={(e) => setMes(e.target.value)} />
              </div>
            </div>
            {foto && (
              <button onClick={() => setVerFoto(true)} className="self-start -mt-1 text-xs font-semibold text-violet-600 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5" strokeWidth={2} />{" "}
                {foto.esPdf ? `Ver PDF para comparar (${foto.paginas.length} pág.)` : "Ver foto para comparar"}
              </button>
            )}

            {aviso && (
              <div
                className={`rounded-xl px-3 py-2.5 text-xs ${
                  aviso.tipo === "error" ? "bg-amber-50 text-amber-800 border border-amber-200" : "bg-violet-50 text-violet-800"
                }`}
              >
                {aviso.texto}
              </div>
            )}

            <div className="flex items-center justify-between text-xs">
              <p className="text-slate-500">
                {conMonto.length} con monto · <span className={conProblemas.length ? "text-amber-700 font-semibold" : ""}>{conProblemas.length} por revisar</span>
              </p>
              <button onClick={() => setSoloAlertas((v) => !v)} className="font-semibold text-violet-600">
                {soloAlertas ? "Ver todas" : "Solo por revisar"}
              </button>
            </div>

            {secciones.map((sec) => {
              const visibles = soloAlertas
                ? sec.filas.filter((f) => f.valor !== null && f.valor !== "" && (f.dudoso || problemasDe(f).length > 0))
                : sec.filas;
              if (visibles.length === 0) return null;
              const propSeccion = sec.filas.find((f) => f.propiedadId)?.propiedadId;
              return (
                <div key={sec.nombre} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-sm font-bold text-slate-900 truncate">{sec.nombre}</p>
                    {!soloAlertas && (
                      <button
                        onClick={() => agregarFila(sec.nombre, propSeccion)}
                        className="text-xs font-semibold text-violet-600 flex items-center gap-0.5 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" strokeWidth={2.4} /> Fila
                      </button>
                    )}
                  </div>
                  {visibles.map((f) => (
                    <FilaPlanilla
                      key={f.id}
                      fila={f}
                      propiedades={propiedades}
                      abierta={abierta === f.id}
                      onToggle={() => setAbierta((a) => (a === f.id ? null : f.id))}
                      onChange={(c) => cambiarFila(f.id, c)}
                      onEliminar={() => eliminarFila(f.id)}
                    />
                  ))}
                </div>
              );
            })}

            {!soloAlertas && (
              <button
                onClick={() => agregarFila("Otros", null)}
                className="w-full border-2 border-dashed border-slate-200 rounded-2xl px-4 py-3 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4 text-violet-600" strokeWidth={2} />
                <span className="text-sm font-semibold text-slate-700">Agregar fila</span>
              </button>
            )}
          </>
        )}

        {paso === "confirmar" && (
          <>
            <div className="bg-violet-50 rounded-2xl px-4 py-3.5">
              <p className="text-sm text-violet-900">
                Se registrarán <b>{listas.length} pagos</b> de <b className="capitalize">{mesTexto}</b> en{" "}
                <b>{resumenPorPropiedad.length} propiedades</b>.
              </p>
              <p className="text-lg font-bold text-violet-900 mt-1">Total {formatCLP(total)}</p>
            </div>

            {sinDestino.length > 0 && (
              <div className="rounded-xl px-3 py-2.5 text-xs bg-amber-50 text-amber-800 border border-amber-200">
                {sinDestino.length} fila(s) con monto no tienen propiedad o tipo y <b>no se traspasarán</b>:{" "}
                {sinDestino.map((f) => f.concepto || "sin concepto").join(", ")}.
              </div>
            )}

            {resumenPorPropiedad.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-bold text-slate-900 truncate">{p.nombre}</p>
                  <p className="text-sm font-bold text-slate-900">{formatCLP(p.filas.reduce((s, f) => s + Number(f.valor), 0))}</p>
                </div>
                {p.filas.map((f) => (
                  <div key={f.id} className="flex items-center justify-between gap-2 py-1 border-t border-slate-50">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">
                        {f.tipo}{f.numero_cliente ? ` · N° ${f.numero_cliente}` : ""}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {f.estado}{f.estado === "Pagado" && f.fecha_pago ? ` el ${formatFechaCorta(f.fecha_pago)}` : ""}
                      </p>
                    </div>
                    <p className="text-xs font-bold text-slate-900 shrink-0">{formatCLP(f.valor)}</p>
                  </div>
                ))}
              </div>
            ))}

            {foto && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3.5 flex flex-col gap-3">
                <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-800">
                  <input type="checkbox" className="w-4 h-4 accent-violet-600" checked={guardarDoc} onChange={(e) => setGuardarDoc(e.target.checked)} />
                  Guardar {foto.esPdf ? "el PDF" : "la foto"} en Documentos
                </label>
                {guardarDoc && destinos && (
                  <DestinoDocumento
                    destinos={destinos}
                    destinoClave={destinoDoc}
                    onDestino={setDestinoDoc}
                    carpeta={carpetaDoc}
                    onCarpeta={setCarpetaDoc}
                    nombre={nombreDoc || `Planilla ${mesTexto}`}
                    onNombre={setNombreDoc}
                  />
                )}
              </div>
            )}
          </>
        )}

        {paso === "guardando" && (
          <div className="flex flex-col items-center gap-3 py-10">
            <Loader2 className="w-7 h-7 text-violet-600 animate-spin" />
            <p className="text-sm text-slate-500">Registrando los pagos en cada propiedad...</p>
          </div>
        )}

        {paso === "listo" && resultado && (() => {
          const ok = resultado.res.filter((r) => r.ok);
          const fallidos = resultado.res.filter((r) => !r.ok);
          const nOk = ok.reduce((s, r) => s + r.n, 0);
          const nombre = (id) => propiedades.find((p) => p.id === id)?.nombre || "Propiedad";
          return (
            <>
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <CheckCircle2 className={`w-12 h-12 ${fallidos.length ? "text-amber-500" : "text-emerald-500"}`} strokeWidth={1.8} />
                <p className="text-base font-bold text-slate-900">{nOk} pagos registrados</p>
                <p className="text-sm text-slate-500">
                  Ya aparecen en Gastos básicos de cada propiedad.
                  {resultado.fotoGuardada
                    ? ` ${foto?.esPdf ? "El PDF quedó guardado" : "La foto quedó guardada"} en Documentos → ${resultado.destino?.nombre}${resultado.carpeta ? ` → ${resultado.carpeta}` : ""}.`
                    : ""}
                </p>
              </div>
              {fallidos.length > 0 && (
                <div className="bg-white rounded-2xl border border-red-100 px-4 py-3">
                  <p className="text-sm font-bold text-red-600 mb-1">No se pudieron guardar:</p>
                  {fallidos.map((r) => (
                    <p key={`${r.propiedadId}${r.tipo}`} className="text-xs text-slate-600 flex items-start gap-1.5 py-0.5">
                      <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-[1px]" />
                      {nombre(r.propiedadId)} · {r.tipo}: {r.error}
                    </p>
                  ))}
                </div>
              )}
              <button
                onClick={() => onNavigate(backTo)}
                className="w-full bg-violet-600 text-white rounded-2xl px-4 py-3.5 font-semibold"
              >
                Listo
              </button>
            </>
          );
        })()}
      </div>

      {(paso === "revision" || paso === "confirmar") && (
        <div className="fixed bottom-0 inset-x-0 z-20 bg-white border-t border-slate-100 px-5 py-3 max-w-sm mx-auto">
          {paso === "revision" ? (
            <button
              onClick={() => { setAbierta(null); setPaso("confirmar"); }}
              disabled={listas.length === 0}
              className="w-full bg-violet-600 text-white rounded-2xl px-4 py-3.5 font-semibold disabled:opacity-40"
            >
              {listas.length === 0 ? "Ingresa al menos un monto" : `Revisar y confirmar (${listas.length})`}
            </button>
          ) : (
            <div className="flex gap-2.5">
              <button onClick={() => setPaso("revision")} className="flex-1 border border-slate-200 rounded-2xl py-3.5 text-sm font-semibold text-slate-700">
                Corregir
              </button>
              <button onClick={confirmar} className="flex-[2] bg-emerald-600 text-white rounded-2xl py-3.5 font-semibold flex items-center justify-center gap-2">
                <Check className="w-5 h-5" strokeWidth={2.4} /> Confirmar traspaso
              </button>
            </div>
          )}
        </div>
      )}

      {paso !== "revision" && paso !== "confirmar" && (
        <>
          <div className="flex-1" />
          <BottomNav onNavigate={onNavigate} />
        </>
      )}

      {verFoto && foto && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
          <div className="flex justify-end p-3">
            <button onClick={() => setVerFoto(false)} aria-label="Cerrar foto" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          <div className="flex-1 overflow-auto flex flex-col gap-3 pb-6">
            {foto.paginas.map((p, i) => (
              <img key={p.previewUrl} src={p.previewUrl} alt={`Planilla, página ${i + 1}`} className="w-full" />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
