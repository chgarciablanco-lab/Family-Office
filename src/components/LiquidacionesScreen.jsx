import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, Camera, Images, FileUp, Loader2, AlertTriangle, Check, CheckCircle2, XCircle, ImageIcon, X, Trash2,
} from "lucide-react";
import BottomNav from "./BottomNav";
import { formatCLP } from "../lib/format";
import { usePermisos } from "../context/PermisosContext";
import { prepararArchivo, liberarArchivo } from "../lib/planilla";
import {
  MAX_PAGINAS_LIQUIDACIONES, fetchTrabajadores, filasDesdeLectura, leerLiquidacionesConIA, traspasarLiquidaciones,
  filasListas, rutValido, rutLimpio,
} from "../lib/liquidaciones";

const inputCls =
  "w-full h-9 border border-slate-200 rounded-lg px-2.5 text-sm text-slate-900 bg-white outline-none focus:border-violet-400";
const labelCls = "text-[11px] font-semibold text-slate-500 mb-0.5 block";

const mesAnterior = () => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 7);
};
const formatMiles = (n) => (n === null || n === undefined || n === "" ? "" : Number(n).toLocaleString("es-CL"));
const parseMonto = (s) => {
  const d = (s || "").replace(/\D/g, "");
  return d ? parseInt(d, 10) : null;
};

function problemasDe(f, mes) {
  const p = [];
  if (!f.trabajadorId) p.push("Elige el trabajador");
  if (f.liquido === null || f.liquido === "") p.push("Falta el líquido");
  if (f.mes && f.anio && `${f.anio}-${String(f.mes).padStart(2, "0")}` !== mes) p.push("Es de otro mes");
  return p;
}

