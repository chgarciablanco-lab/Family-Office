import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import BottomNav from "./BottomNav";
import PendienteRow from "./PendienteRow";
import { fetchPendientes } from "../lib/pendientes";

export default function NotificacionesScreen({ backTo, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [porVencer, setPorVencer] = useState([]);
  const [vencidos, setVencidos] = useState([]);

  const cargarPendientes = async () => {
    setLoading(true);
    const { porVencer, vencidos } = await fetchPendientes();
    setPorVencer(porVencer);
    setVencidos(vencidos);
    setLoading(false);
  };

  useEffect(() => {
    cargarPendientes();
  }, []);

  const sinPendientes = !loading && porVencer.length === 0 && vencidos.length === 0;

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

        {sinPendientes && (
          <div className="bg-white rounded-2xl border border-slate-100 px-4 py-8 text-center">
            <p className="text-sm text-slate-500">No tienes pendientes por ahora.</p>
          </div>
        )}

        {!loading && porVencer.length > 0 && (
          <>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">Por vencer ({porVencer.length})</p>
            <div className="flex flex-col gap-2.5">
              {porVencer.map((item, i) => (
                <div key={`manana-${i}`} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-3 py-3">
                  <PendienteRow item={item} onDone={cargarPendientes} />
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
                  <PendienteRow item={item} onDone={cargarPendientes} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex-1" />
      <BottomNav variant="detail" onNavigate={onNavigate} />
    </>
  );
}
