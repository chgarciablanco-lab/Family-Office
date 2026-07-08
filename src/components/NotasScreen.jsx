import React, { useEffect, useState } from "react";
import { ArrowLeft, Plus, StickyNote } from "lucide-react";
import BottomNav from "./BottomNav";
import NotaForm from "./NotaForm";
import { fetchNotas } from "../lib/notas";
import { colorClasses, formatFechaCorta } from "../lib/format";
import { usePermisos } from "../context/PermisosContext";

export default function NotasScreen({ backTo, onNavigate, onSelect }) {
  const { puedeEditar } = usePermisos();
  const editable = puedeEditar("notas");
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const cargar = async () => {
    setLoading(true);
    setNotas(await fetchNotas());
    setLoading(false);
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleSaved = () => {
    setShowForm(false);
    cargar();
  };

  return (
    <>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={() => onNavigate(backTo)} aria-label="Volver">
          <ArrowLeft className="w-6 h-6 text-blue-600" strokeWidth={2} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Notas</h1>
        {editable ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center"
            aria-label="Agregar nota"
          >
            <Plus className="w-5 h-5 text-white" strokeWidth={2.4} />
          </button>
        ) : (
          <div className="w-8" />
        )}
      </div>

      <div className="px-5 flex flex-col gap-3 pb-4">
        {loading && <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>}

        {!loading && notas.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 px-4 py-8 text-center">
            <p className="text-sm text-slate-500">Aún no hay notas.</p>
            {editable && <p className="text-xs text-slate-400 mt-1">Usa el botón + para agregar la primera.</p>}
          </div>
        )}

        {notas.map((n) => {
          const c = colorClasses[n.color] || colorClasses.amber;
          return (
            <button
              key={n.id}
              onClick={() => onSelect(n)}
              className={`w-full rounded-2xl border border-slate-100 shadow-sm px-4 py-4 text-left active:scale-[0.98] transition-transform ${c.bg}`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <StickyNote className={`w-4 h-4 ${c.fg} shrink-0`} strokeWidth={1.8} />
                <p className="font-bold text-slate-900 text-sm leading-tight flex-1 min-w-0 truncate">{n.titulo}</p>
              </div>
              {n.contenido && (
                <p className="text-sm text-slate-700 truncate">{n.contenido}</p>
              )}
              <p className="text-[11px] text-slate-500 mt-2">
                {n.profiles?.nombre ? `${n.profiles.nombre} · ` : ""}{formatFechaCorta(n.updated_at?.slice(0, 10))}
              </p>
            </button>
          );
        })}
      </div>

      <div className="flex-1" />
      <BottomNav onNavigate={onNavigate} />

      {showForm && (
        <NotaForm
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
