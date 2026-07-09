import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import BottomNav from "./BottomNav";
import DocumentoPreviewModal, { iconoDoc } from "./DocumentoPreviewModal";
import { fetchTodosLosDocumentos, formatTamano } from "../lib/documentos";
import { formatFechaCorta } from "../lib/format";

export default function DocumentosBuscarScreen({ backTo, onNavigate }) {
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    fetchTodosLosDocumentos().then((data) => {
      setDocumentos(data);
      setLoading(false);
    });
  }, []);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return documentos;
    return documentos.filter((d) =>
      d.nombre.toLowerCase().includes(q) ||
      d.categoria.toLowerCase().includes(q) ||
      d.entidadNombre.toLowerCase().includes(q)
    );
  }, [documentos, busqueda]);

  return (
    <>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={() => onNavigate(backTo)} aria-label="Volver">
          <ArrowLeft className="w-6 h-6 text-blue-600" strokeWidth={2} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Documentos</h1>
        <div className="w-6" />
      </div>

      <div className="px-5 flex flex-col gap-3 pb-4">
        <div className="bg-white border border-slate-100 shadow-sm rounded-xl px-3 py-2.5 flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" strokeWidth={2} />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Busca por nombre, categoría, propiedad..."
            className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none flex-1"
          />
        </div>

        {!loading && (
          <p className="text-xs text-slate-400 -mt-1">
            {filtrados.length} documento{filtrados.length === 1 ? "" : "s"}
          </p>
        )}

        {loading && <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>}

        {!loading && filtrados.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 px-4 py-8 text-center">
            <p className="text-sm text-slate-500">
              {busqueda ? "No hay documentos que coincidan con tu búsqueda." : "Aún no hay documentos guardados."}
            </p>
          </div>
        )}

        {!loading && filtrados.map((doc) => {
          const Icon = iconoDoc(doc.content_type);
          return (
            <button
              key={doc.id}
              onClick={() => setPreview(doc)}
              className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-3.5 py-3 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-slate-500" strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{doc.nombre}</p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{doc.categoria} · {doc.entidadNombre}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {formatTamano(doc.tamano_bytes)} · {formatFechaCorta(doc.created_at.slice(0, 10))}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex-1" />
      <BottomNav onNavigate={onNavigate} />

      {preview && <DocumentoPreviewModal doc={preview} onClose={() => setPreview(null)} />}
    </>
  );
}
