import React, { useEffect, useState } from "react";
import { ArrowLeft, Plus, ChevronRight } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import BottomNav from "./BottomNav";
import { servicioTipoInfo } from "../lib/servicioTipos";
import { formatCLP, formatFechaCorta, formatMes, estadoPillClasses } from "../lib/format";
import { esMultiMedidor, valorTotal } from "../lib/medidores";
import AnioCompletoForm from "./AnioCompletoForm";
import MedidorMesForm from "./MedidorMesForm";

const tiposAnioCompleto = ["Luz", "Gas", "Agua", "Gastos comunes", "Seguros"];

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
  const [editingMedidor, setEditingMedidor] = useState(null);
  const [showSetup, setShowSetup] = useState(false);

  const info = servicioTipoInfo(tipoServicio);
  const Icon = info.icon;
  const Form = info.Form;
  const esAnioCompleto = tiposAnioCompleto.includes(tipoServicio);

  const fetchRegistros = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("servicios")
      .select("*")
      .eq("propiedad_id", propiedad.id)
      .eq("tipo_servicio", tipoServicio)
      .order("periodo", { ascending: true, nullsFirst: false })
      .order("vencimiento", { ascending: true, nullsFirst: false })
      .order("numero_cliente", { ascending: true });

    if (!error) {
      setRegistros(data || []);
      if ((data || []).length === 0 && esAnioCompleto) setShowSetup(true);
    }
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

  const handleMedidorSaved = () => {
    setEditingMedidor(null);
    fetchRegistros();
  };

  const handleGenerated = () => {
    setShowSetup(false);
    fetchRegistros();
  };

  const handleSelect = (r) => {
    if (esMultiMedidor(r)) {
      setEditingMedidor(r);
    } else {
      setEditing(r);
      setShowForm(true);
    }
  };

  const mesActual = new Date().toISOString().slice(0, 7);
  const actual = registros.find((r) => (r.periodo || "").slice(0, 7) === mesActual) || registros[0];
  const historial = registros.filter((r) => r !== actual);

  const renderTarjeta = (r, destacado) => {
    if (esMultiMedidor(r)) {
      return (
        <button
          key={r.id}
          onClick={() => handleSelect(r)}
          className={`w-full bg-white rounded-2xl border border-slate-100 shadow-sm text-left flex flex-col gap-2.5 ${
            destacado ? "px-4 py-4" : "px-4 py-3.5"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400">{formatMes(r.periodo)}</p>
            <p className="text-sm font-bold text-slate-900">Total: {formatCLP(valorTotal(r))}</p>
          </div>
          {r.medidores.map((m, i) => {
            const p = estadoPillClasses(m.estado);
            return (
              <div
                key={i}
                className={`flex items-center justify-between gap-2 ${i > 0 ? "border-t border-slate-50 pt-2" : ""}`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900">N° {m.numero_cliente || "-"}</p>
                  <p className="text-xs text-slate-500">
                    {m.compania || "-"} · Vence: {formatFechaCorta(m.vencimiento)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <p className="text-sm font-bold text-slate-900">{formatCLP(m.valor)}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.bg} ${p.text}`}>{m.estado}</span>
                </div>
              </div>
            );
          })}
        </button>
      );
    }

    const p = estadoPillClasses(r.estado);
    return (
      <button
        key={r.id}
        onClick={() => handleSelect(r)}
        className={`w-full bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 text-left ${
          destacado ? "px-4 py-4 gap-4" : "px-4 py-3.5"
        }`}
      >
        {destacado && (
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${info.bg}`}>
            <Icon className={`w-6 h-6 ${info.fg}`} strokeWidth={1.8} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-bold text-slate-900 ${destacado ? "text-base" : "text-sm"} leading-tight`}>
              {formatCLP(r.valor)}
            </p>
            {destacado && (
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${p.bg} ${p.text}`}>{r.estado}</span>
            )}
          </div>
          {destacado ? (
            <>
              <p className="text-sm text-slate-500 mt-0.5">{subtituloRegistro(r)}</p>
              <p className="text-sm text-slate-500 mt-1">Vence: {formatFechaCorta(r.vencimiento)}</p>
            </>
          ) : (
            <p className="text-xs text-slate-500">{subtituloRegistro(r)} · Vence: {formatFechaCorta(r.vencimiento)}</p>
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

        {!loading && !actual && !showSetup && (
          <div className="bg-white rounded-2xl border border-slate-100 px-4 py-8 text-center flex flex-col items-center gap-3">
            <p className="text-sm text-slate-500">Aún no hay registros de {tipoServicio.toLowerCase()} para esta propiedad.</p>
            {esAnioCompleto && (
              <button
                onClick={() => setShowSetup(true)}
                className="text-sm font-semibold text-violet-600"
              >
                Configurar los 12 meses del año
              </button>
            )}
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

        {esAnioCompleto && actual && (
          <button
            onClick={() => setShowSetup(true)}
            className="w-full bg-white rounded-2xl border border-dashed border-slate-200 px-4 py-3.5 text-center text-sm font-semibold text-violet-600"
          >
            + Agregar otro número de cliente
          </button>
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

      {editingMedidor && (
        <MedidorMesForm
          registro={editingMedidor}
          propiedad={propiedad}
          tipoServicio={tipoServicio}
          onClose={() => setEditingMedidor(null)}
          onSaved={handleMedidorSaved}
        />
      )}

      {showSetup && (
        <AnioCompletoForm
          propiedad={propiedad}
          sociedadId={sociedadId}
          tipoServicio={tipoServicio}
          esAdicional={registros.length > 0}
          registrosExistentes={registros}
          onClose={() => setShowSetup(false)}
          onGenerated={handleGenerated}
        />
      )}
    </>
  );
}
