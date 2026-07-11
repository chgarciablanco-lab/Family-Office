import React, { useEffect, useState } from "react";
import { ArrowLeft, ChevronRight, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import BottomNav from "./BottomNav";
import ConfirmDialog from "./ConfirmDialog";
import PagoArriendoForm from "./PagoArriendoForm";
import { formatCLP, formatMes, estadoPillClasses } from "../lib/format";
import { usePermisos } from "../context/PermisosContext";

function diaDeVencimiento(vencimiento) {
  if (!vencimiento) return 5;
  return parseInt(vencimiento.slice(8, 10), 10) || 5;
}

function ultimoDiaMes(anio, mesNum) {
  return new Date(anio, mesNum, 0).getDate();
}

function generarPagosAnio(arriendoId, anio, monto, dia) {
  return Array.from({ length: 12 }, (_, i) => {
    const mesNum = i + 1;
    const mes = String(mesNum).padStart(2, "0");
    const diaMes = String(Math.min(dia, ultimoDiaMes(anio, mesNum))).padStart(2, "0");
    return {
      arriendo_id: arriendoId,
      periodo: `${anio}-${mes}-01`,
      monto: monto ?? null,
      estado: "Pendiente",
      vencimiento: `${anio}-${mes}-${diaMes}`,
    };
  });
}

export default function ArriendoDetailScreen({ arriendo, backTo, onNavigate }) {
  const { puedeEditar } = usePermisos();
  const editable = puedeEditar("arriendos");
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const fetchPagos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pagos_arriendo")
      .select("*")
      .eq("arriendo_id", arriendo.id)
      .order("periodo", { ascending: true });

    if (!error) {
      if ((data || []).length === 0) {
        const anio = new Date().getFullYear();
        const dia = diaDeVencimiento(arriendo.vencimiento);
        const filas = generarPagosAnio(arriendo.id, anio, arriendo.monto, dia);
        const { data: creados, error: insertError } = await supabase
          .from("pagos_arriendo")
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
  }, [arriendo.id]);

  const handleSaved = () => {
    setEditing(null);
    fetchPagos();
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from("pagos_arriendo").delete().eq("id", id);
    if (!error) setPagos((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={() => onNavigate(backTo)} aria-label="Volver">
          <ArrowLeft className="w-6 h-6 text-blue-600" strokeWidth={2} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">{arriendo.nombre}</h1>
        <div className="w-6" />
      </div>

      <div className="px-5 flex flex-col gap-3 pb-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4">
          <p className="font-bold text-slate-900 text-base">{arriendo.nombre}</p>
          <p className="text-sm text-slate-500 mt-0.5">{arriendo.tipo} · {arriendo.ubicacion}</p>
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
                      <p className="font-bold text-slate-900 text-sm capitalize">{formatMes(p.periodo)}</p>
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
      <BottomNav variant={arriendo.owner_user_id ? "personal" : "detail"} onNavigate={onNavigate} />

      {editing && (
        <PagoArriendoForm
          pago={editing}
          arriendo={arriendo}
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
