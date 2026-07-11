import React, { useEffect, useState, useMemo } from "react";
import {
  ArrowLeft, Plus, Home as HomeIcon, Pencil, ChevronRight, Info,
  Search, SlidersHorizontal, ChevronDown,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import PropiedadForm from "./PropiedadForm";
import BottomNav from "./BottomNav";
import { colorClasses } from "../lib/format";
import { usePermisos } from "../context/PermisosContext";

export default function PropiedadesScreen({
  sociedadId = null, ownerUserId = null, entidadNombre = "tus propiedades", backTo = "persona", onNavigate, onSelect,
}) {
  const { puedeEditar } = usePermisos();
  const editable = Boolean(ownerUserId) || puedeEditar("propiedades");
  const [propiedades, setPropiedades] = useState([]);
  const [arrendadas, setArrendadas] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchPropiedades = async () => {
    setLoading(true);
    let query = supabase.from("propiedades").select("*").order("nombre");
    if (sociedadId) {
      query = query.eq("sociedad_id", sociedadId);
    } else {
      query = query.is("sociedad_id", null);
      query = ownerUserId ? query.eq("owner_user_id", ownerUserId) : query.is("owner_user_id", null);
    }
    const { data, error } = await query;
    if (!error) setPropiedades(data || []);

    let arriendosQuery = supabase
      .from("arriendos")
      .select("propiedad_id")
      .eq("relacion", "propia")
      .not("propiedad_id", "is", null);
    if (sociedadId) {
      arriendosQuery = arriendosQuery.eq("sociedad_id", sociedadId);
    } else {
      arriendosQuery = arriendosQuery.is("sociedad_id", null);
      arriendosQuery = ownerUserId
        ? arriendosQuery.eq("owner_user_id", ownerUserId)
        : arriendosQuery.is("owner_user_id", null);
    }
    const { data: arriendosData } = await arriendosQuery;
    setArrendadas(new Set((arriendosData || []).map((a) => a.propiedad_id)));

    setLoading(false);
  };

  useEffect(() => {
    fetchPropiedades();
  }, [sociedadId, ownerUserId]);

  const filtradas = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return propiedades;
    return propiedades.filter(
      (p) => p.nombre.toLowerCase().includes(q) || p.comuna.toLowerCase().includes(q)
    );
  }, [propiedades, search]);

  const handleSaved = () => {
    setShowForm(false);
    setEditing(null);
    fetchPropiedades();
  };

  return (
    <>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={() => onNavigate(backTo)} aria-label="Volver">
          <ArrowLeft className="w-6 h-6 text-blue-600" strokeWidth={2} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Propiedades</h1>
        {editable ? (
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center"
            aria-label="Agregar propiedad"
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
              placeholder="Buscar por nombre, comuna..."
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
          <p className="font-bold text-slate-900 text-base">Propiedades de {entidadNombre}</p>
          <p className="text-sm text-slate-500">{filtradas.length} propiedades</p>
        </div>

        {loading && <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>}

        {!loading && filtradas.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 px-4 py-8 text-center">
            <p className="text-sm text-slate-500">No hay propiedades que coincidan con tu búsqueda.</p>
          </div>
        )}

        {filtradas.map((p) => {
          const c = colorClasses[p.color_tag] || colorClasses.violet;
          return (
            <div
              key={p.id}
              className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 flex items-center gap-4"
            >
              <button
                onClick={() => onSelect(p)}
                className="flex-1 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${c.bg}`}>
                  <HomeIcon className={`w-6 h-6 ${c.fg}`} strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-900 text-base leading-tight">{p.nombre}</p>
                    {arrendadas.has(p.id) && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                        Arrendada
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{p.tipo} · {p.comuna}</p>
                  <p className="text-xs text-slate-400">{p.direccion}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
              </button>
              {editable && (
                <button
                  onClick={() => { setEditing(p); setShowForm(true); }}
                  aria-label="Editar propiedad"
                  className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0"
                >
                  <Pencil className="w-4 h-4 text-slate-500" strokeWidth={1.8} />
                </button>
              )}
            </div>
          );
        })}

        <div className="bg-white rounded-2xl border border-slate-100 px-4 py-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" strokeWidth={1.8} />
          <div>
            <p className="font-bold text-slate-900 text-sm">Gastos básicos por propiedad</p>
            <p className="text-sm text-slate-500 mt-0.5">Toca una propiedad para ver y administrar sus servicios (luz, agua, gas, contribuciones, etc.).</p>
          </div>
        </div>
      </div>

      <div className="flex-1" />
      <BottomNav variant="detail" onNavigate={onNavigate} />

      {showForm && (
        <PropiedadForm
          propiedad={editing}
          sociedadId={sociedadId}
          ownerUserId={ownerUserId}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
