import React, { useEffect, useState } from "react";
import {
  ArrowLeft, Plus, FileText, Calendar, CalendarCheck, Banknote,
  TrendingUp, ChevronRight,
} from "lucide-react";
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

export default function ImpuestosScreen({ sociedad, backTo, onNavigate }) {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchRegistros = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("impuestos")
      .select("*")
      .eq("sociedad_id", sociedad.id)
      .order("periodo", { ascending: true });

    if (!error) {
      if ((data || []).length === 0) {
        const anio = new Date().getFullYear();
        const filas = generarImpuestosAnio(sociedad.id, anio);
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
  }, [sociedad.id]);

  const handleSaved = () => {
    setShowForm(false);
    setEditing(null);
    fetchRegistros();
  };

  const mesActual = new Date().toISOString().slice(0, 7);
  const registrosVisibles = registros.filter((r) => !r.periodo || r.periodo.slice(0, 7) <= mesActual);
  const actual =
    registrosVisibles.find((r) => (r.periodo || "").slice(0, 7) === mesActual) || registrosVisibles[0];
  const historial = registrosVisibles.filter((r) => r !== actual).slice().reverse();
  const p = actual ? estadoPillClasses(actual.estado === "Pagado" ? "Pagado" : "Por vencer") : null;

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
        {loading && <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>}

        {!loading && !actual && (
          <div className="bg-white rounded-2xl border border-slate-100 px-4 py-8 text-center">
            <p className="text-sm text-slate-500">Aún no hay registros de impuestos para {sociedad.nombre}.</p>
          </div>
        )}

        {actual && (
          <button
            onClick={() => { setEditing(actual); setShowForm(true); }}
            className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 text-left"
          >
            <p className="font-bold text-slate-900 text-base mb-3">Resumen IVA</p>

            <div className="bg-violet-50 rounded-2xl p-4 flex flex-col gap-4">
              <div>
                <p className="text-sm text-slate-500">Total IVA a pagar</p>
                <p className="text-3xl font-bold text-slate-900 mt-0.5">{formatCLP(actual.total_iva)}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-violet-600" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm leading-tight">Formulario 29</p>
                  <p className="text-xs text-slate-500 mt-0.5">Declaración Mensual y Pago Simultáneo</p>
                </div>
              </div>

              <div className="border-t border-violet-100 pt-3 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4.5 h-4.5 text-slate-400 shrink-0" strokeWidth={1.8} />
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">Período</p>
                    <p className="text-sm font-bold text-slate-900">{formatMes(actual.periodo)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 border-t border-violet-100 pt-3">
                  <CalendarCheck className="w-4.5 h-4.5 text-slate-400 shrink-0" strokeWidth={1.8} />
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">Fecha de vencimiento</p>
                    <p className="text-sm font-bold text-red-500">{formatFechaCorta(actual.vencimiento)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 border-t border-violet-100 pt-3">
                  <p className="flex-1 text-xs text-slate-500">Estado</p>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${p.bg} ${p.text}`}>
                    {actual.estado}
                  </span>
                </div>
              </div>
            </div>
          </button>
        )}

        {actual && (
          <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                <Banknote className="w-5 h-5 text-violet-600" strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500">Último pago</p>
                <p className="text-sm font-bold text-slate-900">{formatCLP(actual.ultimo_pago)}</p>
                <p className="text-xs text-slate-400">{formatFechaCorta(actual.ultimo_pago_fecha)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-violet-600" strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500">Crédito fiscal acumulado</p>
                <p className="text-sm font-bold text-slate-900">{formatCLP(actual.credito_fiscal)}</p>
              </div>
            </div>
          </div>
        )}

        {historial.length > 0 && (
          <>
            <p className="font-bold text-slate-900 text-base mt-1">Historial</p>
            {historial.map((r) => {
              const pill = estadoPillClasses(r.estado === "Pagado" ? "Pagado" : "Por vencer");
              return (
                <button
                  key={r.id}
                  onClick={() => { setEditing(r); setShowForm(true); }}
                  className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3.5 flex items-center gap-3 text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-violet-600" strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900">{formatMes(r.periodo)}</p>
                    <p className="text-xs text-slate-500">{formatCLP(r.total_iva)}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${pill.bg} ${pill.text}`}>
                    {r.estado}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                </button>
              );
            })}
          </>
        )}
      </div>

      <div className="flex-1" />
      <BottomNav variant="detail" onNavigate={onNavigate} />

      {showForm && (
        <ImpuestoForm
          registro={editing}
          sociedadId={sociedad.id}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
