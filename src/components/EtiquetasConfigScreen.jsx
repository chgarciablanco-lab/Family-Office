import React, { useEffect, useState } from "react";
import { ArrowLeft, Plus, ChevronRight, Info } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import EtiquetaConfigForm from "./EtiquetaConfigForm";
import BottomNav from "./BottomNav";
import { colorClasses } from "../lib/format";
import { ICONOS_ETIQUETA } from "../lib/etiquetas";

export default function EtiquetasConfigScreen({ backTo = "persona", onNavigate }) {
  const [etiquetas, setEtiquetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchEtiquetas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("etiquetas_gasto")
      .select("*")
      .order("orden", { ascending: true })
      .order("created_at", { ascending: true });
    if (!error) setEtiquetas(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchEtiquetas();
  }, []);

  const handleSaved = () => {
    setShowForm(false);
    setEditing(null);
    fetchEtiquetas();
  };

  return (
    <>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={() => onNavigate(backTo)} aria-label="Volver">
          <ArrowLeft className="w-6 h-6 text-blue-600" strokeWidth={2} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Configurar etiquetas</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center"
          aria-label="Agregar etiqueta"
        >
          <Plus className="w-5 h-5 text-white" strokeWidth={2.4} />
        </button>
      </div>

      <div className="px-5 flex flex-col gap-3 pb-4">
        {loading && <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>}

        {!loading && etiquetas.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 px-4 py-8 flex flex-col items-center text-center gap-3">
            <p className="text-sm font-semibold text-slate-700">Aún no hay etiquetas personalizadas</p>
            <p className="text-sm text-slate-500 mt-0.5">
              Toca el botón + para crear categorías nuevas, además de Propiedades, Autos, Trabajadores, etc.
            </p>
          </div>
        )}

        {etiquetas.map((et) => {
          const Icon = ICONOS_ETIQUETA[et.icono] || ICONOS_ETIQUETA.Tag;
          const c = colorClasses[et.color] || colorClasses.slate;
          return (
            <button
              key={et.id}
              onClick={() => { setEditing(et); setShowForm(true); }}
              className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${c.bg}`}>
                <Icon className={`w-6 h-6 ${c.fg}`} strokeWidth={1.8} />
              </div>
              <p className="flex-1 font-bold text-slate-900 text-base leading-tight">{et.nombre}</p>
              <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
            </button>
          );
        })}

        <div className="bg-white rounded-2xl border border-slate-100 px-4 py-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" strokeWidth={1.8} />
          <div>
            <p className="font-bold text-slate-900 text-sm">Etiquetas para todos</p>
            <p className="text-sm text-slate-500 mt-0.5">
              Las etiquetas que crees aquí aparecerán tanto en Gestión familiar como en Mis gastos personales de cada usuario.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1" />
      <BottomNav variant="home" onNavigate={onNavigate} />

      {showForm && (
        <EtiquetaConfigForm etiqueta={editing} onClose={() => { setShowForm(false); setEditing(null); }} onSaved={handleSaved} />
      )}
    </>
  );
}
