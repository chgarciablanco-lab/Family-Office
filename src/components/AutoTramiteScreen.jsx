import React, { useEffect, useState } from "react";
import { ArrowLeft, ChevronRight, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import BottomNav from "./BottomNav";
import ConfirmDialog from "./ConfirmDialog";
import AutoPagoForm from "./AutoPagoForm";
import { formatCLP, estadoPillClasses } from "../lib/format";
import { TIPOS_AUTO, periodoLabelAuto, generarPeriodosAuto } from "../lib/autoTramites";
import { usePermisos } from "../context/PermisosContext";

export default function AutoTramiteScreen({ auto, tipo, backTo, onNavigate }) {
  const { puedeEditar } = usePermisos();
  const editable = puedeEditar("autos");
  const config = TIPOS_AUTO.find((t) => t.key === tipo);
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const fetchPagos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pagos_auto")
      .select("*")
      .eq("auto_id", auto.id)
      .eq("tipo", tipo)
      .order("periodo", { ascending: true });

    if (!error) {
      if ((data || []).length === 0) {
        const anio = new Date().getFullYear();
        const filas = generarPeriodosAuto(tipo, auto.id, anio);
        const { data: creados, error: insertError } = await supabase
          .from("pagos_auto")
          .insert(filas)
          .select("*");
        setPagos(insertError ? [] : creados || []);
      } else {
        setPagos(data);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPagos();
  }, [auto.id, tipo]);

  const handleSaved = () => {
    setEditing(null);
    fetchPagos();
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from("pagos_auto").delete().eq("id", id);
    if (!error) setPagos((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={() => onNavigate(backTo)} aria-label="Volver">
          <ArrowLeft className="w-6 h-6 text-blue-600" strokeWidth={2} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">{config.titulo}</h1>
        <div className="w-6" />
      </div>

      <div className="px-5 flex flex-col gap-3 pb-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4">
          <p className="font-bold text-slate-900 text-base">{auto.marca} {auto.modelo}</p>
          <p className="text-sm text-slate-500 mt-0.5">{auto.patente} · {config.titulo}</p>
        </div>

        {loading && <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>}

        {!loading &&
          pagos.map((p) => {
            const pill = estadoPillClasses(p.estado);
            return (
              <div
                key={p.id}
                className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3.5 flex items-center gap-3"
              >
                <button
                  onClick={() => editable && setEditing(p)}
                  disabled={!editable}
                  className="flex-1 flex items-center justify-between gap-3 text-left min-w-0"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-slate-900 text-sm capitalize">{periodoLabelAuto(tipo, p.periodo)}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pill.bg} ${pill.text}`}>
                        {p.estado}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Monto: {formatCLP(p.monto)}</p>
                  </div>
                  {editable && <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />}
                </button>
                {editable && (
                  <button
                    onClick={() => setConfirmDeleteId(p.id)}
                    aria-label="Eliminar este registro"
                    className="shrink-0"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                )}
              </div>
            );
          })}
      </div>

      <div className="flex-1" />
      <BottomNav variant="detail" onNavigate={onNavigate} />

      {editing && (
        <AutoPagoForm
          pago={editing}
          titulo={`${auto.patente} · ${periodoLabelAuto(tipo, editing.periodo)}`}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}

      {confirmDeleteId && (
        <ConfirmDialog
          title="¿Eliminar este registro?"
          message="Esta acción no se puede deshacer."
          onConfirm={() => {
            const id = confirmDeleteId;
            setConfirmDeleteId(null);
            handleDelete(id);
          }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </>
  );
}
