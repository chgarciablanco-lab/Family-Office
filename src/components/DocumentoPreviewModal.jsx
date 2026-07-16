import React, { useEffect, useRef, useState } from "react";
import { Download, X, FileText, Image as ImageIcon, File as FileIcon, Share2, Check } from "lucide-react";
import { obtenerUrlPreview, obtenerUrlCompartir, descargarDocumento } from "../lib/documentos";

export function iconoDoc(contentType) {
  if (contentType?.startsWith("image/")) return ImageIcon;
  if (contentType === "application/pdf") return FileText;
  return FileIcon;
}

function ZoomableImage({ src, alt }) {
  const containerRef = useRef(null);
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [gestureActive, setGestureActive] = useState(false);
  const transformRef = useRef(transform);
  transformRef.current = transform;
  const pointersRef = useRef(new Map());
  const gestureRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const puntos = () => Array.from(pointersRef.current.values());
    const dist = (pts) => Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    const midpoint = (pts) =>
      pts.length === 2
        ? { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 }
        : { x: pts[0].x, y: pts[0].y };

    // Recalcula el punto de partida del gesto: al iniciar un toque y también cada vez
    // que cambia la cantidad de dedos a mitad de gesto (p.ej. de 2 a 1), para que no se
    // "congele" el zoom al soltar un dedo antes que el otro.
    const rebaseline = () => {
      const pts = puntos();
      if (pts.length === 0) {
        gestureRef.current = null;
        return;
      }
      gestureRef.current = {
        count: pts.length,
        dist: pts.length === 2 ? dist(pts) : null,
        scale: transformRef.current.scale,
        x: transformRef.current.x,
        y: transformRef.current.y,
        mid: midpoint(pts),
      };
    };

    const onPointerDown = (e) => {
      el.setPointerCapture?.(e.pointerId);
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      rebaseline();
      setGestureActive(true);
    };

    const onPointerMove = (e) => {
      if (!pointersRef.current.has(e.pointerId)) return;
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const pts = puntos();
      if (!gestureRef.current || gestureRef.current.count !== pts.length) {
        rebaseline();
        return;
      }
      if (pts.length === 2) {
        e.preventDefault();
        const newDist = dist(pts);
        const ratio = newDist / gestureRef.current.dist;
        const newScale = Math.min(4, Math.max(1, gestureRef.current.scale * ratio));
        setTransform({ scale: newScale, x: gestureRef.current.x, y: gestureRef.current.y });
      } else if (pts.length === 1 && transformRef.current.scale > 1.01) {
        e.preventDefault();
        const mid = midpoint(pts);
        const dx = mid.x - gestureRef.current.mid.x;
        const dy = mid.y - gestureRef.current.mid.y;
        setTransform((t) => ({ ...t, x: gestureRef.current.x + dx, y: gestureRef.current.y + dy }));
      }
    };

    const onPointerUp = (e) => {
      if (!pointersRef.current.has(e.pointerId)) return;
      pointersRef.current.delete(e.pointerId);
      if (pointersRef.current.size > 0) {
        rebaseline();
        return;
      }
      gestureRef.current = null;
      setGestureActive(false);
      setTransform((t) => (t.scale <= 1.02 ? { scale: 1, x: 0, y: 0 } : t));
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove, { passive: false });
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    el.addEventListener("pointerleave", onPointerUp);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
      el.removeEventListener("pointerleave", onPointerUp);
    };
  }, []);

  const handleDoubleClick = () => {
    setTransform((t) => (t.scale > 1 ? { scale: 1, x: 0, y: 0 } : { scale: 2, x: 0, y: 0 }));
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center overflow-hidden"
      style={{ touchAction: "none" }}
      onDoubleClick={handleDoubleClick}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="max-w-full max-h-[70vh] object-contain select-none"
        style={{
          touchAction: "none",
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none",
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transition: gestureActive ? "none" : "transform 0.15s ease-out",
        }}
      />
    </div>
  );
}

