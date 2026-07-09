import React, { useEffect, useRef, useState } from "react";
import { Download, X, FileText, Image as ImageIcon, File as FileIcon } from "lucide-react";
import { obtenerUrlPreview, descargarDocumento } from "../lib/documentos";

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
  const gestureRef = useRef({ touchCount: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const dist = (touches) => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
    const midpoint = (touches) =>
      touches.length === 2
        ? { x: (touches[0].clientX + touches[1].clientX) / 2, y: (touches[0].clientY + touches[1].clientY) / 2 }
        : { x: touches[0].clientX, y: touches[0].clientY };

    // Recalcula el punto de partida del gesto: se llama al iniciar un toque y también
    // cada vez que cambia la cantidad de dedos a mitad de gesto (p.ej. de 2 a 1), para
    // que no se "congele" el zoom al soltar un dedo antes que el otro.
    const rebaseline = (touches) => {
      gestureRef.current = {
        touchCount: touches.length,
        dist: touches.length === 2 ? dist(touches) : null,
        scale: transformRef.current.scale,
        x: transformRef.current.x,
        y: transformRef.current.y,
        mid: midpoint(touches),
      };
    };

    const onTouchStart = (e) => {
      rebaseline(e.touches);
      setGestureActive(true);
    };

    const onTouchMove = (e) => {
      if (e.touches.length !== gestureRef.current.touchCount) {
        rebaseline(e.touches);
        return;
      }
      if (e.touches.length === 2) {
        e.preventDefault();
        const newDist = dist(e.touches);
        const ratio = newDist / gestureRef.current.dist;
        const newScale = Math.min(4, Math.max(1, gestureRef.current.scale * ratio));
        setTransform({ scale: newScale, x: gestureRef.current.x, y: gestureRef.current.y });
      } else if (e.touches.length === 1 && transformRef.current.scale > 1.01) {
        e.preventDefault();
        const mid = midpoint(e.touches);
        const dx = mid.x - gestureRef.current.mid.x;
        const dy = mid.y - gestureRef.current.mid.y;
        setTransform((t) => ({ ...t, x: gestureRef.current.x + dx, y: gestureRef.current.y + dy }));
      }
    };

    const onTouchEnd = (e) => {
      if (e.touches.length > 0) {
        rebaseline(e.touches);
        return;
      }
      gestureRef.current = { touchCount: 0 };
      setGestureActive(false);
      setTransform((t) => (t.scale <= 1.02 ? { scale: 1, x: 0, y: 0 } : t));
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
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
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transition: gestureActive ? "none" : "transform 0.15s ease-out",
        }}
      />
    </div>
  );
}

export default function DocumentoPreviewModal({ doc, onClose }) {
  const [url, setUrl] = useState(null);
  const [descargando, setDescargando] = useState(false);

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

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between gap-2 border-b border-slate-100 shrink-0">
          <p className="text-sm font-bold text-slate-900 truncate pr-2 flex-1 min-w-0">{doc.nombre}</p>
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
        <div
          className={`flex-1 bg-slate-50 flex items-center justify-center min-h-[200px] ${esImagen ? "" : "overflow-auto"}`}
        >
          {!url && <p className="text-sm text-slate-400 py-10">Cargando...</p>}
          {url && esImagen && <ZoomableImage src={url} alt={doc.nombre} />}
          {url && esPdf && (
            <iframe src={url} title={doc.nombre} className="w-full h-[70vh] border-0" />
          )}
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
