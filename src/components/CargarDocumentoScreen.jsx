import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, Camera, Images, FileUp, Loader2, PenLine, FolderInput, CheckCircle2, ImageIcon, X, Sparkles,
} from "lucide-react";
import BottomNav from "./BottomNav";
import PlanillaScreen from "./PlanillaScreen";
import LiquidacionesScreen from "./LiquidacionesScreen";
import { usePermisos } from "../context/PermisosContext";
import DestinoDocumento from "./DestinoDocumento";
import { prepararArchivo, liberarArchivo, fetchCatalogo } from "../lib/planilla";
import { MAX_PAGINAS_DOCUMENTO, fetchDestinos, leerDocumentoConIA, guardarEnDocumentos } from "../lib/cargaDocumento";


const claveDestino = (d) => (d ? `${d.tipo}:${d.id}` : "");

// Revisión de un documento que no es planilla ni liquidación: dónde guardarlo en Documentos.
function OtroDocumento({ archivo, original, lectura, destinos, onVolver, onListo }) {
  const sugerido = destinos.find((d) => d.tipo === lectura.destino_tipo && d.id === lectura.destino_id) || destinos[0];
  const [destinoClave, setDestinoClave] = useState(claveDestino(sugerido));
  const [carpeta, setCarpeta] = useState(lectura.carpeta_sugerida || "");
  const [nombre, setNombre] = useState(lectura.nombre_sugerido || (original.name || "Documento").replace(/\.[^.]+$/, ""));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [verDoc, setVerDoc] = useState(false);

  const destino = destinos.find((d) => claveDestino(d) === destinoClave);
  const portada = archivo.paginas[0]?.previewUrl;

  const guardar = async () => {
    if (!destino) return;
    setGuardando(true);
    setError("");
    const { error: e } = await guardarEnDocumentos({ archivoOriginal: original, destino, carpetaNombre: carpeta, nombre });
    setGuardando(false);
    if (e) setError(e.message || "No se pudo guardar el documento.");
    else onListo({ destino, carpeta: carpeta.trim(), nombre });
  };

  return (
    <>
      <div className="flex items-start gap-3">
        {portada && (
          <button onClick={() => setVerDoc(true)} className="shrink-0" aria-label="Ver documento">
            <img src={portada} alt="Documento" className="w-16 h-20 object-cover object-top rounded-lg border border-slate-200" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-violet-600 flex items-center gap-1">
            <Sparkles className="w-3 h-3" strokeWidth={2.2} /> {lectura.tipo_documento || "Documento"}
          </p>
          <p className="text-xs text-slate-600 mt-0.5">{lectura.resumen}</p>
          {portada && (
            <button onClick={() => setVerDoc(true)} className="mt-1 text-xs font-semibold text-violet-600 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5" strokeWidth={2} /> Ver documento
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3.5 flex flex-col gap-3">
        <DestinoDocumento
          destinos={destinos}
          destinoClave={destinoClave}
          onDestino={setDestinoClave}
          carpeta={carpeta}
          onCarpeta={setCarpeta}
          nombre={nombre}
          onNombre={setNombre}
        />
        {lectura.motivo && destino && claveDestino(destino) === claveDestino(sugerido) && (
          <p className="text-[11px] text-slate-400 -mt-1">Sugerido porque {lectura.motivo.charAt(0).toLowerCase() + lectura.motivo.slice(1)}</p>
        )}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      <div className="flex gap-2.5">
        <button onClick={onVolver} className="flex-1 border border-slate-200 rounded-2xl py-3.5 text-sm font-semibold text-slate-700">
          Cancelar
        </button>
        <button
          onClick={guardar}
          disabled={guardando || !destino || !nombre.trim()}
          className="flex-[2] bg-emerald-600 text-white rounded-2xl py-3.5 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {guardando ? <Loader2 className="w-5 h-5 animate-spin" /> : <FolderInput className="w-5 h-5" strokeWidth={2} />}
          Guardar
        </button>
      </div>

      {verDoc && (
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

export default function CargarDocumentoScreen({ backTo, onNavigate }) {
  const { puedeEditar } = usePermisos();
  const puedePlanilla = puedeEditar("propiedades");
  const inputCamaraRef = useRef(null);
  const inputGaleriaRef = useRef(null);
  const inputDocumentoRef = useRef(null);

  // inicio | leyendo | planilla | liquidaciones | otro | guardado
  const [paso, setPaso] = useState("inicio");
  const [catalogo, setCatalogo] = useState(null);
  const [destinos, setDestinos] = useState(null);
  const [archivo, setArchivo] = useState(null);
  const [original, setOriginal] = useState(null);
  const [lectura, setLectura] = useState(null);
  const [aviso, setAviso] = useState("");
  const [guardado, setGuardado] = useState(null);

  useEffect(() => {
    fetchCatalogo().then(setCatalogo);
    fetchDestinos().then(setDestinos);
  }, []);

  const listo = !!catalogo && !!destinos;

  const volverInicio = () => {
    liberarArchivo(archivo);
    setArchivo(null);
    setOriginal(null);
    setLectura(null);
    setPaso("inicio");
  };

  const handleArchivo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !listo) return;
    setAviso("");
    setPaso("leyendo");
    let preparado;
    try {
      preparado = await prepararArchivo(file, { maxPaginas: MAX_PAGINAS_DOCUMENTO });
    } catch {
      setPaso("inicio");
      setAviso("No se pudo abrir el archivo. Usa un PDF o una foto (JPG, PNG); si es una foto HEIC del iPhone, compártela como JPG.");
      return;
    }
    setArchivo(preparado);
    setOriginal(file);

    const r = await leerDocumentoConIA(preparado.paginas, catalogo, destinos);
    if (r?.error || !r?.tipo) {
      liberarArchivo(preparado);
      setArchivo(null);
      setPaso("inicio");
      setAviso(`${r?.mensaje || "No se pudo leer el documento."} Intenta de nuevo${puedePlanilla ? " o ingresa la planilla a mano" : ""}.`);
      return;
    }
    setLectura(r.datos);
    setPaso(r.tipo);
  };

  if (paso === "planilla") {
    return (
      <PlanillaScreen
        backTo={backTo}
        onNavigate={onNavigate}
        inicial={lectura ? { archivo, lectura } : { manual: true }}
        onVolverInicio={volverInicio}
      />
    );
  }
  if (paso === "liquidaciones") {
    return <LiquidacionesScreen backTo={backTo} onNavigate={onNavigate} inicial={{ archivo, lectura }} onVolverInicio={volverInicio} />;
  }

  const titulo = { inicio: "Cargar documento", leyendo: "Leyendo...", otro: "Guardar documento", guardado: "Listo" }[paso];
  const portada = archivo?.paginas?.[0]?.previewUrl;

  return (
    <>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button
          onClick={() => (paso === "otro" ? volverInicio() : onNavigate(backTo))}
          aria-label="Volver"
          disabled={paso === "leyendo"}
        >
          <ArrowLeft className="w-6 h-6 text-blue-600" strokeWidth={2} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">{titulo}</h1>
        <div className="w-6" />
      </div>

      <div className="px-5 flex flex-col gap-3 pb-6">
        {paso === "inicio" && (
          <>
            <p className="text-sm text-slate-500 -mt-1">
              Sube cualquier documento. La app reconoce qué es y te lleva a revisarlo: la planilla de pagos se reparte en
              las propiedades, las liquidaciones en cada trabajador, y el resto se guarda en la carpeta que corresponda.
            </p>
            <button
              onClick={() => inputCamaraRef.current?.click()}
              disabled={!listo}
              className="w-full bg-violet-600 text-white rounded-2xl px-4 py-4 flex items-center justify-center gap-2.5 font-semibold disabled:opacity-50"
            >
              <Camera className="w-5 h-5" strokeWidth={2} /> Sacar foto
            </button>
            <div className="flex gap-2.5">
              <button
                onClick={() => inputGaleriaRef.current?.click()}
                disabled={!listo}
                className="flex-1 bg-white border border-slate-200 rounded-2xl px-3 py-3.5 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Images className="w-4 h-4 text-violet-600" strokeWidth={1.8} />
                <span className="text-sm font-semibold text-slate-700">Galería</span>
              </button>
              <button
                onClick={() => inputDocumentoRef.current?.click()}
                disabled={!listo}
                className="flex-1 bg-white border border-slate-200 rounded-2xl px-3 py-3.5 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FileUp className="w-4 h-4 text-violet-600" strokeWidth={1.8} />
                <span className="text-sm font-semibold text-slate-700">PDF / archivo</span>
              </button>
            </div>
            {puedePlanilla && (
              <button
                onClick={() => setPaso("planilla")}
                disabled={!listo}
                className="self-center text-xs font-semibold text-violet-600 py-2 flex items-center gap-1 disabled:opacity-50"
              >
                <PenLine className="w-3.5 h-3.5" strokeWidth={2} /> Ingresar planilla de pagos a mano
              </button>
            )}
            <input ref={inputCamaraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleArchivo} />
            <input ref={inputGaleriaRef} type="file" accept="image/*" className="hidden" onChange={handleArchivo} />
            <input ref={inputDocumentoRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={handleArchivo} />
            {!listo && <p className="text-xs text-slate-400 text-center">Cargando...</p>}
            {aviso && <p className="text-xs text-red-500">{aviso}</p>}
          </>
        )}

        {paso === "leyendo" && (
          <div className="flex flex-col items-center gap-4 py-6">
            {portada && <img src={portada} alt="Documento" className="w-40 rounded-xl border border-slate-200 shadow-sm" />}
            <Loader2 className="w-7 h-7 text-violet-600 animate-spin" />
            <p className="text-sm text-slate-500 text-center">Reconociendo y leyendo el documento... puede tardar hasta un minuto.</p>
          </div>
        )}

        {paso === "otro" && archivo && lectura && (
          <OtroDocumento
            archivo={archivo}
            original={original}
            lectura={lectura}
            destinos={destinos}
            onVolver={volverInicio}
            onListo={(g) => { setGuardado(g); setPaso("guardado"); }}
          />
        )}

        {paso === "guardado" && guardado && (
          <>
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" strokeWidth={1.8} />
              <p className="text-base font-bold text-slate-900">Documento guardado</p>
              <p className="text-sm text-slate-500">
                "{guardado.nombre}" quedó en Documentos → {guardado.destino.nombre}
                {guardado.carpeta ? ` → ${guardado.carpeta}` : ""}.
              </p>
            </div>
            <button onClick={volverInicio} className="w-full bg-violet-600 text-white rounded-2xl px-4 py-3.5 font-semibold">
              Cargar otro documento
            </button>
            <button onClick={() => onNavigate(backTo)} className="w-full border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-700">
              Listo
            </button>
          </>
        )}
      </div>

      <div className="flex-1" />
      <BottomNav onNavigate={onNavigate} />
    </>
  );
}
