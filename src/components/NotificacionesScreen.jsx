import React, { useEffect, useState } from "react";
import { ArrowLeft, Clock, Trash2 } from "lucide-react";
import BottomNav from "./BottomNav";
import ConfirmDialog from "./ConfirmDialog";
import PendienteRow from "./PendienteRow";
import { fetchPendientes } from "../lib/pendientes";
import { fetchEventosProximos, eliminarEvento } from "../lib/calendario";
import { formatFechaCorta } from "../lib/format";
import { usePermisos } from "../context/PermisosContext";

export default function NotificacionesScreen({ backTo, onNavigate }) {
  const { puedeEditar } = usePermisos();
  const editableCalendario = puedeEditar("calendario_tareas");
  const [loading, setLoading] = useState(true);
  const [porVencer, setPorVencer] = useState([]);
  const [vencidos, setVencidos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [confirmDeleteEvento, setConfirmDeleteEvento] = useState(null);

  const cargar = async () => {
    setLoading(true);
    const [{ porVencer, vencidos }, eventosProximos] = await Promise.all([
      fetchPendientes(),
      fetchEventosProximos(),
    ]);
    setPorVencer(porVencer);
    setVencidos(vencidos);
    setEventos(eventosProximos);
    setLoading(false);
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleDeleteEvento = async () => {
    const id = confirmDeleteEvento;
    setConfirmDeleteEvento(null);
    await eliminarEvento(id);
    cargar();
  };

  const sinNada = !loading && porVencer.length === 0 && vencidos.length === 0 && eventos.length === 0;

  return (
    <>
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => onNavigate(backTo)} aria-label="Volver">
          <ArrowLeft className="w-6 h-6 text-blue-600" strokeWidth={2} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Notificaciones</h1>
      </div>

      <div className="px-5 flex flex-col gap-3 pb-4">
        {loading && <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>}

        {sinNada && (
          <div className="bg-white rounded-2xl border border-slate-100 px-4 py-8 text-center">
            <p className="text-sm text-slate-500">No tienes pendientes por ahora.</p>
          </div>
        )}

        {!loading && eventos.length > 0 && (
          <>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">
              Tareas y reuniones ({eventos.length})
            </p>
            <div className="flex flex-col gap-2.5">
              {eventos.map((ev) => (
                <div key={ev.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-3 py-3 flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-violet-600" strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-slate-900 truncate">{ev.titulo}</p>
                    <p className="text-[11.5px] text-slate-500 mt-0.5 truncate">
                      {formatFechaCorta(ev.fecha)}{ev.hora ? ` · ${ev.hora.slice(0, 5)}` : ""}{ev.descripcion ? ` · ${ev.descripcion}` : ""}
                    </p>
                  </div>
                  {editableCalendario && (
                    <button onClick={() => setConfirmDeleteEvento(ev.id)} aria-label="Eliminar tarea" className="shrink-0">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {!loading && porVencer.length > 0 && (
          <>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-3">Por vencer ({porVencer.length})</p>
            <div className="flex flex-col gap-2.5">
              {porVencer.map((item, i) => (
                <div key={`manana-${i}`} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-3 py-3">
                  <PendienteRow item={item} onDone={cargar} />
                </div>
              ))}
            </div>
          </>
        )}

        {!loading && vencidos.length > 0 && (
          <>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-3">Vencidos ({vencidos.length})</p>
            <div className="flex flex-col gap-2.5">
              {vencidos.map((item, i) => (
                <div key={`vencido-${i}`} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-3 py-3">
                  <PendienteRow item={item} onDone={cargar} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex-1" />
      <BottomNav variant="detail" onNavigate={onNavigate} />

      {confirmDeleteEvento && (
        <ConfirmDialog
          title="¿Eliminar esta tarea?"
          message="Esta acción no se puede deshacer."
          onConfirm={handleDeleteEvento}
          onCancel={() => setConfirmDeleteEvento(null)}
        />
      )}
    </>
  );
}
