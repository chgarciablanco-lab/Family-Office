import React, { useEffect, useState, useMemo } from "react";
import {
  ArrowLeft, MoreHorizontal, User, UserPlus, Users, Banknote,
  ShieldCheck, Calendar, Search, SlidersHorizontal, ChevronDown,
  ChevronRight, Info,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import TrabajadorForm from "./TrabajadorForm";
import BottomNav from "./BottomNav";
import { colorClasses, formatCLP, formatFechaCorta } from "../lib/format";

function TrabajadorRow({ t, onEdit }) {
  return (
    <button
      onClick={() => onEdit(t)}
      className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
    >
      <div className="w-11 h-11 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
        <User className="w-5 h-5 text-violet-600" strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-900 text-base leading-tight">{t.nombre}</p>
        <p className="text-sm text-slate-500 mt-0.5">{t.cargo}</p>
        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-2.5">
          <div>
            <p className="text-[11px] text-slate-400">RUT</p>
            <p className="text-xs font-semibold text-slate-700">{t.rut}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Fecha contrato</p>
            <p className="text-xs font-semibold text-slate-700">{formatFechaCorta(t.fecha_contrato)}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Liquidación</p>
            <p className="text-xs font-semibold text-slate-700">{formatCLP(t.liquidacion)}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Previred a pagar</p>
            <p className="text-xs font-semibold text-slate-700">{formatCLP(t.previred)}</p>
          </div>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
    </button>
  );
}

export default function TrabajadoresScreen({
  sociedadId, entidadNombre, entidadSub, entidadColor = "violet",
  backTo, onNavigate,
}) {
  const [trabajadores, setTrabajadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const c = colorClasses[entidadColor] || colorClasses.violet;

  const fetchTrabajadores = async () => {
    setLoading(true);
    let query = supabase.from("trabajadores").select("*").order("nombre");
    query = sociedadId ? query.eq("sociedad_id", sociedadId) : query.is("sociedad_id", null);
    const { data, error } = await query;
    if (!error) setTrabajadores(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTrabajadores();
  }, [sociedadId]);

  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return trabajadores;
    return trabajadores.filter((t) => t.nombre.toLowerCase().includes(q) || t.cargo.toLowerCase().includes(q));
  }, [trabajadores, search]);

  const totalLiquidaciones = trabajadores.reduce((sum, t) => sum + (Number(t.liquidacion) || 0), 0);
  const totalPrevired = trabajadores.reduce((sum, t) => sum + (Number(t.previred) || 0), 0);

  const handleSaved = () => {
    setShowForm(false);
    setEditing(null);
    fetchTrabajadores();
  };

  return (
    <>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={() => onNavigate(backTo)} aria-label="Volver">
          <ArrowLeft className="w-6 h-6 text-blue-600" strokeWidth={2} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Trabajadores</h1>
        <button aria-label="Más opciones">
          <MoreHorizontal className="w-6 h-6 text-blue-600" strokeWidth={2.2} />
        </button>
      </div>

      <div className="px-5 flex flex-col gap-3 pb-4">
        <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${c.bg}`}>
              <User className={`w-7 h-7 ${c.fg}`} strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-lg leading-tight">{entidadNombre}</p>
              <p className="text-sm text-slate-500 mt-0.5">{entidadSub}</p>
            </div>
          </div>
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="w-full flex items-center justify-center gap-2 border-2 border-violet-500 text-violet-600 font-semibold text-sm rounded-xl py-2.5"
          >
            <UserPlus className="w-4 h-4" strokeWidth={2} />
            Nuevo trabajador
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4">
            <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-violet-600" strokeWidth={1.8} />
            </div>
            <p className="text-xl font-bold text-slate-900">{trabajadores.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Trabajadores activos</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4">
            <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center mb-2">
              <Banknote className="w-5 h-5 text-violet-600" strokeWidth={1.8} />
            </div>
            <p className="text-xl font-bold text-slate-900">{formatCLP(totalLiquidaciones)}</p>
            <p className="text-xs text-slate-500 mt-0.5">Total liquidaciones estimadas</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4">
            <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center mb-2">
              <ShieldCheck className="w-5 h-5 text-violet-600" strokeWidth={1.8} />
            </div>
            <p className="text-xl font-bold text-slate-900">{formatCLP(totalPrevired)}</p>
            <p className="text-xs text-slate-500 mt-0.5">Total a pagar Previred</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4">
            <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center mb-2">
              <Calendar className="w-5 h-5 text-violet-600" strokeWidth={1.8} />
            </div>
            <p className="text-base font-bold text-slate-900">{filtrados.length} en lista</p>
            <p className="text-xs text-slate-500 mt-0.5">Filtro actual</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white border border-slate-100 shadow-sm rounded-xl px-3 py-2.5 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" strokeWidth={2} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar trabajador..."
              className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none flex-1"
            />
          </div>
          <button className="bg-white border border-slate-100 shadow-sm rounded-xl px-3 py-2.5 flex items-center gap-1.5">
            <SlidersHorizontal className="w-4 h-4 text-slate-500" strokeWidth={2} />
            <span className="text-sm font-semibold text-slate-600">Filtrar</span>
            <ChevronDown className="w-4 h-4 text-slate-400" strokeWidth={2} />
          </button>
        </div>

        {loading && <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>}

        {!loading && filtrados.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 px-4 py-8 text-center">
            <p className="text-sm text-slate-500">No hay trabajadores registrados todavía.</p>
          </div>
        )}

        {filtrados.map((t) => (
          <TrabajadorRow key={t.id} t={t} onEdit={(tr) => { setEditing(tr); setShowForm(true); }} />
        ))}

        <div className="bg-white rounded-2xl border border-slate-100 px-4 py-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
            <Info className="w-4.5 h-4.5 text-violet-600" strokeWidth={1.8} />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">Información importante</p>
            <p className="text-sm text-slate-500 mt-0.5">
              Los valores de liquidación son estimados y pueden variar según las últimas remuneraciones y días trabajados.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1" />
      <BottomNav variant="detail" onNavigate={onNavigate} />

      {showForm && (
        <TrabajadorForm
          trabajador={editing}
          sociedadId={sociedadId}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
