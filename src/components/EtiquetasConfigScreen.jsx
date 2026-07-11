import React, { useEffect, useState } from "react";
import { ArrowLeft, Plus, ChevronRight, Info } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import EtiquetaConfigForm from "./EtiquetaConfigForm";
import BottomNav from "./BottomNav";
import { colorClasses } from "../lib/format";
import { ICONOS_ETIQUETA } from "../lib/etiquetas";
import { SECCIONES_FIJAS } from "../lib/seccionesFijas";
import { tiposServicio } from "../lib/servicioTipos";

export default function EtiquetasConfigScreen({ backTo = "persona", onNavigate }) {
  const [etiquetas, setEtiquetas] = useState([]);
  const [visibilidad, setVisibilidad] = useState({});
  const [visibilidadServicios, setVisibilidadServicios] = useState({});
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

  const fetchVisibilidad = async () => {
    const { data, error } = await supabase.from("secciones_config").select("*");
    if (error) return;
    const mapa = {};
    (data || []).forEach((s) => { mapa[s.modulo] = s.visible; });
    setVisibilidad(mapa);
  };

  const fetchVisibilidadServicios = async () => {
    const { data, error } = await supabase.from("servicios_config").select("*");
    if (error) return;
    const mapa = {};
    (data || []).forEach((s) => { mapa[s.tipo_servicio] = s.visible; });
    setVisibilidadServicios(mapa);
  };

  useEffect(() => {
    fetchEtiquetas();
    fetchVisibilidad();
    fetchVisibilidadServicios();
  }, []);

  const toggleSeccionFija = async (modulo) => {
    const actual = visibilidad[modulo] !== false;
    setVisibilidad((prev) => ({ ...prev, [modulo]: !actual }));
    await supabase.from("secciones_config").update({ visible: !actual }).eq("modulo", modulo);
  };

  const toggleServicio = async (tipo) => {
    const actual = visibilidadServicios[tipo] !== false;
    setVisibilidadServicios((prev) => ({ ...prev, [tipo]: !actual }));
    await supabase.from("servicios_config").update({ visible: !actual }).eq("tipo_servicio", tipo);
  };

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
        <h1 className="text-xl font-bold text-slate-900">Configurar pantalla</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center"
          aria-label="Agregar etiqueta"
        >
          <Plus className="w-5 h-5 text-white" strokeWidth={2.4} />
        </button>
      </div>

      <div className="px-5 flex flex-col gap-3 pb-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">Secciones predeterminadas</p>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {SECCIONES_FIJAS.map((sec) => {
            const visible = visibilidad[sec.modulo] !== false;
            return (
              <div key={sec.modulo} className="flex items-center gap-3 px-4 py-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${sec.bg}`}>
                  <sec.icon className={`w-5 h-5 ${sec.fg}`} strokeWidth={1.8} />
                </div>
                <p className="flex-1 font-semibold text-slate-800 text-sm">{sec.title}</p>
                <button
                  type="button"
                  onClick={() => toggleSeccionFija(sec.modulo)}
                  aria-label={visible ? `Ocultar ${sec.title}` : `Mostrar ${sec.title}`}
                  className={`shrink-0 w-11 h-6 p-0 border-0 appearance-none rounded-full relative transition-colors ${visible ? "bg-emerald-500" : "bg-slate-200"}`}
                  style={{ WebkitAppearance: "none" }}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${visible ? "translate-x-5" : "translate-x-0"}`}
                  />
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-2">Gastos básicos de propiedades</p>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {tiposServicio.map((serv) => {
            const visible = visibilidadServicios[serv.tipo] !== false;
            return (
              <div key={serv.tipo} className="flex items-center gap-3 px-4 py-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${serv.bg}`}>
                  <serv.icon className={`w-5 h-5 ${serv.fg}`} strokeWidth={1.8} />
                </div>
                <p className="flex-1 font-semibold text-slate-800 text-sm">{serv.tipo}</p>
                <button
                  type="button"
                  onClick={() => toggleServicio(serv.tipo)}
                  aria-label={visible ? `Ocultar ${serv.tipo}` : `Mostrar ${serv.tipo}`}
                  className={`shrink-0 w-11 h-6 p-0 border-0 appearance-none rounded-full relative transition-colors ${visible ? "bg-emerald-500" : "bg-slate-200"}`}
                  style={{ WebkitAppearance: "none" }}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${visible ? "translate-x-5" : "translate-x-0"}`}
                  />
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-2">Etiquetas personalizadas</p>
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
            <p className="font-bold text-slate-900 text-sm">Se aplica para todos</p>
            <p className="text-sm text-slate-500 mt-0.5">
              Ocultar una sección, un gasto básico o crear una etiqueta nueva se refleja tanto en Gestión familiar como en Mis gastos personales de cada usuario (incluyendo dentro de Propiedades → Gastos básicos). Ocultar no borra la información existente.
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
