import React, { useEffect, useState } from "react";
import { ArrowLeft, Plus, Search, SlidersHorizontal, Building2, ChevronRight, Info } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import SociedadForm from "./SociedadForm";
import BottomNav from "./BottomNav";
import { colorClasses, estadoSociedadPillClasses } from "../lib/format";

export default function SociedadesListScreen({ onNavigate, onSelect }) {
  const [sociedades, setSociedades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const fetchSociedades = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("sociedades").select("*").order("nombre");
    if (!error) setSociedades(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchSociedades();
  }, []);

  const filtradas = sociedades.filter((s) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return s.nombre.toLowerCase().includes(q) || s.rut.toLowerCase().includes(q);
  });

  const handleAdded = () => {
    setShowForm(false);
    fetchSociedades();
  };

  return (
    <>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={() => onNavigate("home")} aria-label="Volver">
          <ArrowLeft className="w-6 h-6 text-blue-600" strokeWidth={2} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Sociedades</h1>
        <button onClick={() => setShowForm(true)} aria-label="Agregar sociedad">
          <Plus className="w-6 h-6 text-blue-600" strokeWidth={2.2} />
        </button>
      </div>

      <div className="px-5 flex items-center gap-2 pb-4">
        <div className="flex-1 bg-slate-100 rounded-xl px-3 py-2.5 flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" strokeWidth={2} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar sociedad..."
            className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none flex-1"
          />
        </div>
        <button className="bg-slate-100 rounded-xl p-2.5" aria-label="Filtrar">
          <SlidersHorizontal className="w-4 h-4 text-slate-500" strokeWidth={2} />
        </button>
      </div>

      <div className="px-5 flex flex-col gap-3">
        {loading && <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>}

        {!loading && sociedades.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 px-4 py-8 flex flex-col items-center text-center gap-3">
            <Building2 className="w-8 h-8 text-slate-300" strokeWidth={1.6} />
            <div>
              <p className="text-sm font-semibold text-slate-700">Aún no tienes sociedades</p>
              <p className="text-sm text-slate-500 mt-0.5">Toca el botón + arriba para agregar la primera.</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="mt-1 bg-violet-600 text-white font-semibold text-sm rounded-xl px-4 py-2.5"
            >
              Agregar sociedad
            </button>
          </div>
        )}

        {!loading && sociedades.length > 0 && filtradas.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 px-4 py-8 text-center">
            <p className="text-sm text-slate-500">No hay sociedades que coincidan con tu búsqueda.</p>
          </div>
        )}

        {filtradas.map((s) => {
          const c = colorClasses[s.color_tag] || colorClasses.violet;
          const p = estadoSociedadPillClasses(s.estado);
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${c.bg}`}>
                <Building2 className={`w-7 h-7 ${c.fg}`} strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 text-base leading-tight">{s.nombre}</p>
                <p className="text-sm text-slate-500 mt-0.5">Rut: {s.rut}</p>
                <span className={`inline-block mt-2 text-xs font-semibold px-2.5 py-0.5 rounded-full ${p.bg} ${p.text}`}>
                  {s.estado}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
            </button>
          );
        })}

        <div className="bg-white rounded-2xl border border-slate-100 px-4 py-4 flex items-start gap-3 mb-2">
          <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" strokeWidth={1.8} />
          <div>
            <p className="font-bold text-slate-900 text-sm">Gestiona tus sociedades</p>
            <p className="text-sm text-slate-500 mt-0.5">Agrega, edita y administra la información de tus sociedades.</p>
          </div>
        </div>
      </div>

      <div className="flex-1" />
      <BottomNav variant="home" onNavigate={onNavigate} />

      {showForm && <SociedadForm onClose={() => setShowForm(false)} onSaved={handleAdded} />}
    </>
  );
}