function PdfPaginas({ url }) {
  const containerRef = useRef(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError(false);
    if (containerRef.current) containerRef.current.innerHTML = "";

    (async () => {
      try {
        const [{ getDocument, GlobalWorkerOptions }, workerUrl] = await Promise.all([
          import("pdfjs-dist/build/pdf.mjs"),
          import("pdfjs-dist/build/pdf.worker.min.mjs?url").then((m) => m.default),
        ]);
        GlobalWorkerOptions.workerSrc = workerUrl;

        const pdf = await getDocument(url).promise;
        if (cancelado) return;

        const dpr = Math.min(2, window.devicePixelRatio || 1);
        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelado) return;
          const page = await pdf.getPage(i);
          const viewportBase = page.getViewport({ scale: 1 });
          const anchoDisponible = containerRef.current?.clientWidth || 360;
          const viewport = page.getViewport({ scale: (anchoDisponible / viewportBase.width) * dpr });

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = "100%";
          canvas.style.height = "auto";
          canvas.style.display = "block";
          canvas.style.marginBottom = "12px";
          canvas.style.borderRadius = "8px";
          canvas.style.boxShadow = "0 1px 3px rgba(0,0,0,0.15)";

          const ctx = canvas.getContext("2d");
          await page.render({ canvasContext: ctx, viewport }).promise;
          if (cancelado) return;
          containerRef.current?.appendChild(canvas);
        }
      } catch {
        if (!cancelado) setError(true);
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();

    return () => { cancelado = true; };
  }, [url]);

  if (error) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="text-violet-600 font-semibold text-sm py-10">
        No se pudo previsualizar. Abrir documento →
      </a>
    );
  }

  return (
    <div className="w-full h-full overflow-auto px-3 py-3">
      {cargando && <p className="text-sm text-slate-400 text-center py-10">Cargando páginas...</p>}
      <div ref={containerRef} />
    </div>
  );
}

export default function DocumentoPreviewModal({ doc, onClose }) {
  const [url, setUrl] = useState(null);
  const [descargando, setDescargando] = useState(false);
  const [compartiendo, setCompartiendo] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    let vigente = true;
    obtenerUrlPreview(doc.storage_path).then((u) => { if (vigente) setUrl(u); });
    return () => { vigente = false; };
  }, [doc]);

  const esImagen = doc.content_type?.startsWith("image/");
  const esPdf = doc.content_type === "application/pdf";

  const handleDescargar = async () => {
    setDescargando(true);
    await descargarDocumento(doc);
    setDescargando(false);
  };

  const handleCompartir = async () => {
    setCompartiendo(true);
    const urlCompartir = await obtenerUrlCompartir(doc.storage_path);
    setCompartiendo(false);
    if (!urlCompartir) return;

    if (navigator.share) {
      try {
        await navigator.share({ title: doc.nombre, url: urlCompartir });
      } catch {
        // el usuario canceló el share sheet, no hacemos nada
      }
      return;
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(urlCompartir);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between gap-2 border-b border-slate-100 shrink-0">
          <p className="text-sm font-bold text-slate-900 truncate pr-2 flex-1 min-w-0">{doc.nombre}</p>
          <button
            onClick={handleCompartir}
            disabled={compartiendo}
            aria-label="Compartir documento"
            className="shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center disabled:opacity-50"
          >
            {copiado ? (
              <Check className="w-4 h-4 text-emerald-600" strokeWidth={2} />
            ) : (
              <Share2 className="w-4 h-4 text-slate-600" strokeWidth={1.8} />
            )}
          </button>
          <button
            onClick={handleDescargar}
            disabled={descargando}
            aria-label="Descargar documento"
            className="shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-slate-600" strokeWidth={1.8} />
          </button>
          <button onClick={onClose} aria-label="Cerrar" className="shrink-0">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        {copiado && (
          <p className="text-center text-[11px] text-emerald-600 font-semibold pt-2">Link copiado (válido por 7 días)</p>
        )}
        <div
          className={`flex-1 bg-slate-50 flex items-center justify-center min-h-[200px] ${esImagen ? "" : "overflow-auto"}`}
        >
          {!url && <p className="text-sm text-slate-400 py-10">Cargando...</p>}
          {url && esImagen && <ZoomableImage src={url} alt={doc.nombre} />}
          {url && esPdf && <PdfPaginas url={url} />}
          {url && !esImagen && !esPdf && (
            <button
              onClick={handleDescargar}
              disabled={descargando}
              className="text-violet-600 font-semibold text-sm py-10 disabled:opacity-50"
            >
              {descargando ? "Descargando..." : "Descargar documento →"}
            </button>
          )}
        </div>
        {esImagen && url && (
          <p className="text-center text-[11px] text-slate-400 pb-2">Pellizca para acercar · doble toque para restablecer</p>
        )}
      </div>
    </div>
  );
}
