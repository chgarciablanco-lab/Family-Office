import React, { useEffect, useState } from "react";
import { ArrowLeft, Plus, FileText, ChevronRight } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import ImpuestoForm from "./ImpuestoForm";
import BottomNav from "./BottomNav";
import { formatCLP, formatMes, formatFechaCorta, estadoPillClasses } from "../lib/format";

function generarImpuestosAnio(sociedadId, anio) {
  return Array.from({ length: 12 }, (_, i) => {
    const mes = String(i + 1).padStart(2, "0");
    return {
      sociedad_id: sociedadId,
      periodo: `${anio}-${mes}-01`,
      estado: "Pendiente",
    };
  });
}

export default function ImpuestosScreen({ sociedadId = null, entidadNombre = "Gestión personal", backTo, onNavigate }) {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchRegistros = async () => {
    setLoading(true);
    let query = supabase.from("impuestos").select("*").order("periodo", { ascending: true });
    query = sociedadId ? query.eq("sociedad_id", sociedadId) : query.is("sociedad_id", null);
    const { data, error } = await query;

    if (!error) {
      if ((data || []).length === 0) {
        const anio = new Date().getFullYear();
        const filas = generarImpuestosAnio(sociedadId, anio);
        const { data: creados, error: insertError } = await supabase
          .from("impuestos")
          .insert(filas)
          .select("*");
        setRegistros(insertError ? [] : creados || []);
      } else {
        setRegistros(data);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRegistros();
  }, [sociedadId]);

  const handleSaved = () => {
    setShowForm(false);
    setEditing(null);
    fetchRegistros();
  };

  const mesActual = new Date().toISOString().slice(0, 7);
  const anioActual = new Date().getFullYear().toString();
  const registrosVisibles = registros.filter((r) => !r.periodo || r.periodo.slice(0, 7) <= mesActual);
  const actual =
    registrosVisibles.find((r) => (r.periodo || "").slice(0, 7) === mesActual) || registrosVisibles[0];
  const historial = registrosVisibles.filter((r) => r !== actual).slice().reverse();

  const totalPagadoAnio = registros
    .filter((r) => (r.periodo || "").slice(0, 4) === anioActual && r.estado === "Pagado")
    .reduce((sum, r) => sum + (Number(r.total_iva) || 0), 0);

  const renderTarjeta = (r, destacado) => {
    const p = estadoPillClasses(r.estado);
    return (
      <button
        key={r.id}
        onClick={() => { setEditing(r); setShowForm(true); }}
        className={`w-full bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 text-left ${
          destacado ? "px-4 py-4 gap-4" : "px-4 py-3.5"
        }`}
      >
        {destacado && (
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-violet-100">
            <FileText className="w-6 h-6 text-violet-600" strokeWidth={1.8} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-bold text-slate-900 ${destacado ? "text-base" : "text-sm"} leading-tight`}>
              {formatCLP(r.total_iva)}
            </p>
            {destacado && (
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${p.bg} ${p.text}`}>{r.estado}</span>
            )}
          </div>
          {destacado ? (
            <>
              <p className="text-sm text-slate-500 mt-0.5">{formatMes(r.periodo)}</p>
              <p className="text-sm text-slate-500 mt-1">Vence: {formatFechaCorta(r.vencimiento)}</p>
            </>
          ) : (
            <p className="text-xs text-slate-500">{formatMes(r.periodo)} · Vence: {formatFechaCorta(r.vencimiento)}</p>
          )}
        </div>
        {!destacado && (
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${p.bg} ${p.text}`}>{r.estado}</span>
        )}
        <ChevronRight className={`text-slate-300 shrink-0 ${destacado ? "w-5 h-5" : "w-4 h-4"}`} />
      </button>
    );
  };

  return (
    <>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={() => onNavigate(backTo)} aria-label="Volver">
          <ArrowLeft className="w-6 h-6 text-blue-600" strokeWidth={2} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Impuestos</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center"
          aria-label="Agregar F29"
        >
          <Plus className="w-5 h-5 text-white" strokeWidth={2.4} />
        </button>
      </div>

      <div className="px-5 flex flex-col gap-3 pb-4">
        <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-violet-100">
            <FileText className="w-6 h-6 text-violet-600" strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 text-base leading-tight">{entidadNombre}</p>
            <p className="text-sm text-slate-500 mt-0.5">Formulario 29 · IVA</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-slate-400">Pagado {anioActual}</p>
            <p className="text-sm font-bold text-slate-900">{formatCLP(totalPagadoAnio)}</p>
          </div>
        </div>

        {loading && <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>}

        {!loading && !actual && (
          <div className="bg-white rounded-2xl border border-slate-100 px-4 py-8 text-center">
            <p className="text-sm text-slate-500">Aún no hay registros de impuestos para {entidadNombre}.</p>
          </div>
        )}

        {actual && (
          <>
            <p className="font-bold text-slate-900 text-base mt-1">Mes en curso</p>
            {renderTarjeta(actual, true)}
          </>
        )}

        {historial.length > 0 && (
          <>
            <p className="font-bold text-slate-900 text-base mt-1">Historial</p>
            {historial.map((r) => renderTarjeta(r, false))}
          </>
        )}
      </div>

      <div className="flex-1" />
      <BottomNav variant="detail" onNavigate={onNavigate} />

      {showForm && (
        <ImpuestoForm
          registro={editing}
          sociedadId={sociedadId}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