function TarjetaLiquidacion({ fila, mes, trabajadores, onChange, onEliminar }) {
  const problemas = problemasDe(fila, mes);
  const alerta = fila.dudoso || problemas.length > 0;
  const trabajador = trabajadores.find((t) => t.id === fila.trabajadorId);

  return (
    <div className={`rounded-2xl border px-4 py-3.5 flex flex-col gap-2.5 ${alerta ? "bg-amber-50 border-amber-200" : "bg-white border-slate-100 shadow-sm"}`}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">{fila.nombre || "Sin nombre"}</p>
          <p className="text-[11px] text-slate-500 truncate">
            {fila.rut ? `RUT ${fila.rut} · ` : ""}{fila.empleador || "Empleador no leído"}
            {fila.paginas.length ? ` · pág. ${fila.paginas.join(", ")}` : ""}
          </p>
        </div>
        <button onClick={onEliminar} aria-label="Quitar liquidación" className="shrink-0 w-8 h-8 rounded-lg bg-white/70 flex items-center justify-center">
          <Trash2 className="w-4 h-4 text-red-400" />
        </button>
      </div>

      {(fila.dudoso || problemas.length > 0) && (
        <p className="text-[11px] text-amber-700 flex items-start gap-1">
          <AlertTriangle className="w-3 h-3 mt-[1px] shrink-0" strokeWidth={2.2} />
          <span>{[fila.dudoso && (fila.nota || "Lectura dudosa, revisa"), ...problemas].filter(Boolean).join(" · ")}</span>
        </p>
      )}

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-slate-50 rounded-lg py-1.5">
          <p className="text-[10px] text-slate-400">Imponible</p>
          <p className="text-xs font-semibold text-slate-700">{formatCLP(fila.imponible)}</p>
        </div>
        <div className="bg-slate-50 rounded-lg py-1.5">
          <p className="text-[10px] text-slate-400">Desc. legales</p>
          <p className="text-xs font-semibold text-slate-700">{formatCLP(fila.descuentosLegales)}</p>
        </div>
        <div className="bg-violet-50 rounded-lg py-1.5">
          <p className="text-[10px] text-violet-500">Líquido</p>
          <p className="text-xs font-bold text-violet-800">{formatCLP(fila.liquido)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="col-span-2">
          <label className={labelCls}>
            Trabajador en la app{fila.asignadoPor === "rut" ? " · encontrado por RUT" : fila.asignadoPor === "nombre" ? " · encontrado por nombre" : ""}
          </label>
          <select
            className={inputCls}
            value={fila.trabajadorId || ""}
            onChange={(e) => {
              const t = trabajadores.find((x) => x.id === e.target.value);
              onChange({
                trabajadorId: e.target.value || null,
                asignadoPor: "manual",
                actualizarRut: !!(t && rutValido(fila.rut) && rutLimpio(t.rut) !== rutLimpio(fila.rut)),
              });
            }}
          >
            <option value="">— Elegir trabajador —</option>
            {trabajadores.map((t) => (
              <option key={t.id} value={t.id}>{t.nombre.trim()} · {t.sociedadNombre}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Líquido a registrar ($)</label>
          <input
            className={inputCls}
            inputMode="numeric"
            value={formatMiles(fila.liquido)}
            onChange={(e) => onChange({ liquido: parseMonto(e.target.value), dudoso: false })}
          />
        </div>
      </div>

      {trabajador && rutValido(fila.rut) && rutLimpio(trabajador.rut) !== rutLimpio(fila.rut) && (
        <label className="flex items-start gap-2 text-[11px] text-slate-600">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={fila.actualizarRut}
            onChange={(e) => onChange({ actualizarRut: e.target.checked })}
          />
          <span>
            Actualizar el RUT de {trabajador.nombre.trim()} en la app ({trabajador.rut || "vacío"} → {fila.rut})
          </span>
        </label>
      )}
    </div>
  );
}

// `inicial` (opcional): { archivo, lectura } cuando se abre desde "Cargar documento" con el
// archivo ya leído; `onVolverInicio` vuelve a esa pantalla.
export default function LiquidacionesScreen({ backTo, onNavigate, inicial, onVolverInicio }) {
  const { puedeEditar } = usePermisos();
  const editable = puedeEditar("trabajadores");
  const inputCamaraRef = useRef(null);
  const inputGaleriaRef = useRef(null);
  const inputDocumentoRef = useRef(null);

  const [paso, setPaso] = useState(inicial ? "leyendo" : "inicio"); // inicio | leyendo | revision | confirmar | guardando | listo
  const [trabajadores, setTrabajadores] = useState(null);
  const [mes, setMes] = useState(mesAnterior());
  const [archivo, setArchivo] = useState(null);
  const [verDoc, setVerDoc] = useState(false);
  const [filas, setFilas] = useState([]);
  const [aviso, setAviso] = useState(null);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    fetchTrabajadores().then(setTrabajadores);
  }, []);
  useEffect(() => () => liberarArchivo(archivo), [archivo]);

  const periodo = `${mes}-01`;
  const mesTexto = new Date(`${periodo}T00:00:00`).toLocaleDateString("es-CL", { month: "long", year: "numeric" });
  const portada = archivo?.paginas?.[0]?.previewUrl;

  const cambiarFila = (id, cambios) => setFilas((fs) => fs.map((f) => (f.id === id ? { ...f, ...cambios } : f)));
  const eliminarFila = (id) => setFilas((fs) => fs.filter((f) => f.id !== id));

  const handleArchivo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !trabajadores) return;
    setAviso(null);
    setPaso("leyendo");
    let preparado;
    try {
      preparado = await prepararArchivo(file, { maxPaginas: MAX_PAGINAS_LIQUIDACIONES });
    } catch {
      setPaso("inicio");
      setAviso({ tipo: "error", texto: "No se pudo abrir el archivo. Usa un PDF o una foto (JPG, PNG)." });
      return;
    }
    setArchivo(preparado);
    aplicarLectura(preparado, await leerLiquidacionesConIA(preparado.paginas));
  };

  const aplicarLectura = (preparado, r) => {
    if (r?.error) {
      setPaso("inicio");
      setAviso({ tipo: "error", texto: r.mensaje || "No se pudo leer el documento. Intenta de nuevo." });
      return;
    }

    const nuevas = filasDesdeLectura(r, trabajadores);
    // El mes más frecuente entre las liquidaciones leídas.
    const conteo = {};
    nuevas.forEach((f) => {
      if (f.mes && f.anio) {
        const k = `${f.anio}-${String(f.mes).padStart(2, "0")}`;
        conteo[k] = (conteo[k] || 0) + 1;
      }
    });
    const mesLeido = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (mesLeido) setMes(mesLeido);

    setFilas(nuevas);
    const sinTrabajador = nuevas.filter((f) => !f.trabajadorId).length;
    const omitidas = preparado.paginasOmitidas ? ` Solo se leyeron las primeras ${preparado.paginas.length} páginas.` : "";
    setAviso({
      tipo: sinTrabajador ? "error" : "info",
      texto: `Se leyeron ${nuevas.length} liquidaciones.${sinTrabajador ? ` ${sinTrabajador} no calzan con un trabajador de la app: elígelo a mano.` : " Revisa que todo cuadre."}${omitidas}`,
    });
    setPaso("revision");
  };

  const inicialAplicado = useRef(false);
  useEffect(() => {
    if (!inicial || !trabajadores || inicialAplicado.current) return;
    inicialAplicado.current = true;
    setArchivo(inicial.archivo);
    aplicarLectura(inicial.archivo, inicial.lectura);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inicial, trabajadores]);

  const listas = filasListas(filas);
  const total = listas.reduce((s, f) => s + Number(f.liquido), 0);
  const sinDestino = filas.filter((f) => !filasListas([f]).length);
  const duplicados = useMemo(() => {
    const vistos = {};
    listas.forEach((f) => { vistos[f.trabajadorId] = (vistos[f.trabajadorId] || 0) + 1; });
    return Object.entries(vistos).filter(([, n]) => n > 1).map(([id]) => trabajadores?.find((t) => t.id === id)?.nombre?.trim());
  }, [listas, trabajadores]);

  const confirmar = async () => {
    setPaso("guardando");
    const res = await traspasarLiquidaciones(filas, periodo, archivo, trabajadores);
    setResultado(res);
    setPaso("listo");
  };

  const irAtras = () => {
    if (paso === "confirmar") setPaso("revision");
    else if (paso === "revision") (onVolverInicio ? onVolverInicio() : setPaso("inicio"));
    else onNavigate(backTo);
  };

  const titulo = { inicio: "Cargar liquidaciones", leyendo: "Leyendo...", revision: "Revisar liquidaciones", confirmar: "Confirmar", guardando: "Guardando...", listo: "Listo" }[paso];
  const nombreDe = (id) => trabajadores?.find((t) => t.id === id)?.nombre?.trim() || "Trabajador";

  return (
    <>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={irAtras} aria-label="Volver" disabled={paso === "guardando" || paso === "leyendo"}>
          <ArrowLeft className="w-6 h-6 text-blue-600" strokeWidth={2} />
        </button>
        <h1 className="text-xl font-bold text-slate-900 truncate px-2">{titulo}</h1>
        <div className="w-6" />
      </div>

      <div className="px-5 flex flex-col gap-3 pb-28">
        {!editable && (
          <div className="bg-white rounded-2xl border border-slate-100 px-4 py-8 text-center">
            <p className="text-sm text-slate-500">No tienes permiso para registrar pagos de trabajadores.</p>
          </div>
        )}

        {editable && paso === "inicio" && (
          <>
            <p className="text-sm text-slate-500 -mt-1">
              Sube el PDF de liquidaciones que te envía la contadora, o una foto. La app lee cada liquidación, tú la
              revisas y al confirmar el líquido queda en el pago del mes de cada trabajador.
            </p>
            <button
              onClick={() => inputDocumentoRef.current?.click()}
              disabled={!trabajadores}
              className="w-full bg-violet-600 text-white rounded-2xl px-4 py-4 flex items-center justify-center gap-2.5 font-semibold disabled:opacity-50"
            >
              <FileUp className="w-5 h-5" strokeWidth={2} /> Subir PDF / documento
            </button>
            <div className="flex gap-2.5">
              <button
                onClick={() => inputCamaraRef.current?.click()}
                disabled={!trabajadores}
                className="flex-1 bg-white border border-slate-200 rounded-2xl px-3 py-3.5 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Camera className="w-4 h-4 text-violet-600" strokeWidth={1.8} />
                <span className="text-sm font-semibold text-slate-700">Sacar foto</span>
              </button>
              <button
                onClick={() => inputGaleriaRef.current?.click()}
                disabled={!trabajadores}
                className="flex-1 bg-white border border-slate-200 rounded-2xl px-3 py-3.5 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Images className="w-4 h-4 text-violet-600" strokeWidth={1.8} />
                <span className="text-sm font-semibold text-slate-700">Galería</span>
              </button>
            </div>
            <input ref={inputDocumentoRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={handleArchivo} />
            <input ref={inputCamaraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleArchivo} />
            <input ref={inputGaleriaRef} type="file" accept="image/*" className="hidden" onChange={handleArchivo} />
            {!trabajadores && <p className="text-xs text-slate-400 text-center">Cargando trabajadores...</p>}
            {aviso && <p className="text-xs text-red-500">{aviso.texto}</p>}
          </>
        )}

        {paso === "leyendo" && (
          <div className="flex flex-col items-center gap-4 py-6">
            {portada && <img src={portada} alt="Liquidación" className="w-40 rounded-xl border border-slate-200 shadow-sm" />}
            <Loader2 className="w-7 h-7 text-violet-600 animate-spin" />
            <p className="text-sm text-slate-500 text-center">
              Leyendo {archivo?.paginas?.length > 1 ? `${archivo.paginas.length} páginas` : "la liquidación"}... puede tardar hasta un minuto.
            </p>
          </div>
        )}

        {paso === "revision" && (
          <>
            <div className="flex items-center gap-3">
              {portada && (
                <button onClick={() => setVerDoc(true)} className="shrink-0" aria-label="Ver documento">
                  <img src={portada} alt="Liquidación" className="w-14 h-[72px] object-cover object-top rounded-lg border border-slate-200" />
                </button>
              )}
              <div className="flex-1 min-w-0">
                <label className={labelCls}>Mes de las remuneraciones</label>
                <input type="month" className={inputCls} value={mes} onChange={(e) => setMes(e.target.value)} />
              </div>
            </div>
            {portada && (
              <button onClick={() => setVerDoc(true)} className="self-start -mt-1 text-xs font-semibold text-violet-600 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5" strokeWidth={2} /> Ver documento para comparar
              </button>
            )}
            {aviso && (
              <div className={`rounded-xl px-3 py-2.5 text-xs ${aviso.tipo === "error" ? "bg-amber-50 text-amber-800 border border-amber-200" : "bg-violet-50 text-violet-800"}`}>
                {aviso.texto}
              </div>
            )}
            {filas.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 px-4 py-8 text-center">
                <p className="text-sm text-slate-500">No se encontraron liquidaciones en el documento.</p>
              </div>
            )}
            {filas.map((f) => (
              <TarjetaLiquidacion
                key={f.id}
                fila={f}
                mes={mes}
                trabajadores={trabajadores || []}
                onChange={(c) => cambiarFila(f.id, c)}
                onEliminar={() => eliminarFila(f.id)}
              />
            ))}
          </>
        )}

        {paso === "confirmar" && (
          <>
            <div className="bg-violet-50 rounded-2xl px-4 py-3.5">
              <p className="text-sm text-violet-900">
                Se registrará el líquido de <b>{listas.length} trabajadores</b> en el pago de <b className="capitalize">{mesTexto}</b>.
              </p>
              <p className="text-lg font-bold text-violet-900 mt-1">Total {formatCLP(total)}</p>
            </div>
            {duplicados.length > 0 && (
              <div className="rounded-xl px-3 py-2.5 text-xs bg-amber-50 text-amber-800 border border-amber-200">
                Ojo: {duplicados.join(", ")} aparece más de una vez; quedará el último monto.
              </div>
            )}
            {sinDestino.length > 0 && (
              <div className="rounded-xl px-3 py-2.5 text-xs bg-amber-50 text-amber-800 border border-amber-200">
                {sinDestino.length} liquidación(es) sin trabajador o sin monto <b>no se registrarán</b>:{" "}
                {sinDestino.map((f) => f.nombre || "sin nombre").join(", ")}.
              </div>
            )}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-2">
              {listas.map((f) => (
                <div key={f.id} className="flex items-center justify-between gap-2 py-2 border-b border-slate-50 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{nombreDe(f.trabajadorId)}</p>
                    {f.actualizarRut && <p className="text-[11px] text-slate-400">Se actualiza RUT a {f.rut}</p>}
                  </div>
                  <p className="text-sm font-bold text-slate-900 shrink-0">{formatCLP(f.liquido)}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400">
              La liquidación de cada uno se guardará en sus Documentos → Liquidaciones. El monto de Previred y el
              estado del pago no se modifican.
            </p>
          </>
        )}

        {paso === "guardando" && (
          <div className="flex flex-col items-center gap-3 py-10">
            <Loader2 className="w-7 h-7 text-violet-600 animate-spin" />
            <p className="text-sm text-slate-500">Registrando liquidaciones...</p>
          </div>
        )}

        {paso === "listo" && resultado && (() => {
          const ok = resultado.filter((r) => r.ok);
          const fallidos = resultado.filter((r) => !r.ok);
          const sinDoc = ok.filter((r) => !r.documento).length;
          return (
            <>
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <CheckCircle2 className={`w-12 h-12 ${fallidos.length ? "text-amber-500" : "text-emerald-500"}`} strokeWidth={1.8} />
                <p className="text-base font-bold text-slate-900">{ok.length} liquidaciones registradas</p>
                <p className="text-sm text-slate-500">
                  Ya aparecen en el pago de {mesTexto} de cada trabajador
                  {sinDoc ? `; ${sinDoc} sin documento guardado` : ", con su liquidación en Documentos"}.
                </p>
              </div>
              {fallidos.length > 0 && (
                <div className="bg-white rounded-2xl border border-red-100 px-4 py-3">
                  <p className="text-sm font-bold text-red-600 mb-1">No se pudieron guardar:</p>
                  {fallidos.map((r) => (
                    <p key={r.fila.id} className="text-xs text-slate-600 flex items-start gap-1.5 py-0.5">
                      <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-[1px]" />
                      {nombreDe(r.fila.trabajadorId)}: {r.error}
                    </p>
                  ))}
                </div>
              )}
              <button onClick={() => onNavigate(backTo)} className="w-full bg-violet-600 text-white rounded-2xl px-4 py-3.5 font-semibold">
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
              onClick={() => setPaso("confirmar")}
              disabled={listas.length === 0}
              className="w-full bg-violet-600 text-white rounded-2xl px-4 py-3.5 font-semibold disabled:opacity-40"
            >
              {listas.length === 0 ? "Asigna al menos un trabajador" : `Revisar y confirmar (${listas.length})`}
            </button>
          ) : (
            <div className="flex gap-2.5">
              <button onClick={() => setPaso("revision")} className="flex-1 border border-slate-200 rounded-2xl py-3.5 text-sm font-semibold text-slate-700">
                Corregir
              </button>
              <button onClick={confirmar} className="flex-[2] bg-emerald-600 text-white rounded-2xl py-3.5 font-semibold flex items-center justify-center gap-2">
                <Check className="w-5 h-5" strokeWidth={2.4} /> Confirmar
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

      {verDoc && archivo && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
          <div className="flex justify-end p-3">
            <button onClick={() => setVerDoc(false)} aria-label="Cerrar" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          <div className="flex-1 overflow-auto flex flex-col gap-3 pb-6">
            {archivo.paginas.map((p, i) => (
              <img key={p.previewUrl} src={p.previewUrl} alt={`Página ${i + 1}`} className="w-full" />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
