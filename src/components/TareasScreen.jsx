import React, { useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash2, ClipboardList } from "lucide-react";
import BottomNav from "./BottomNav";
import ConfirmDialog from "./ConfirmDialog";
import AsignarTareaForm from "./AsignarTareaForm";
import { fetchTareasAsignadas, eliminarTarea } from "../lib/tareas";
import { formatFechaCorta } from "../lib/format";

export default function TareasScreen({ backTo, onNavigate }) {
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const cargar = async () => {
    setLoading(true);
    setTareas(await fetchTareasAsignadas());
    setLoading(false);
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleDelete = async () => {
    const id = confirmDelete;
    setConfirmDelete(null);
    await eliminarTarea(id);
    cargar();
  };

  return (
    <>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={() => onNavigate(backTo)} aria-label="Volver">
          <ArrowLeft className="w-6 h-6 text-blue-600" strokeWidth={2} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Tareas asignadas</h1>
        <button
          onClick={() => setShowForm(true)}
          className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center"
          aria-label="Asignar tarea"
        >
          <Plus className="w-4.5 h-4.5 text-white" strokeWidth={2.4} />
        </button>
      </div>

      <div className="px-5 flex flex-col gap-2.5 pb-4">
        {loading && <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>}

        {!loading && tareas.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 px-4 py-8 text-center">
            <p className="text-sm text-slate-500">Aún no has asignado tareas.</p>
            <p className="text-xs text-slate-400 mt-1">Presiona el + para asignarle una a alguien.</p>
          </div>
        )}

        {!loading && tareas.map((t) => (
          <div key={t.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-3 py-3 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
              <ClipboardList className="w-4 h-4 text-violet-600" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-slate-900 truncate">{t.titulo}</p>
              <p className="text-[11.5px] text-slate-500 mt-0.5 truncate">
                {t.usuarios_asignables?.nombre ?? "Sin asignar"} · {formatFechaCorta(t.fecha)}{t.hora ? ` · ${t.hora.slice(0, 5)}` : ""}
              </p>
              {t.descripcion && (
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">{t.descripcion}</p>
              )}
            </div>
            <button onClick={() => setConfirmDelete(t.id)} aria-label="Eliminar tarea" className="shrink-0">
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex-1" />
      <BottomNav onNavigate={onNavigate} />

      {showForm && (
        <AsignarTareaForm
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); cargar(); }}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="¿Eliminar esta tarea asignada?"
          message="Esta acción no se puede deshacer."
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </>
  );
}
