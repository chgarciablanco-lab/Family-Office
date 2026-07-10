import React, { useEffect, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import {
  ArrowLeft, X, Camera, Check, ChevronRight, FileText, Sparkles,
} from "lucide-react";
import BottomNav from "./BottomNav";
import DocumentosBuscarScreen from "./DocumentosBuscarScreen";
import { Field, inputClass } from "./TramiteSection";
import {
  CATEGORIAS_DOCUMENTOS, subirDocumento, buscarEntidadPorNombre, clasificarDocumento,
} from "../lib/documentos";

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function compilarPdf(paginas) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  for (let i = 0; i < paginas.length; i++) {
    if (i > 0) doc.addPage();
    const img = new Image();
    img.src = paginas[i].dataUrl;
    await new Promise((resolve) => { img.onload = resolve; });
    const ratio = Math.min(pageW / img.width, pageH / img.height);
    const w = img.width * ratio;
    const h = img.height * ratio;
    doc.addImage(paginas[i].dataUrl, "JPEG", (pageW - w) / 2, (pageH - h) / 2, w, h);
  }
  return doc.output("blob");
}

export default function EscanearDocumentoScreen({ backTo, onNavigate }) {
  const [step, setStep] = useState("camara"); // camara | clasificando | destino | confirmar | listo
  const [paginas, setPaginas] = useState([]);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [pdfBlob, setPdfBlob] = useState(null);
  const [destino, setDestino] = useState(null); // { entidadTipo, entidadId, entidadNombre }
  const [categoria, setCategoria] = useState("");
  const [categoriaOtra, setCategoriaOtra] = useState(false);
  const [nombreDocumento, setNombreDocumento] = useState("");
  const [sugerenciaIA, setSugerenciaIA] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (step !== "camara") return;
    let activo = true;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((stream) => {
        if (!activo) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setCameraError("No pudimos acceder a la cámara. Revisa los permisos del navegador."));

    return () => {
      activo = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [step]);

  const handleCapturar = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setPaginas((p) => [...p, { id: Date.now(), dataUrl }]);
  };

  const handleEliminarPagina = (id) => setPaginas((p) => p.filter((pg) => pg.id !== id));

  const handleArchivoManual = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => setPaginas((p) => [...p, { id: Date.now() + Math.random(), dataUrl: reader.result }]);
      reader.readAsDataURL(file);
    });
  };

  const handleContinuar = async () => {
    if (paginas.length === 0) return;
    setStep("clasificando");
    const blob = await compilarPdf(paginas);
    setPdfBlob(blob);

    const base64 = await blobToBase64(blob);
    const sugerencia = await clasificarDocumento(base64);

    if (sugerencia?.entidadTipo && sugerencia?.entidadNombreSugerido) {
      const entidad = await buscarEntidadPorNombre(sugerencia.entidadTipo, sugerencia.entidadNombreSugerido);
      if (entidad) {
        setSugerenciaIA(sugerencia);
        setDestino({ entidadTipo: sugerencia.entidadTipo, entidadId: entidad.id, entidadNombre: entidad.nombre });
        setCategoria(sugerencia.categoria || "");
        setNombreDocumento(sugerencia.nombreDocumento || sugerencia.categoria || "");
        setStep("confirmar");
        return;
      }
    }
    setStep("destino");
  };

  const handleSeleccionarDestino = (entidadTipo, entidadId, entidadNombre) => {
    setDestino({ entidadTipo, entidadId, entidadNombre });
    if (!categoria) setCategoria(CATEGORIAS_DOCUMENTOS[entidadTipo]?.[0] || "");
    setStep("confirmar");
  };

  const handleGuardar = async () => {
    if (!destino || !pdfBlob) return;
    const nombreCategoria = categoria;
    if (!nombreCategoria.trim()) {
      setError("Elige o escribe una categoría.");
      return;
    }
    setGuardando(true);
    setError("");
    const nombreArchivo = (nombreDocumento.trim() || nombreCategoria).replace(/[^a-zA-Z0-9._\- ]/g, "").trim() || "documento";
    const file = new File([pdfBlob], `${nombreArchivo}.pdf`, { type: "application/pdf" });
    const { error } = await subirDocumento(destino.entidadTipo, destino.entidadId, nombreCategoria.trim(), file);
    setGuardando(false);
    if (error) {
      setError(error.message || "No se pudo guardar el documento.");
      return;
    }
    setStep("listo");
  };

  const reiniciar = () => {
    setPaginas([]);
    setPdfBlob(null);
    setDestino(null);
    setCategoria("");
    setCategoriaOtra(false);
    setNombreDocumento("");
    setSugerenciaIA(null);
    setError("");
    setStep("camara");
  };

  // Paso "destino": reutilizamos el navegador de carpetas de Documentos en modo selección.
  if (step === "destino") {
    return (
      <DocumentosBuscarScreen
        modoSeleccion
        backTo="__local__"
        onNavigate={() => setStep("camara")}
        onSeleccionarDestino={handleSeleccionarDestino}
      />
    );
  }

  if (step === "listo") {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-8 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <Check className="w-8 h-8 text-emerald-600" strokeWidth={2} />
        </div>
        <p className="text-base font-bold text-slate-900">Documento guardado</p>
        <p className="text-sm text-slate-500">
          Se guardó en {destino?.entidadNombre} · {categoria}
        </p>
        <div className="flex flex-col gap-2 w-full max-w-xs mt-2">
          <button
            onClick={reiniciar}
            className="w-full bg-violet-600 text-white font-semibold text-sm rounded-xl py-3"
          >
            Escanear otro documento
          </button>
          <button
            onClick={() => onNavigate("home")}
            className="w-full bg-slate-100 text-slate-700 font-semibold text-sm rounded-xl py-3"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={() => (step === "confirmar" ? setStep(paginas.length ? "destino" : "camara") : onNavigate(backTo))} aria-label="Volver">
          <ArrowLeft className="w-6 h-6 text-blue-600" strokeWidth={2} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Escanear documento</h1>
        <div className="w-6" />
      </div>

      {step === "camara" && (
        <div className="flex flex-col gap-3 px-5 pb-4">
          <div className="relative w-full aspect-[3/4] bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center">
            {cameraError ? (
              <p className="text-sm text-slate-300 text-center px-6">{cameraError}</p>
            ) : (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />

          <div className="flex items-center justify-center gap-6">
            <label className="text-xs font-semibold text-violet-600 active:opacity-60">
              Elegir de galería
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleArchivoManual} />
            </label>
            <button
              onClick={handleCapturar}
              disabled={!!cameraError}
              aria-label="Capturar página"
              className="w-16 h-16 rounded-full bg-white border-4 border-violet-600 flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform"
            >
              <Camera className="w-6 h-6 text-violet-600" strokeWidth={2} />
            </button>
            <div className="w-[88px]" />
          </div>

          {paginas.length > 0 && (
            <>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {paginas.map((pg, i) => (
                  <div key={pg.id} className="relative shrink-0">
                    <img src={pg.dataUrl} alt={`Página ${i + 1}`} className="w-16 h-20 object-cover rounded-lg border border-slate-200" />
                    <button
                      onClick={() => handleEliminarPagina(pg.id)}
                      aria-label="Eliminar página"
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center"
                    >
                      <X className="w-3 h-3 text-white" strokeWidth={2.5} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={handleContinuar}
                className="w-full bg-violet-600 text-white font-semibold text-sm rounded-xl py-3"
              >
                Continuar ({paginas.length} página{paginas.length === 1 ? "" : "s"})
              </button>
            </>
          )}
        </div>
      )}

      {step === "clasificando" && (
        <div className="flex flex-col items-center justify-center gap-3 px-8 py-16 text-center">
          <Sparkles className="w-8 h-8 text-violet-500 animate-pulse" />
          <p className="text-sm text-slate-500">Identificando el documento...</p>
        </div>
      )}

      {step === "confirmar" && destino && (
        <div className="flex flex-col gap-4 px-5 pb-4">
          {sugerenciaIA && (
            <div className="bg-violet-50 border border-violet-100 rounded-2xl px-4 py-3 flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-violet-500 shrink-0" strokeWidth={2} />
              <p className="text-xs text-violet-700">Detectamos automáticamente este documento. Revisa antes de guardar.</p>
            </div>
          )}

          <button
            onClick={() => setStep("destino")}
            className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3.5 flex items-center gap-3.5 text-left active:scale-[0.98] transition-transform"
          >
            <div className="w-11 h-11 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-teal-600" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Se guardará en</p>
              <p className="text-sm font-bold text-slate-900 truncate">{destino.entidadNombre}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
          </button>

          <Field label="Categoría">
            {!categoriaOtra ? (
              <select
                className={inputClass}
                value={categoria}
                onChange={(e) => {
                  if (e.target.value === "__otra__") { setCategoriaOtra(true); setCategoria(""); }
                  else setCategoria(e.target.value);
                }}
              >
                {(CATEGORIAS_DOCUMENTOS[destino.entidadTipo] || []).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="__otra__">Otra categoría...</option>
              </select>
            ) : (
              <input
                autoFocus
                className={inputClass}
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                placeholder="Nombre de la categoría"
              />
            )}
          </Field>

          <Field label="Nombre del documento">
            <input
              className={inputClass}
              value={nombreDocumento}
              onChange={(e) => setNombreDocumento(e.target.value)}
              placeholder="Ej: Liquidación julio 2026"
            />
          </Field>

          <p className="text-xs text-slate-400 -mt-1">{paginas.length} página{paginas.length === 1 ? "" : "s"} escaneada{paginas.length === 1 ? "" : "s"}, compiladas en un PDF.</p>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="w-full bg-violet-600 text-white font-semibold text-sm rounded-xl py-3 disabled:opacity-60"
          >
            {guardando ? "Guardando..." : "Guardar documento"}
          </button>
        </div>
      )}

      <div className="flex-1" />
      <BottomNav onNavigate={onNavigate} />
    </>
  );
}
