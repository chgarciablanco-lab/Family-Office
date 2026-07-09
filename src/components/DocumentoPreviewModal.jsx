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
  const transformRef = useRef(transform);
  transformRef.current = transform;
  const gestureRef = useRef({});

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const dist = (touches) => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        gestureRef.current = {
          type: "pinch",
          startDist: dist(e.touches),
          startScale: transformRef.current.scale,
          startX: transformRef.current.x,
          startY: transformRef.current.y,
        };
      } else if (e.touches.length === 1 && transformRef.current.scale > 1.01) {
        gestureRef.current = {
          type: "pan",
          startTouchX: e.touches[0].clientX,
          startTouchY: e.touches[0].clientY,
          startX: transformRef.current.x,
          startY: transformRef.current.y,
        };
      } else {
        gestureRef.current = {};
      }
    };

    const onTouchMove = (e) => {
      if (gestureRef.current.type === "pinch" && e.touches.length === 2) {
        e.preventDefault();
        const newDist = dist(e.touches);
        const newScale = Math.min(4, Math.max(1, gestureRef.current.startScale * (newDist / gestureRef.current.startDist)));
        setTransform({ scale: newScale, x: gestureRef.current.startX, y: gestureRef.current.startY });
      } else if (gestureRef.current.type === "pan" && e.touches.length === 1) {
        e.preventDefault();
        const dx = e.touches[0].clientX - gestureRef.current.startTouchX;
        const dy = e.touches[0].clientY - gestureRef.current.startTouchY;
        setTransform((t) => ({ ...t, x: gestureRef.current.startX + dx, y: gestureRef.current.startY + dy }));
      }
    };

    const onTouchEnd = (e) => {
      if (e.touches.length === 0) {
        gestureRef.current = {};
        setTransform((t) => (t.scale <= 1.02 ? { scale: 1, x: 0, y: 0 } : t));
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  const handleDoubleClick = () => {
    setTransform((t) => (t.scale > 1 ? { scale: 1, x: 0, y: 0 } : { scale: 2, x: 0, y: 0 }));
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center overflow-hidden"
      style={{ touchAction: transform.scale > 1 ? "none" : "pan-y" }}
      onDoubleClick={handleDoubleClick}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="max-w-full max-h-[70vh] object-contain select-none"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transition: gestureRef.current.type ? "none" : "transform 0.15s ease-out",
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
        <div className="flex-1 overflow-auto bg-slate-50 flex items-center justify-center min-h-[200px]">
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
