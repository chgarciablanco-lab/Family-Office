import React, { useState } from "react";
import { ArrowLeft, MoreHorizontal, StickyNote } from "lucide-react";
import BottomNav from "./BottomNav";
import NotaForm from "./NotaForm";
import { fetchNota } from "../lib/notas";
import { colorClasses, formatFechaCorta } from "../lib/format";
import { usePermisos } from "../context/PermisosContext";

export default function NotaDetailScreen({ nota, backTo, onNavigate }) {
  const { puedeEditar } = usePermisos();
  const editable = puedeEditar("notas");
  const [notaActual, setNotaActual] = useState(nota);
  const [showForm, setShowForm] = useState(false);
  const c = colorClasses[notaActual.color] || colorClasses.amber;

  const handleSaved = async () => {
    setShowForm(false);
    const actualizada = await fetchNota(notaActual.id);
    if (actualizada) setNotaActual(actualizada);
  };

  const handleDeleted = () => {
    setShowForm(false);
    onNavigate(backTo);
  };

  return (
    <>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={() => onNavigate(backTo)} aria-label="Volver">
          <ArrowLeft className="w-6 h-6 text-blue-600" strokeWidth={2} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Nota</h1>
        {editable ? (
          <button onClick={() => setShowForm(true)} aria-label="Editar nota">
            <MoreHorizontal className="w-6 h-6 text-blue-600" strokeWidth={2.2} />
          </button>
        ) : (
          <div className="w-6" />
        )}
      </div>

      <div className="px-5 flex flex-col gap-3 pb-4">
        <div className={`w-full rounded-2xl border border-slate-100 shadow-sm px-4 py-4 ${c.bg}`}>
          <div className="flex items-center gap-2 mb-2">
            <StickyNote className={`w-5 h-5 ${c.fg} shrink-0`} strokeWidth={1.8} />
            <p className="font-bold text-slate-900 text-lg leading-tight flex-1 min-w-0">{notaActual.titulo}</p>
          </div>
          {notaActual.contenido && (
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{notaActual.contenido}</p>
          )}
          <p className="text-[11px] text-slate-500 mt-3">
            {notaActual.profiles?.nombre ? `${notaActual.profiles.nombre} · ` : ""}{formatFechaCorta(notaActual.updated_at?.slice(0, 10))}
          </p>
        </div>
      </div>

      <div className="flex-1" />
      <BottomNav onNavigate={onNavigate} />

      {showForm && (
        <NotaForm
          nota={notaActual}
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </>
  );
}
