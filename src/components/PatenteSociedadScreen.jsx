import React, { useEffect, useState } from "react";
import { ArrowLeft, ChevronRight, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import BottomNav from "./BottomNav";
import ConfirmDialog from "./ConfirmDialog";
import PatenteSociedadPagoForm from "./PatenteSociedadPagoForm";
import { formatCLP, estadoPillClasses } from "../lib/format";
import { periodoLabelAuto } from "../lib/autoTramites";
import { usePermisos } from "../context/PermisosContext";

function generarPeriodosPatente(sociedadId, anio) {
  return [
    { sociedad_id: sociedadId, periodo: `${anio}-01-01`, monto: null, estado: "Pendiente", vencimiento: null },
    { sociedad_id: sociedadId, periodo: `${anio}-07-01`, monto: null, estado: "Pendiente", vencimiento: null },
  ];
}

export default function PatenteSociedadScreen({ sociedad, backTo, onNavigate }) {
  const { puedeEditar } = usePermisos();
  const editable = puedeEditar("sociedades");
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const fetchPagos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("patentes_sociedad")
      .select("*")
      .eq("sociedad_id", sociedad.id)
      .order("periodo", { ascending: true });

    if (!error) {
      if ((data || []).length === 0) {
        const anio = new Date().getFullYear();
        const filas = generarPeriodosPatente(sociedad.id, anio);
        const { data: creados, error: insertError } = await supabase
          .from("patentes_sociedad")
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
  }, [sociedad.id]);

  const handleSaved = () => {
    setEditing(null);
    fetchPagos();
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from("patentes_sociedad").delete().eq("id", id);
    if (!error) setPagos((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={() => onNavigate(backTo)} aria-label="Volver">
          <ArrowLeft className="w-6 h-6 text-blue-600" strokeWidth={2} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Patente</h1>
        <div className="w-6" />
      </div>

      <div className="px-5 flex flex-col gap-3 pb-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4">
          <p className="font-bold text-slate-900 text-base">{sociedad.nombre}</p>
          <p className="text-sm text-slate-500 mt-0.5">Patente municipal · 2 pagos al año (semestral)</p>
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
                      <p className="font-bold text-slate-900 text-sm capitalize">{periodoLabelAuto("permiso", p.periodo)}</p>
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
      <BottomNav variant={sociedad.owner_user_id ? "personal" : "detail"} onNavigate={onNavigate} />

      {editing && (
        <PatenteSociedadPagoForm
          pago={editing}
          titulo={`${sociedad.nombre} · ${periodoLabelAuto("permiso", editing.periodo)}`}
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
