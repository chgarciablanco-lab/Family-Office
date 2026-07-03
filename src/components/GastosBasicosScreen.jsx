import React, { useEffect, useState, useMemo } from "react";
import {
  ArrowLeft, Plus, Lightbulb, Droplet, Flame, Wifi, Shield, ShieldCheck,
  ChevronRight, Home as HomeIcon,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import ServicioForm from "./ServicioForm";
import BottomNav from "./BottomNav";
import { formatFechaCorta, estadoPillClasses } from "../lib/format";

const iconosServicio = {
  Luz: { icon: Lightbulb, bg: "bg-amber-100", fg: "text-amber-500" },
  Agua: { icon: Droplet, bg: "bg-blue-100", fg: "text-blue-500" },
  Gas: { icon: Flame, bg: "bg-orange-100", fg: "text-orange-500" },
  Internet: { icon: Wifi, bg: "bg-teal-100", fg: "text-teal-600" },
  "Gastos comunes": { icon: Shield, bg: "bg-emerald-100", fg: "text-emerald-600" },
  Seguros: { icon: ShieldCheck, bg: "bg-blue-100", fg: "text-blue-500" },
};

export default function GastosBasicosScreen({ sociedad, backTo, onNavigate }) {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [propiedadFiltro, setPropiedadFiltro] = useState("todas");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchServicios = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("servicios")
      .select("*")
      .eq("sociedad_id", sociedad.id)
      .order("vencimiento");
    if (!error) setServicios(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchServicios();
  }, [sociedad.id]);

  const propiedades = useMemo(() => {
    const nombres = [...new Set(servicios.map((s) => s.propiedad))];
    return nombres;
  }, [servicios]);

  const filtrados = useMemo(() => {
    if (propiedadFiltro === "todas") return servicios;
    return servicios.filter((s) => s.propiedad === propiedadFiltro);
  }, [servicios, propiedadFiltro]);

  const pendientes = filtrados.filter((s) => s.estado === "Pendiente" || s.estado === "Por vencer");

  const handleSaved = () => {
    setShowForm(false);
    setEditing(null);
    fetchServicios();
  };

  return (
    <>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={() => onNavigate(backTo)} aria-label="Volver">
          <ArrowLeft className="w-6 h-6 text-blue-600" strokeWidth={2} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Gastos básicos</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center"
          aria-label="Agregar servicio"
        >
          <Plus className="w-5 h-5 text-white" strokeWidth={2.4} />
        </button>
      </div>

      <div className="px-5 flex flex-col gap-3 pb-4">
        {propiedades.length > 0 && (
          <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm p-2 flex items-start gap-1 overflow-x-auto">
            <button
              onClick={() => setPropiedadFiltro("todas")}
              className={`shrink-0 w-[74px] flex flex-col items-center text-center gap-1.5 rounded-xl px-1.5 py-2 border-2 ${
                propiedadFiltro === "todas" ? "border-violet-500" : "border-transparent"
              }`}
            >
              <div className="w-11 h-11 rounded-full flex items-center justify-center bg-violet-100">
                <HomeIcon className="w-5 h-5 text-violet-600" strokeWidth={1.8} />
              </div>
              <p className="text-xs font-bold text-slate-900 leading-tight">Todas</p>
            </button>
            {propiedades.map((nombre) => (
              <button
                key={nombre}
                onClick={() => setPropiedadFiltro(nombre)}
                className={`shrink-0 w-[74px] flex flex-col items-center text-center gap-1.5 rounded-xl px-1.5 py-2 border-2 ${
                  propiedadFiltro === nombre ? "border-violet-500" : "border-transparent"
                }`}
              >
                <div className="w-11 h-11 rounded-full flex items-center justify-center bg-slate-100">
                  <HomeIcon className="w-5 h-5 text-slate-500" strokeWidth={1.8} />
                </div>
                <p className="text-xs font-bold text-slate-900 leading-tight">{nombre}</p>
              </button>
            ))}
          </div>
        )}

        <p className="font-bold text-slate-900 text-base mt-1">Servicios</p>

        {loading && <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>}

        {!loading && filtrados.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 px-4 py-6 text-center">
            <p className="text-sm text-slate-500">No hay servicios registrados para esta propiedad.</p>
          </div>
        )}

        {filtrados.map((s) => {
          const iconInfo = iconosServicio[s.tipo_servicio] || iconosServicio.Luz;
          const p = estadoPillClasses(s.estado);
          return (
            <button
              key={s.id}
              onClick={() => { setEditing(s); setShowForm(true); }}
              className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${iconInfo.bg}`}>
                <iconInfo.icon className={`w-6 h-6 ${iconInfo.fg}`} strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 text-base leading-tight">{s.tipo_servicio}</p>
                <p className="text-sm text-slate-500 mt-0.5">{s.propiedad}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${p.bg} ${p.text}`}>{s.estado}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <p className="text-sm text-slate-500 whitespace-nowrap">Vence: {formatFechaCorta(s.vencimiento)}</p>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </div>
            </button>
          );
        })}

        {pendientes.length > 0 && (
          <div className="bg-red-50 rounded-2xl px-4 py-4 mt-1">
            <div className="flex items-start gap-3">
              <span className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-base shrink-0">!</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 text-base">Pendientes por pagar</p>
                <p className="text-sm text-slate-600 mt-0.5">
                  Tienes {pendientes.length} cuenta{pendientes.length > 1 ? "s" : ""} por pagar.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-3">
              {pendientes.map((s) => {
                const iconInfo = iconosServicio[s.tipo_servicio] || iconosServicio.Luz;
                return (
                  <div key={s.id} className="bg-white rounded-xl px-3 py-3 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconInfo.bg}`}>
                      <iconInfo.icon className={`w-5 h-5 ${iconInfo.fg}`} strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm leading-tight">{s.tipo_servicio} - {s.propiedad}</p>
                      <p className="text-xs text-red-500 font-medium mt-0.5">Vence: {formatFechaCorta(s.vencimiento)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1" />
      <BottomNav variant="detail" onNavigate={onNavigate} />

      {showForm && (
        <ServicioForm
          servicio={editing}
          sociedadId={sociedad.id}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
