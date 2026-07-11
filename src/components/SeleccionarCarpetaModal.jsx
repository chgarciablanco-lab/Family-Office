import React, { useEffect, useState } from "react";
import { X, ArrowLeft, Folder, ChevronRight } from "lucide-react";
import { fetchCarpetas } from "../lib/documentos";

export default function SeleccionarCarpetaModal({ entidadTipo, entidadId, entidadNombre, excluir, onSeleccionar, onClose }) {
  const [path, setPath] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const carpetaActual = path[path.length - 1] || null;

  useEffect(() => {
    setLoading(true);
    fetchCarpetas(entidadTipo, entidadId, carpetaActual?.id).then((data) => {
      setItems(excluir ? data.filter((c) => !excluir.has(c.id)) : data);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carpetaActual?.id]);

  const titulo = carpetaActual?.nombre || entidadNombre;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl max-h-[80vh] flex flex-col">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-slate-100 shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {path.length > 0 && (
              <button onClick={() => setPath((p) => p.slice(0, -1))} aria-label="Volver" className="shrink-0">
                <ArrowLeft className="w-5 h-5 text-blue-600" strokeWidth={2} />
              </button>
            )}
            <h2 className="text-base font-bold text-slate-900 truncate">{titulo}</h2>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="shrink-0">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2">
          {loading && <p className="text-sm text-slate-400 text-center py-6">Cargando...</p>}
          {!loading && items.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">No hay subcarpetas acá.</p>
          )}
          {!loading && items.map((c) => (
            <button
              key={c.id}
              onClick={() => setPath((p) => [...p, { id: c.id, nombre: c.nombre }])}
              className="w-full bg-slate-50 rounded-xl px-3.5 py-3 flex items-center gap-3 text-left"
            >
              <Folder className="w-4 h-4 text-violet-600 shrink-0" strokeWidth={1.8} />
              <p className="flex-1 min-w-0 text-sm font-semibold text-slate-900 truncate">{c.nombre}</p>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </button>
          ))}
        </div>

        <div className="px-5 py-4 border-t border-slate-100 shrink-0">
          <button
            onClick={() => onSeleccionar(carpetaActual?.id || null)}
            className="w-full bg-violet-600 text-white font-semibold text-sm rounded-xl py-3 truncate"
          >
            Mover aquí — {titulo}
          </button>
        </div>
      </div>
    </div>
  );
}
