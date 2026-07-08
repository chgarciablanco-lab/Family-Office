import React, { useEffect, useState, useMemo } from "react";
import {
  ArrowLeft, Plus, Search, SlidersHorizontal, ChevronDown,
  Building2, Home as HomeIcon, ChevronRight, Info, Pencil,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import ArriendoForm from "./ArriendoForm";
import BottomNav from "./BottomNav";
import { formatCLP, formatFechaCorta, estadoPillClasses } from "../lib/format";
import { usePermisos } from "../context/PermisosContext";

function ArriendoRow({ item, onSelect, onEdit, editable }) {
  const p = estadoPillClasses(item.estado === "Pagado" ? "Pagado" : item.estado === "Vencido" ? "Vencido" : "Por vencer");
  const contraparteLabel = item.relacion === "propia" ? "Arrendatario" : "Arrendador";
  const Icon = item.relacion === "propia" ? HomeIcon : Building2;
  return (
    <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 flex items-center gap-3">
      <button
        onClick={() => onSelect(item)}
        className="flex-1 flex items-center gap-3 text-left active:scale-[0.98] transition-transform min-w-0"
      >
        <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
          <Icon className="w-6 h-6 text-violet-600" strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-slate-900 text-base leading-tight">{item.nombre}</p>
            {item.relacion === "propia" && !item.propiedad_id && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                Sin vincular
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">{item.tipo} · {item.ubicacion}</p>

          <div className="flex flex-wrap items-start gap-x-4 gap-y-1.5 mt-2">
            <div>
              <p className="text-[11px] text-slate-400">{contraparteLabel}</p>
              <p className="text-xs font-semibold text-slate-700">{item.contraparte_nombre || "-"}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Monto</p>
              <p className="text-xs font-bold text-slate-900">{formatCLP(item.monto)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${p.bg} ${p.text}`}>{item.estado}</span>
            <span className="text-xs text-slate-500">Vence: {formatFechaCorta(item.vencimiento)}</span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
      </button>
      {editable && (
        <button
          onClick={() => onEdit(item)}
          aria-label="Editar arriendo"
          className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0"
        >
          <Pencil className="w-4 h-4 text-slate-500" strokeWidth={1.8} />
        </button>
      )}
    </div>
  );
}

export default function ArriendosScreen({ sociedadId = null, entidadNombre = "tus arriendos", backTo, onNavigate, onSelect }) {
  const { puedeEditar } = usePermisos();
  const editable = puedeEditar("arriendos");
  const [arriendos, setArriendos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchArriendos = async () => {
    setLoading(true);
    let query = supabase.from("arriendos").select("*").order("nombre");
    query = sociedadId ? query.eq("sociedad_id", sociedadId) : query.is("sociedad_id", null);
    const { data, error } = await query;
    if (!error) setArriendos(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchArriendos();
  }, [sociedadId]);

  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return arriendos;
    return arriendos.filter(
      (a) => a.nombre.toLowerCase().includes(q) || (a.contraparte_nombre || "").toLowerCase().includes(q)
    );
  }, [arriendos, search]);

  const propias = filtrados.filter((a) => a.relacion === "propia");
  const terceros = filtrados.filter((a) => a.relacion === "tercero");

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
        {editable ? (
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center"
            aria-label="Agregar arriendo"
          >
            <Plus className="w-5 h-5 text-white" strokeWidth={2.4} />
          </button>
        ) : (
          <div className="w-8" />
        )}
      </div>

      <div className="px-5 flex flex-col gap-3 pb-4">
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
            <span className="text-sm font-semibold text-slate-600">Filtrar</span>
            <ChevronDown className="w-4 h-4 text-slate-400" strokeWidth={2} />
          </button>
        </div>

        <div className="flex items-center justify-between mt-1">
          <p className="font-bold text-slate-900 text-base">Arriendos de {entidadNombre}</p>
          <p className="text-sm text-slate-500">{filtrados.length} arriendos</p>
        </div>

        {loading && <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>}

        {!loading && filtrados.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 px-4 py-8 text-center">
            <p className="text-sm text-slate-500">No hay arriendos que coincidan con tu búsqueda.</p>
          </div>
        )}

        {propias.length > 0 && (
          <>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">Propias arrendadas a terceros</p>
            {propias.map((item) => (
              <ArriendoRow
                key={item.id}
                item={item}
                onSelect={onSelect}
                onEdit={(a) => { setEditing(a); setShowForm(true); }}
                editable={editable}
              />
            ))}
          </>
        )}

        {terceros.length > 0 && (
          <>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">Arrendadas de terceros</p>
            {terceros.map((item) => (
              <ArriendoRow
                key={item.id}
                item={item}
                onSelect={onSelect}
                onEdit={(a) => { setEditing(a); setShowForm(true); }}
                editable={editable}
              />
            ))}
          </>
        )}

        <div className="bg-white rounded-2xl border border-slate-100 px-4 py-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" strokeWidth={1.8} />
          <div>
            <p className="font-bold text-slate-900 text-sm">Mantén tus arriendos al día</p>
            <p className="text-sm text-slate-500 mt-0.5">Toca un arriendo para ver sus 12 meses de pago, usa el lápiz para editar sus datos, o el botón + para agregar uno nuevo. Si es una propiedad propia, vincúlala a la propiedad real para que deje de mostrar Gastos básicos.</p>
          </div>
        </div>
      </div>

      <div className="flex-1" />
      <BottomNav variant="detail" onNavigate={onNavigate} />

      {showForm && (
        <ArriendoForm
          arriendo={editing}
          sociedadId={sociedadId}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
