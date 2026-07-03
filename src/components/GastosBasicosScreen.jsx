import React, { useEffect, useState } from "react";
import {
  ArrowLeft, Plus, Lightbulb, Droplet, Flame, Wifi, Shield, ShieldCheck,
  ChevronRight,
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

export default function GastosBasicosScreen({ propiedad, backTo, onNavigate }) {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchServicios = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("servicios")
      .select("*")
      .eq("propiedad_id", propiedad.id)
      .order("vencimiento");
    if (!error) setServicios(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchServicios();
  }, [propiedad.id]);

  const pendientes = servicios.filter((s) => s.estado === "Pendiente" || s.estado === "Por vencer");

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
        <div className="flex items-center justify-between mt-1">
          <p className="font-bold text-slate-900 text-base">Servicios de {propiedad.nombre}</p>
          <p className="text-sm text-slate-500">{servicios.length} servicios</p>
        </div>

        {loading && <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>}

        {!loading && servicios.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 px-4 py-6 text-center">
            <p className="text-sm text-slate-500">No hay servicios registrados para esta propiedad.</p>
          </div>
        )}

        {servicios.map((s) => {
          const iconInfo = iconosServicio[s.tipo_servicio] || iconosServicio.Luz;
          const p = estadoPillClasses(s.estado);
          return (
            <button
              key={s.id}
              onClick={() => { setEditing(s); setShowForm(true); }}
              className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconInfo.bg}`}>
                <iconInfo.icon className={`w-6 h-6 ${iconInfo.fg}`} strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 text-base leading-tight">{s.tipo_servicio}</p>
                {s.compania && <p className="text-sm text-slate-500 mt-0.5">{s.compania}</p>}
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
                  Tienes {pendientes.length} cuenta{pendientes.length > 1 ? "s" : ""} por pagar en {propiedad.nombre}.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-3">
              {pendientes.map((s) => {
                const iconInfo = iconosServicio[s.tipo_servicio] || iconosServicio.Luz;
                return (
                  <div key={s.id} className="bg-white rounded-xl px-3 py-3 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconInfo.bg}`}>
                      <iconInfo.icon className={`w-5 h-5 ${iconInfo.fg}`} strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm leading-tight">{s.tipo_servicio}</p>
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
          sociedadId={propiedad.sociedad_id}
          propiedadId={propiedad.id}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
