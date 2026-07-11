import React, { useEffect, useState } from "react";
import { ArrowLeft, ChevronRight, Trash2, Folder } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import BottomNav from "./BottomNav";
import ConfirmDialog from "./ConfirmDialog";
import PagoTrabajadorForm from "./PagoTrabajadorForm";
import { formatCLP, formatMes, estadoPillClasses } from "../lib/format";
import { usePermisos } from "../context/PermisosContext";

function generarPagosAnio(trabajadorId, anio, liquidacion, previred) {
  return Array.from({ length: 12 }, (_, i) => {
    const mes = String(i + 1).padStart(2, "0");
    return {
      trabajador_id: trabajadorId,
      periodo: `${anio}-${mes}-01`,
      liquidacion: liquidacion ?? null,
      previred: previred ?? null,
      estado: "Pendiente",
    };
  });
}

export default function TrabajadorDetailScreen({ trabajador, backTo, onNavigate, onOpenDocumentos }) {
  const { puedeEditar } = usePermisos();
  const editable = puedeEditar("trabajadores");
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const fetchPagos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pagos_trabajador")
      .select("*")
      .eq("trabajador_id", trabajador.id)
      .order("periodo", { ascending: true });

    if (!error) {
      if ((data || []).length === 0) {
        const anio = new Date().getFullYear();
        const filas = generarPagosAnio(trabajador.id, anio, trabajador.liquidacion, trabajador.previred);
        const { data: creados, error: insertError } = await supabase
          .from("pagos_trabajador")
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
  }, [trabajador.id]);

  const handleSaved = () => {
    setEditing(null);
    fetchPagos();
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from("pagos_trabajador").delete().eq("id", id);
    if (!error) setPagos((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={() => onNavigate(backTo)} aria-label="Volver">
          <ArrowLeft className="w-6 h-6 text-blue-600" strokeWidth={2} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">{trabajador.nombre}</h1>
        <div className="w-6" />
      </div>

      <div className="px-5 flex flex-col gap-3 pb-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4">
          <p className="font-bold text-slate-900 text-base">{trabajador.nombre}</p>
          <p className="text-sm text-slate-500 mt-0.5">{trabajador.cargo}</p>
        </div>

        <button
          onClick={() => onOpenDocumentos(trabajador)}
          className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3.5 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            <Folder className="w-5 h-5 text-slate-500" strokeWidth={1.8} />
          </div>
          <p className="flex-1 font-bold text-slate-900 text-sm">Documentos</p>
          <ChevronRight className="w-5 h-5 text-slate-300" />
        </button>

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
                      <p className="font-bold text-slate-900 text-sm capitalize">{formatMes(p.periodo)}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pill.bg} ${pill.text}`}>
                        {p.estado}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Liquidación: {formatCLP(p.liquidacion)} · Previred: {formatCLP(p.previred)}
                    </p>
                  </div>
                  {editable && <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />}
                </button>
                {editable && (
                  <button
                    onClick={() => setConfirmDeleteId(p.id)}
                    aria-label="Eliminar este mes"
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
      <BottomNav variant={trabajador.owner_user_id ? "personal" : "detail"} onNavigate={onNavigate} />

      {editing && (
        <PagoTrabajadorForm
          pago={editing}
          trabajador={trabajador}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}

      {confirmDeleteId && (
        <ConfirmDialog
          title="¿Eliminar este mes?"
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
