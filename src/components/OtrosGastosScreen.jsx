import React, { useEffect, useState, useMemo } from "react";
import {
  ArrowLeft, Search, Plus, Receipt, ChevronRight,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import OtrosGastoForm from "./OtrosGastoForm";
import BottomNav from "./BottomNav";
import { colorClasses, formatCLP, formatFechaCorta } from "../lib/format";

const tabs = ["Todos", "Hoy", "Esta semana", "Este mes"];

function dentroDeTab(fechaStr, tab) {
  if (tab === "Todos") return true;
  const fecha = new Date(fechaStr + "T00:00:00");
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  if (tab === "Hoy") return fecha.getTime() === hoy.getTime();
  if (tab === "Esta semana") {
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());
    return fecha >= inicioSemana;
  }
  if (tab === "Este mes") {
    return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
  }
  return true;
}

export default function OtrosGastosScreen({
  sociedadId, entidadNombre, entidadSub, entidadColor = "amber", backTo, onNavigate,
}) {
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Todos");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const c = colorClasses[entidadColor] || colorClasses.violet;

  const fetchGastos = async () => {
    setLoading(true);
    let query = supabase.from("otros_gastos").select("*").order("fecha", { ascending: false });
    query = sociedadId ? query.eq("sociedad_id", sociedadId) : query.is("sociedad_id", null);
    const { data, error } = await query;
    if (!error) setGastos(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchGastos();
  }, [sociedadId]);

  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    return gastos.filter((g) => {
      if (!dentroDeTab(g.fecha, activeTab)) return false;
      if (!q) return true;
      return g.titulo.toLowerCase().includes(q) || (g.descripcion || "").toLowerCase().includes(q);
    });
  }, [gastos, search, activeTab]);

  const total = filtrados.reduce((sum, g) => sum + Number(g.monto), 0);
  const promedio = filtrados.length ? total / filtrados.length : 0;
  const mayor = filtrados.reduce((max, g) => Math.max(max, Number(g.monto)), 0);

  const handleSaved = () => {
    setShowForm(false);
    setEditing(null);
    fetchGastos();
  };

  return (
    <>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={() => onNavigate(backTo)} aria-label="Volver">
          <ArrowLeft className="w-6 h-6 text-blue-600" strokeWidth={2} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Otros gastos</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center"
          aria-label="Agregar gasto"
        >
          <Plus className="w-5 h-5 text-white" strokeWidth={2.4} />
        </button>
      </div>

      <div className="px-5 flex flex-col gap-3 pb-4">
        <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 flex items-center gap-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${c.bg}`}>
            <Receipt className={`w-7 h-7 ${c.fg}`} strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 text-lg leading-tight">{entidadNombre}</p>
            <p className="text-sm text-slate-500 mt-0.5">{entidadSub}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl px-4 py-3.5 bg-emerald-50">
            <p className="text-xs text-slate-500">Total {activeTab.toLowerCase()}</p>
            <p className="text-xl font-bold mt-0.5 text-emerald-700">{formatCLP(total)}</p>
          </div>
          <div className="rounded-2xl px-4 py-3.5 bg-blue-50">
            <p className="text-xs text-slate-500">Gasto promedio</p>
            <p className="text-xl font-bold mt-0.5 text-blue-700">{formatCLP(Math.round(promedio))}</p>
          </div>
          <div className="rounded-2xl px-4 py-3.5 bg-slate-100">
            <p className="text-xs text-slate-500">Transacciones</p>
            <p className="text-xl font-bold mt-0.5 text-slate-800">{filtrados.length}</p>
          </div>
          <div className="rounded-2xl px-4 py-3.5 bg-orange-50">
            <p className="text-xs text-slate-500">Mayor gasto</p>
            <p className="text-xl font-bold mt-0.5 text-orange-600">{formatCLP(mayor)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white border border-slate-100 shadow-sm rounded-xl px-3 py-2.5 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" strokeWidth={2} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar gasto..."
              className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none flex-1"
            />
          </div>
        </div>

        <div className="flex items-center gap-5 border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-sm font-semibold pb-2.5 border-b-2 -mb-px ${
                activeTab === tab ? "text-violet-600 border-violet-600" : "text-slate-400 border-transparent"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading && <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>}

        {!loading && filtrados.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 px-4 py-8 text-center">
            <p className="text-sm text-slate-500">No hay gastos registrados en este período.</p>
          </div>
        )}

        <div className="flex flex-col">
          {filtrados.map((g, i) => (
            <button
              key={g.id}
              onClick={() => { setEditing(g); setShowForm(true); }}
              className={`w-full py-3.5 flex items-center gap-3 text-left ${
                i !== filtrados.length - 1 ? "border-b border-slate-100" : ""
              }`}
            >
              <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 bg-orange-100">
                <Receipt className="w-5 h-5 text-orange-500" strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 text-sm leading-tight">{g.titulo}</p>
                {g.descripcion && <p className="text-xs text-slate-500 mt-0.5">{g.descripcion}</p>}
                <p className="text-xs text-slate-400 mt-0.5">{formatFechaCorta(g.fecha)} · {g.metodo_pago}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <p className="text-sm font-bold text-orange-500">{formatCLP(g.monto)}</p>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1" />
      <BottomNav variant="detail" onNavigate={onNavigate} />

      {showForm && (
        <OtrosGastoForm
          gasto={editing}
          sociedadId={sociedadId}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
