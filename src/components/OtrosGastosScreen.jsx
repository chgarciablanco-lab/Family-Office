import React, { useEffect, useState, useMemo } from "react";
import {
  ArrowLeft, Search, Plus, Receipt, ChevronRight, Info,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import OtrosGastoForm from "./OtrosGastoForm";
import BottomNav from "./BottomNav";
import { formatCLP, formatFechaCorta } from "../lib/format";

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

function GastoRow({ g, onEdit }) {
  return (
    <button
      onClick={() => onEdit(g)}
      className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-amber-100">
        <Receipt className="w-6 h-6 text-amber-500" strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-900 text-base leading-tight">{g.titulo}</p>
        {g.descripcion && <p className="text-sm text-slate-500 mt-0.5">{g.descripcion}</p>}
        <p className="text-xs text-slate-400 mt-0.5">{formatFechaCorta(g.fecha)} · {g.metodo_pago}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <p className="text-sm font-bold text-slate-900">{formatCLP(g.monto)}</p>
        <ChevronRight className="w-5 h-5 text-slate-300" />
      </div>
    </button>
  );
}

export default function OtrosGastosScreen({ sociedadId, entidadNombre, backTo, onNavigate }) {
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Todos");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

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

        <div className="flex items-center justify-between mt-1">
          <p className="font-bold text-slate-900 text-base">Gastos de {entidadNombre}</p>
          <p className="text-sm text-slate-500">{filtrados.length} gastos</p>
        </div>

        {loading && <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>}

        {!loading && filtrados.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 px-4 py-8 text-center">
            <p className="text-sm text-slate-500">No hay gastos que coincidan con tu búsqueda.</p>
          </div>
        )}

        {filtrados.map((g) => (
          <GastoRow key={g.id} g={g} onEdit={(gasto) => { setEditing(gasto); setShowForm(true); }} />
        ))}

        <div className="bg-white rounded-2xl border border-slate-100 px-4 py-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" strokeWidth={1.8} />
          <div>
            <p className="font-bold text-slate-900 text-sm">Registra tus gastos al día</p>
            <p className="text-sm text-slate-500 mt-0.5">Toca un gasto para editarlo, o usa el botón + para agregar uno nuevo.</p>
          </div>
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
