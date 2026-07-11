import React, { useEffect, useState, useMemo } from "react";
import { ArrowLeft, Search, Plus, ChevronRight, Info } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import EtiquetaGastoForm from "./EtiquetaGastoForm";
import BottomNav from "./BottomNav";
import { formatCLP, formatFechaCorta, colorClasses } from "../lib/format";
import { ICONOS_ETIQUETA } from "../lib/etiquetas";
import { usePermisos } from "../context/PermisosContext";

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

function ItemRow({ item, Icon, c, onEdit, editable }) {
  return (
    <button
      onClick={() => editable && onEdit(item)}
      disabled={!editable}
      className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${c.bg}`}>
        <Icon className={`w-6 h-6 ${c.fg}`} strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-900 text-base leading-tight">{item.titulo}</p>
        {item.descripcion && <p className="text-sm text-slate-500 mt-0.5">{item.descripcion}</p>}
        <p className="text-xs text-slate-400 mt-0.5">{formatFechaCorta(item.fecha)} · {item.metodo_pago}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <p className="text-sm font-bold text-slate-900">{formatCLP(item.monto)}</p>
        <ChevronRight className="w-5 h-5 text-slate-300" />
      </div>
    </button>
  );
}

export default function EtiquetaGastosScreen({ etiqueta, ownerUserId = null, backTo, onNavigate }) {
  const { puedeEditar } = usePermisos();
  const editable = Boolean(ownerUserId) || puedeEditar("items_etiqueta");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Todos");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const Icon = ICONOS_ETIQUETA[etiqueta.icono] || ICONOS_ETIQUETA.Tag;
  const c = colorClasses[etiqueta.color] || colorClasses.slate;

  const fetchItems = async () => {
    setLoading(true);
    let query = supabase.from("items_etiqueta_gasto").select("*").eq("etiqueta_id", etiqueta.id).order("fecha", { ascending: false });
    query = ownerUserId ? query.eq("owner_user_id", ownerUserId) : query.is("owner_user_id", null);
    const { data, error } = await query;
    if (!error) setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etiqueta.id, ownerUserId]);

  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      if (!dentroDeTab(it.fecha, activeTab)) return false;
      if (!q) return true;
      return it.titulo.toLowerCase().includes(q) || (it.descripcion || "").toLowerCase().includes(q);
    });
  }, [items, search, activeTab]);

  const handleSaved = () => {
    setShowForm(false);
    setEditing(null);
    fetchItems();
  };

  return (
    <>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={() => onNavigate(backTo)} aria-label="Volver">
          <ArrowLeft className="w-6 h-6 text-blue-600" strokeWidth={2} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">{etiqueta.nombre}</h1>
        {editable ? (
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center"
            aria-label="Agregar registro"
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
              placeholder={`Buscar en ${etiqueta.nombre.toLowerCase()}...`}
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
          <p className="font-bold text-slate-900 text-base">{etiqueta.nombre}</p>
          <p className="text-sm text-slate-500">{filtrados.length} registros</p>
        </div>

        {loading && <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>}

        {!loading && filtrados.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 px-4 py-8 text-center">
            <p className="text-sm text-slate-500">No hay registros que coincidan con tu búsqueda.</p>
          </div>
        )}

        {filtrados.map((it) => (
          <ItemRow
            key={it.id}
            item={it}
            Icon={Icon}
            c={c}
            onEdit={(i) => { setEditing(i); setShowForm(true); }}
            editable={editable}
          />
        ))}

        <div className="bg-white rounded-2xl border border-slate-100 px-4 py-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" strokeWidth={1.8} />
          <div>
            <p className="font-bold text-slate-900 text-sm">Etiqueta personalizada</p>
            <p className="text-sm text-slate-500 mt-0.5">Toca un registro para editarlo, o usa el botón + para agregar uno nuevo.</p>
          </div>
        </div>
      </div>

      <div className="flex-1" />
      <BottomNav variant={ownerUserId ? "personal" : "detail"} onNavigate={onNavigate} />

      {showForm && (
        <EtiquetaGastoForm
          item={editing}
          etiquetaId={etiqueta.id}
          ownerUserId={ownerUserId}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
