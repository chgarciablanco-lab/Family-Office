import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Trash2, X, FolderPlus, Upload, Pencil, Check, Folder, ChevronRight, Move } from "lucide-react";
import BottomNav from "./BottomNav";
import ConfirmDialog from "./ConfirmDialog";
import NuevaCarpetaForm from "./NuevaCarpetaForm";
import SeleccionarCarpetaModal from "./SeleccionarCarpetaModal";
import DocumentoPreviewModal, { iconoDoc } from "./DocumentoPreviewModal";
import { formatFechaCorta } from "../lib/format";
import {
  fetchCarpetas, fetchDocumentos, subirDocumento, eliminarDocumento, formatTamano,
  renombrarCarpeta, eliminarCarpeta, fetchDescendientesCarpeta, moverCarpeta, moverDocumento,
} from "../lib/documentos";
import { usePermisos } from "../context/PermisosContext";

function CarpetaRow({ carpeta, editable, onOpen, onCambiada, onMover }) {
  const [renombrando, setRenombrando] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState(carpeta.nombre);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  const handleRenombrar = async (e) => {
    e.preventDefault();
    const nombre = nuevoNombre.trim();
    setRenombrando(false);
    if (!nombre || nombre === carpeta.nombre) return;
    await renombrarCarpeta(carpeta.id, nombre);
    onCambiada();
  };

  const handleDelete = async () => {
    setConfirmDelete(false);
    const { error } = await eliminarCarpeta(carpeta.id);
    if (error) {
      setError(error.message);
      return;
    }
    onCambiada();
  };

  if (renombrando) {
    return (
      <form
        onSubmit={handleRenombrar}
        className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3 flex items-center gap-2"
      >
        <input
          autoFocus
          value={nuevoNombre}
          onChange={(e) => setNuevoNombre(e.target.value)}
          className="flex-1 h-9 border border-slate-200 rounded-lg px-2.5 text-sm text-slate-900 outline-none focus:border-violet-400"
        />
        <button type="submit" aria-label="Guardar nombre" className="shrink-0">
          <Check className="w-4 h-4 text-emerald-600" strokeWidth={2.4} />
        </button>
        <button
          type="button"
          onClick={() => { setNuevoNombre(carpeta.nombre); setRenombrando(false); }}
          aria-label="Cancelar"
          className="shrink-0"
        >
          <X className="w-4 h-4 text-slate-400" strokeWidth={2.4} />
        </button>
      </form>
    );
  }

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3.5">
      <div className="flex items-center gap-2">
        <button onClick={onOpen} className="flex-1 min-w-0 flex items-center gap-3.5 text-left active:scale-[0.98] transition-transform">
          <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
            <Folder className="w-5 h-5 text-violet-600" strokeWidth={1.8} />
          </div>
          <p className="flex-1 min-w-0 text-sm font-bold text-slate-900 truncate">{carpeta.nombre}</p>
          <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
        </button>
        {editable && (
          <button onClick={() => setRenombrando(true)} aria-label={`Renombrar ${carpeta.nombre}`} className="shrink-0">
            <Pencil className="w-4 h-4 text-slate-400" strokeWidth={1.8} />
          </button>
        )}
        {editable && (
          <button onClick={() => onMover(carpeta)} aria-label={`Mover ${carpeta.nombre}`} className="shrink-0">
            <Move className="w-4 h-4 text-slate-400" strokeWidth={1.8} />
          </button>
        )}
        {editable && (
          <button onClick={() => setConfirmDelete(true)} aria-label={`Eliminar ${carpeta.nombre}`} className="shrink-0">
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

      {confirmDelete && (
        <ConfirmDialog
          title={`¿Eliminar la carpeta "${carpeta.nombre}"?`}
          message="Solo se puede borrar si está vacía (sin subcarpetas ni documentos adentro)."
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}

export default function DocumentosScreen({ entidadTipo, entidadId, entidadNombre, backTo, onNavigate }) {
  const { puedeEditar } = usePermisos();
  const editable = puedeEditar("documentos");
  const inputRef = useRef(null);

  const [path, setPath] = useState([]); // [{ id, nombre }]
  const [carpetas, setCarpetas] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [subiendoProgreso, setSubiendoProgreso] = useState(null);
  const [showNuevaCarpeta, setShowNuevaCarpeta] = useState(false);
  const [preview, setPreview] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [moviendo, setMoviendo] = useState(null); // { tipo: "carpeta" | "documento", item, excluir }

  const carpetaActual = path[path.length - 1] || null;

  const cargar = async () => {
    setLoading(true);
    const [cs, docs] = await Promise.all([
      fetchCarpetas(entidadTipo, entidadId, carpetaActual?.id),
      fetchDocumentos(entidadTipo, entidadId, carpetaActual?.id),
    ]);
    setCarpetas(cs);
    setDocumentos(docs);
    setLoading(false);
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entidadTipo, entidadId, carpetaActual?.id]);

  const handleFile = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;
    setSubiendo(true);
    for (let i = 0; i < files.length; i++) {
      setSubiendoProgreso({ actual: i + 1, total: files.length });
      await subirDocumento(entidadTipo, entidadId, carpetaActual?.id, files[i]);
    }
    setSubiendo(false);
    setSubiendoProgreso(null);
    cargar();
  };

  const handleDeleteDoc = async () => {
    const doc = confirmDelete;
    setConfirmDelete(null);
    await eliminarDocumento(doc);
    cargar();
  };

  const handleAbrirMoverCarpeta = async (carpeta) => {
    const excluir = await fetchDescendientesCarpeta(carpeta.id);
    setMoviendo({ tipo: "carpeta", item: carpeta, excluir });
  };

  const handleAbrirMoverDoc = (doc) => {
    setMoviendo({ tipo: "documento", item: doc, excluir: null });
  };

  const handleMoverConfirmado = async (destinoId) => {
    if (!moviendo) return;
    if (moviendo.tipo === "carpeta") await moverCarpeta(moviendo.item.id, destinoId);
    else await moverDocumento(moviendo.item.id, destinoId);
    setMoviendo(null);
    cargar();
  };

  const irAtras = () => {
    if (path.length > 0) setPath((p) => p.slice(0, -1));
    else onNavigate(backTo);
  };

  const titulo = carpetaActual?.nombre || "Documentos";

  return (
    <>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={irAtras} aria-label="Volver">
          <ArrowLeft className="w-6 h-6 text-blue-600" strokeWidth={2} />
        </button>
        <h1 className="text-xl font-bold text-slate-900 truncate px-2">{titulo}</h1>
        <div className="w-6" />
      </div>

      <div className="px-5 flex flex-col gap-3 pb-4">
        <p className="text-sm text-slate-500 -mt-1 truncate">
          {carpetaActual ? `${entidadNombre} · ${path.map((p) => p.nombre).join(" / ")}` : entidadNombre}
        </p>

        {editable && (
          <div className="flex gap-2.5">
            <button
              onClick={() => setShowNuevaCarpeta(true)}
              className="flex-1 border-2 border-dashed border-slate-200 rounded-2xl px-3 py-3 flex items-center justify-center gap-2"
            >
              <FolderPlus className="w-4 h-4 text-violet-600" strokeWidth={1.8} />
              <span className="text-sm font-semibold text-slate-700">Nueva carpeta</span>
            </button>
            <button
              onClick={() => inputRef.current?.click()}
              disabled={subiendo}
              className="flex-1 border-2 border-dashed border-slate-200 rounded-2xl px-3 py-3 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Upload className="w-4 h-4 text-violet-600" strokeWidth={1.8} />
              <span className="text-sm font-semibold text-slate-700">
                {subiendo
                  ? `Subiendo ${subiendoProgreso ? `${subiendoProgreso.actual}/${subiendoProgreso.total}` : "..."}`
                  : "Subir archivos"}
              </span>
            </button>
            <input ref={inputRef} type="file" multiple className="hidden" onChange={handleFile} accept="image/*,application/pdf" />
          </div>
        )}

        {loading && <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>}

        {!loading && carpetas.map((c) => (
          <CarpetaRow
            key={c.id}
            carpeta={c}
            editable={editable}
            onOpen={() => setPath((p) => [...p, { id: c.id, nombre: c.nombre }])}
            onCambiada={cargar}
            onMover={handleAbrirMoverCarpeta}
          />
        ))}

        {!loading && documentos.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3.5">
            <div className="flex flex-col gap-2">
              {documentos.map((doc) => {
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
                      <button onClick={() => handleAbrirMoverDoc(doc)} aria-label="Mover documento" className="shrink-0">
                        <Move className="w-4 h-4 text-slate-400" strokeWidth={1.8} />
                      </button>
                    )}
                    {editable && (
                      <button onClick={() => setConfirmDelete(doc)} aria-label="Eliminar documento" className="shrink-0">
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!loading && carpetas.length === 0 && documentos.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 px-4 py-8 text-center">
            <p className="text-sm text-slate-500">Esta carpeta está vacía.</p>
          </div>
        )}
      </div>

      <div className="flex-1" />
      <BottomNav variant="detail" onNavigate={onNavigate} />

      {showNuevaCarpeta && (
        <NuevaCarpetaForm
          entidadTipo={entidadTipo}
          entidadId={entidadId}
          carpetaPadreId={carpetaActual?.id}
          onClose={() => setShowNuevaCarpeta(false)}
          onSaved={() => { setShowNuevaCarpeta(false); cargar(); }}
        />
      )}

      {preview && <DocumentoPreviewModal doc={preview} onClose={() => setPreview(null)} />}

      {confirmDelete && (
        <ConfirmDialog
          title={`¿Eliminar "${confirmDelete.nombre}"?`}
          message="Esta acción no se puede deshacer."
          onConfirm={handleDeleteDoc}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {moviendo && (
        <SeleccionarCarpetaModal
          entidadTipo={entidadTipo}
          entidadId={entidadId}
          entidadNombre={entidadNombre}
          excluir={moviendo.excluir}
          onSeleccionar={handleMoverConfirmado}
          onClose={() => setMoviendo(null)}
        />
      )}
    </>
  );
}
