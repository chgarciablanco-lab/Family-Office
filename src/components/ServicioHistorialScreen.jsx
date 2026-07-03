import React, { useEffect, useState } from "react";
import { ArrowLeft, Plus, ChevronRight } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import BottomNav from "./BottomNav";
import { servicioTipoInfo } from "../lib/servicioTipos";
import { formatCLP, formatFechaCorta, formatMes, estadoPillClasses } from "../lib/format";

function subtituloRegistro(r) {
  const partes = [];
  if (r.cuota) partes.push(r.cuota);
  if (r.periodo) partes.push(formatMes(r.periodo));
  if (r.compania) partes.push(r.compania);
  if (r.numero_cliente) partes.push(`N° ${r.numero_cliente}`);
  return partes.join(" · ") || "-";
}

export default function ServicioHistorialScreen({ propiedad, sociedadId, tipoServicio, backTo, onNavigate }) {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const info = servicioTipoInfo(tipoServicio);
  const Icon = info.icon;
  const Form = info.Form;

  const fetchRegistros = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("servicios")
      .select("*")
      .eq("propiedad_id", propiedad.id)
      .eq("tipo_servicio", tipoServicio)
      .order("vencimiento", { ascending: false });
    if (!error) setRegistros(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRegistros();
  }, [propiedad.id, tipoServicio]);

  const handleSaved = () => {
    setShowForm(false);
    setEditing(null);
    fetchRegistros();
  };

  const actual = registros[0];
  const historial = registros.slice(1);

  return (
    <>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={() => onNavigate(backTo)} aria-label="Volver">
          <ArrowLeft className="w-6 h-6 text-blue-600" strokeWidth={2} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">{tipoServicio}</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center"
          aria-label={`Agregar ${tipoServicio.toLowerCase()}`}
        >
          <Plus className="w-5 h-5 text-white" strokeWidth={2.4} />
        </button>
      </div>

      <div className="px-5 flex flex-col gap-3 pb-4">
        <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${info.bg}`}>
            <Icon className={`w-6 h-6 ${info.fg}`} strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 text-base leading-tight">{propiedad.nombre}</p>
            <p className="text-sm text-slate-500 mt-0.5">{propiedad.direccion}</p>
          </div>
        </div>

        {loading && <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>}

        {!loading && !actual && (
          <div className="bg-white rounded-2xl border border-slate-100 px-4 py-8 text-center">
            <p className="text-sm text-slate-500">Aún no hay registros de {tipoServicio.toLowerCase()} para esta propiedad.</p>
          </div>
        )}

        {actual && (
          <>
            <p className="font-bold text-slate-900 text-base mt-1">Registro más reciente</p>
            <button
              onClick={() => { setEditing(actual); setShowForm(true); }}
              className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${info.bg}`}>
                <Icon className={`w-6 h-6 ${info.fg}`} strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-slate-900 text-base leading-tight">{formatCLP(actual.valor)}</p>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${estadoPillClasses(actual.estado).bg} ${estadoPillClasses(actual.estado).text}`}>
                    {actual.estado}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">{subtituloRegistro(actual)}</p>
                <p className="text-sm text-slate-500 mt-1">Vence: {formatFechaCorta(actual.vencimiento)}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
            </button>
          </>
        )}

        {historial.length > 0 && (
          <>
            <p className="font-bold text-slate-900 text-base mt-1">Historial</p>
            {historial.map((r) => {
              const p = estadoPillClasses(r.estado);
              return (
                <button
                  key={r.id}
                  onClick={() => { setEditing(r); setShowForm(true); }}
                  className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3.5 flex items-center gap-3 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900">{formatCLP(r.valor)}</p>
                    <p className="text-xs text-slate-500">{subtituloRegistro(r)} · Vence: {formatFechaCorta(r.vencimiento)}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${p.bg} ${p.text}`}>{r.estado}</span>
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
        <Form
          registro={editing}
          propiedad={propiedad}
          sociedadId={sociedadId}
          tipoServicio={tipoServicio}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
