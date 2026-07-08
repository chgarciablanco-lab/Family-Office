import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Plus, FileText, Image as ImageIcon, File as FileIcon, Trash2, X } from "lucide-react";
import BottomNav from "./BottomNav";
import ConfirmDialog from "./ConfirmDialog";
import { formatFechaCorta } from "../lib/format";
import {
  CATEGORIAS_DOCUMENTOS, fetchDocumentos, subirDocumento, obtenerUrlPreview, eliminarDocumento, formatTamano,
} from "../lib/documentos";
import { usePermisos } from "../context/PermisosContext";

function iconoDoc(contentType) {
  if (contentType?.startsWith("image/")) return ImageIcon;
  if (contentType === "application/pdf") return FileText;
  return FileIcon;
}

function PreviewModal({ doc, onClose }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let vigente = true;
    obtenerUrlPreview(doc.storage_path).then((u) => { if (vigente) setUrl(u); });
    return () => { vigente = false; };
  }, [doc]);

  const esImagen = doc.content_type?.startsWith("image/");
  const esPdf = doc.content_type === "application/pdf";

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100 shrink-0">
          <p className="text-sm font-bold text-slate-900 truncate pr-2">{doc.nombre}</p>
          <button onClick={onClose} aria-label="Cerrar" className="shrink-0">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="flex-1 overflow-auto bg-slate-50 flex items-center justify-center min-h-[200px]">
          {!url && <p className="text-sm text-slate-400 py-10">Cargando...</p>}
          {url && esImagen && (
            <img src={url} alt={doc.nombre} className="max-w-full max-h-[70vh] object-contain" />
          )}
          {url && esPdf && (
            <iframe src={url} title={doc.nombre} className="w-full h-[70vh] border-0" />
          )}
          {url && !esImagen && !esPdf && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-violet-600 font-semibold text-sm py-10"
            >
              Abrir documento →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoriaSection({ entidadTipo, entidadId, categoria, documentos, onChanged, editable }) {
  const inputRef = useRef(null);
  const [subiendo, setSubiendo] = useState(false);
  const [preview, setPreview] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const docsCategoria = documentos.filter((d) => d.categoria === categoria);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setSubiendo(true);
    await subirDocumento(entidadTipo, entidadId, categoria, file);
    setSubiendo(false);
    onChanged();
  };

  const handleDelete = async () => {
    const doc = confirmDelete;
    setConfirmDelete(null);
    await eliminarDocumento(doc);
    onChanged();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3.5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-900">{categoria}</p>
        {editable && (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={subiendo}
            aria-label={`Agregar documento a ${categoria}`}
            className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center disabled:opacity-50"
          >
            <Plus className="w-4 h-4 text-white" strokeWidth={2.4} />
          </button>
        )}
        <input ref={inputRef} type="file" className="hidden" onChange={handleFile} accept="image/*,application/pdf" />
      </div>

      {subiendo && <p className="text-xs text-slate-400 mt-2">Subiendo...</p>}

      {docsCategoria.length === 0 && !subiendo && (
        <p className="text-xs text-slate-400 mt-2">Sin documentos</p>
      )}

      {docsCategoria.length > 0 && (
        <div className="flex flex-col gap-2 mt-2.5">
          {docsCategoria.map((doc) => {
            const Icon = iconoDoc(doc.content_type);
            return (
              <div key={doc.id} className="flex items-center gap-2.5 bg-slate-50 rounded-xl px-2.5 py-2">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-slate-500" strokeWidth={1.8} />
                </div>
                <button onClick={() => setPreview(doc)} className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-semibold text-slate-900 truncate">{doc.nombre}</p>
                  <p className="text-[11px] text-slate-400">
                    {formatTamano(doc.tamano_bytes)} · {formatFechaCorta(doc.created_at.slice(0, 10))}
                  </p>
                </button>
                {editable && (
                  <button onClick={() => setConfirmDelete(doc)} aria-label="Eliminar documento" className="shrink-0">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {preview && <PreviewModal doc={preview} onClose={() => setPreview(null)} />}

      {confirmDelete && (
        <ConfirmDialog
          title={`¿Eliminar "${confirmDelete.nombre}"?`}
          message="Esta acción no se puede deshacer."
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

export default function DocumentosScreen({ entidadTipo, entidadId, entidadNombre, backTo, onNavigate }) {
  const { puedeEditar } = usePermisos();
  const editable = puedeEditar("documentos");
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargar = async () => {
    setLoading(true);
    const data = await fetchDocumentos(entidadTipo, entidadId);
    setDocumentos(data);
    setLoading(false);
  };

  useEffect(() => {
    cargar();
  }, [entidadTipo, entidadId]);

  const categorias = CATEGORIAS_DOCUMENTOS[entidadTipo] || [];

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
        <p className="text-sm text-slate-500 -mt-1">{entidadNombre}</p>

        {loading && <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>}

        {!loading && categorias.map((categoria) => (
          <CategoriaSection
            key={categoria}
            entidadTipo={entidadTipo}
            entidadId={entidadId}
            categoria={categoria}
            documentos={documentos}
            onChanged={cargar}
            editable={editable}
          />
        ))}
      </div>

      <div className="flex-1" />
      <BottomNav variant="detail" onNavigate={onNavigate} />
    </>
  );
}
