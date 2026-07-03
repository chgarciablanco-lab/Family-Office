import React, { useEffect, useState, useMemo } from "react";
import {
  ArrowLeft, Plus, Search, SlidersHorizontal, TrendingUp, TrendingDown,
  Banknote, Calendar, Clock, Building2, Home as HomeIcon, ChevronRight,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import ArriendoForm from "./ArriendoForm";
import BottomNav from "./BottomNav";
import { formatCLP, formatFechaCorta, estadoPillClasses } from "../lib/format";

function ArriendoRow({ item, onEdit }) {
  const p = estadoPillClasses(item.estado === "Pagado" ? "Pagado" : item.estado === "Vencido" ? "Vencido" : "Por vencer");
  const contraparteLabel = item.relacion === "propia" ? "Arrendatario" : "Arrendador";
  const ThumbIcon = item.relacion === "propia" ? HomeIcon : Building2;
  return (
    <button
      onClick={() => onEdit(item)}
      className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-3 py-3 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
    >
      <div className="w-14 h-14 rounded-xl bg-slate-200 flex items-center justify-center shrink-0">
        <ThumbIcon className="w-6 h-6 text-slate-500" strokeWidth={1.6} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-900 text-sm leading-tight">{item.nombre}</p>
        <p className="text-xs text-slate-500 mt-0.5">{item.tipo}</p>
        <p className="text-xs text-slate-400">{item.ubicacion}</p>

        <div className="flex flex-wrap items-start gap-x-4 gap-y-1.5 mt-2">
          <div>
            <p className="text-[10px] text-slate-400">{contraparteLabel}</p>
            <p className="text-xs font-semibold text-slate-700">{item.contraparte_nombre || "-"}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400">Monto</p>
            <p className="text-xs font-bold text-slate-900">{formatCLP(item.monto)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400">Vencimiento</p>
            <p className="text-xs font-bold text-slate-700">{formatFechaCorta(item.vencimiento)}</p>
          </div>
        </div>

        <span className={`inline-block mt-2 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${p.bg} ${p.text}`}>
          {item.estado}
        </span>
      </div>
      <ChevronRight className="w-5 h-5 text-slate-300 shrink-0 self-center" />
    </button>
  );
}

export default function ArriendosScreen({ sociedad, backTo, onNavigate }) {
  const [arriendos, setArriendos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchArriendos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("arriendos")
      .select("*")
      .eq("sociedad_id", sociedad.id)
      .order("nombre");
    if (!error) setArriendos(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchArriendos();
  }, [sociedad.id]);

  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return arriendos;
    return arriendos.filter(
      (a) => a.nombre.toLowerCase().includes(q) || (a.contraparte_nombre || "").toLowerCase().includes(q)
    );
  }, [arriendos, search]);

  const propias = filtrados.filter((a) => a.relacion === "propia");
  const terceros = filtrados.filter((a) => a.relacion === "tercero");
  const ingresos = propias.reduce((sum, a) => sum + (Number(a.monto) || 0), 0);
  const egresos = terceros.reduce((sum, a) => sum + (Number(a.monto) || 0), 0);
  const pendientes = filtrados.filter((a) => a.estado !== "Pagado").length;

  const stats = [
    { icon: TrendingUp, value: formatCLP(ingresos), label: "Ingresos por\narriendo", bg: "bg-emerald-100", fg: "text-emerald-600" },
    { icon: TrendingDown, value: formatCLP(egresos), label: "Egresos por\narriendo", bg: "bg-red-100", fg: "text-red-500" },
    { icon: Banknote, value: formatCLP(ingresos - egresos), label: "Saldo por\narriendo", bg: "bg-emerald-100", fg: "text-emerald-600" },
    { icon: Calendar, value: new Date().toLocaleDateString("es-CL", { month: "long", year: "numeric" }), label: "Período\nactual", bg: "bg-violet-100", fg: "text-violet-600" },
    { icon: Clock, value: String(pendientes), label: "Pagos\npendientes", bg: "bg-violet-100", fg: "text-violet-600" },
  ];

  const handleSaved = () => {
    setShowForm(false);
    setEditing(null);
    fetchArriendos();
  };

  return (
    <>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={() => onNavigate(backTo)} aria-label="Volver">
          <ArrowLeft className="w-6 h-6 text-blue-600" strokeWidth={2} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Arriendos</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center"
          aria-label="Agregar arriendo"
        >
          <Plus className="w-5 h-5 text-white" strokeWidth={2.4} />
        </button>
      </div>

      <div className="px-5 flex flex-col gap-3 pb-4">
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${s.bg}`}>
                <s.icon className={`w-5 h-5 ${s.fg}`} strokeWidth={1.8} />
              </div>
              <p className="text-lg font-bold text-slate-900 leading-tight">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5 whitespace-pre-line">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white border border-slate-100 shadow-sm rounded-xl px-3 py-2.5 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" strokeWidth={2} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar propiedad, arrendatario..."
              className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none flex-1"
            />
          </div>
          <button className="bg-white border border-slate-100 shadow-sm rounded-xl px-3 py-2.5 flex items-center gap-1.5 shrink-0">
            <SlidersHorizontal className="w-4 h-4 text-slate-500" strokeWidth={2} />
          </button>
        </div>

        {loading && <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>}

        {!loading && (
          <>
            <div className="rounded-2xl bg-violet-50 p-3">
              <div className="w-full flex items-center gap-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 bg-violet-100">
                  <HomeIcon className="w-5 h-5 text-violet-600" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-base leading-tight">Propias arrendadas a terceros</p>
                  <p className="text-xs text-slate-500 mt-0.5">Propiedades de la sociedad que están arrendadas a otros.</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0 bg-violet-200 text-violet-700">
                  {propias.length}
                </span>
              </div>
              {propias.length > 0 && (
                <div className="flex flex-col gap-3 mt-3">
                  {propias.map((item) => (
                    <ArriendoRow key={item.id} item={item} onEdit={(a) => { setEditing(a); setShowForm(true); }} />
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-blue-50 p-3">
              <div className="w-full flex items-center gap-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 bg-blue-100">
                  <Building2 className="w-5 h-5 text-blue-600" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-base leading-tight">Arrendadas de terceros</p>
                  <p className="text-xs text-slate-500 mt-0.5">Propiedades que la sociedad arrienda (no son de la sociedad).</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0 bg-blue-200 text-blue-700">
                  {terceros.length}
                </span>
              </div>
              {terceros.length > 0 && (
                <div className="flex flex-col gap-3 mt-3">
                  {terceros.map((item) => (
                    <ArriendoRow key={item.id} item={item} onEdit={(a) => { setEditing(a); setShowForm(true); }} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex-1" />
      <BottomNav variant="detail" onNavigate={onNavigate} />

      {showForm && (
        <ArriendoForm
          arriendo={editing}
          sociedadId={sociedad.id}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
