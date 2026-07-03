import React, { useEffect, useState } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import BottomNav from "./BottomNav";
import { tiposServicio } from "../lib/servicioTipos";
import { formatCLP, formatFechaCorta, estadoPillClasses } from "../lib/format";

export default function GastosBasicosScreen({ propiedad, backTo, onNavigate, onSelectTipo }) {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchServicios = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("servicios")
      .select("*")
      .eq("propiedad_id", propiedad.id)
      .order("vencimiento", { ascending: false });
    if (!error) setServicios(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchServicios();
  }, [propiedad.id]);

  const ultimoPorTipo = (tipo) => servicios.find((s) => s.tipo_servicio === tipo);
  const pendientes = servicios.filter((s) => s.estado === "Pendiente" || s.estado === "Por vencer");

  return (
    <>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={() => onNavigate(backTo)} aria-label="Volver">
          <ArrowLeft className="w-6 h-6 text-blue-600" strokeWidth={2} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Gastos básicos</h1>
        <div className="w-6" />
      </div>

      <div className="px-5 flex flex-col gap-3 pb-4">
        <div className="flex items-center justify-between mt-1">
          <p className="font-bold text-slate-900 text-base">Gastos de {propiedad.nombre}</p>
        </div>

        {loading && <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>}

        {!loading && tiposServicio.map(({ tipo, icon: Icon, bg, fg }) => {
          const ultimo = ultimoPorTipo(tipo);
          const p = ultimo ? estadoPillClasses(ultimo.estado) : null;
          return (
            <button
              key={tipo}
              onClick={() => onSelectTipo(tipo)}
              className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                <Icon className={`w-6 h-6 ${fg}`} strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-slate-900 text-base leading-tight">{tipo}</p>
                  {ultimo && (
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${p.bg} ${p.text}`}>{ultimo.estado}</span>
                  )}
                </div>
                {ultimo ? (
                  <p className="text-sm text-slate-500 mt-1">Vence: {formatFechaCorta(ultimo.vencimiento)}</p>
                ) : (
                  <p className="text-sm text-slate-400 mt-1">Sin registros</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                {ultimo && <p className="text-sm font-bold text-slate-900">{formatCLP(ultimo.valor)}</p>}
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
                const tipoInfo = tiposServicio.find((t) => t.tipo === s.tipo_servicio) || tiposServicio[0];
                return (
                  <button
                    key={s.id}
                    onClick={() => onSelectTipo(s.tipo_servicio)}
                    className="bg-white rounded-xl px-3 py-3 flex items-center gap-3 text-left"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tipoInfo.bg}`}>
                      <tipoInfo.icon className={`w-5 h-5 ${tipoInfo.fg}`} strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm leading-tight">{s.tipo_servicio}</p>
                      <p className="text-xs text-red-500 font-medium mt-0.5">Vence: {formatFechaCorta(s.vencimiento)}</p>
                    </div>
                    <p className="text-sm font-bold text-slate-900 shrink-0">{formatCLP(s.valor)}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1" />
      <BottomNav variant="detail" onNavigate={onNavigate} />
    </>
  );
}
