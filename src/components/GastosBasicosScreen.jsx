import React, { useEffect, useState } from "react";
import { ArrowLeft, ChevronRight, ChevronDown, Home as HomeIcon } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import BottomNav from "./BottomNav";
import { tiposServicio } from "../lib/servicioTipos";
import { formatCLP, formatFechaCorta, estadoPillClasses } from "../lib/format";
import { esMultiMedidor, medidoresDe, valorTotal, vencimientoProximo, estadoResumen } from "../lib/medidores";

export default function GastosBasicosScreen({ propiedad, backTo, onNavigate, onSelectTipo }) {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState(false);
  const [arriendo, setArriendo] = useState(undefined);

  const fetchServicios = async () => {
    setLoading(true);

    const { data: arriendoData } = await supabase
      .from("arriendos")
      .select("id, contraparte_nombre")
      .eq("propiedad_id", propiedad.id)
      .eq("relacion", "propia")
      .limit(1)
      .maybeSingle();

    if (arriendoData) {
      setArriendo(arriendoData);
      setLoading(false);
      return;
    }
    setArriendo(null);

    const { data, error } = await supabase
      .from("servicios")
      .select("*")
      .eq("propiedad_id", propiedad.id)
      .order("periodo", { ascending: false, nullsFirst: false })
      .order("vencimiento", { ascending: false, nullsFirst: false });
    if (!error) setServicios(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchServicios();
  }, [propiedad.id]);

  const ultimoPorTipo = (tipo) => servicios.find((s) => s.tipo_servicio === tipo);

  const mesActual = new Date().toISOString().slice(0, 7);
  const esPendiente = (estado) => estado === "Pendiente" || estado === "Por vencer" || estado === "Vencido";
  const serviciosVisibles = servicios.filter((s) => !s.periodo || s.periodo.slice(0, 7) <= mesActual);
  const pendientes = serviciosVisibles.flatMap((s) => {
    if (esMultiMedidor(s)) {
      return medidoresDe(s)
        .filter((m) => esPendiente(m.estado))
        .map((m, i) => ({ ...s, ...m, id: `${s.id}-${i}` }));
    }
    return esPendiente(s.estado) ? [s] : [];
  });
  const pendientesPorTipo = tiposServicio
    .map((t) => ({ ...t, cantidad: pendientes.filter((p) => p.tipo_servicio === t.tipo).length }))
    .filter((t) => t.cantidad > 0);

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

        {!loading && arriendo && (
          <div className="bg-white rounded-2xl border border-slate-100 px-4 py-8 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
              <HomeIcon className="w-6 h-6 text-violet-600" strokeWidth={1.8} />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-base">Propiedad arrendada</p>
              <p className="text-sm text-slate-500 mt-1">
                Esta propiedad está arrendada{arriendo.contraparte_nombre ? ` a ${arriendo.contraparte_nombre}` : ""}, por lo que los gastos básicos los paga el arrendatario.
              </p>
            </div>
          </div>
        )}

        {!loading && !arriendo && pendientes.length > 0 && (
          <div className="bg-red-50 rounded-2xl px-4 py-4">
            <button
              onClick={() => setExpandido((v) => !v)}
              className="w-full flex items-start gap-3 text-left"
            >
              <span className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-base shrink-0">!</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 text-base">Pendientes por pagar</p>
                <p className="text-sm text-slate-600 mt-0.5">
                  Tienes {pendientes.length} cuenta{pendientes.length > 1 ? "s" : ""} por pagar en {propiedad.nombre}.
                </p>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-slate-400 shrink-0 mt-1 transition-transform ${expandido ? "rotate-180" : ""}`}
              />
            </button>

            {expandido && (
              <div className="flex flex-col gap-3 mt-3">
                {pendientesPorTipo.map(({ tipo, icon: Icon, bg, fg, cantidad }) => (
                  <button
                    key={tipo}
                    onClick={() => onSelectTipo(tipo)}
                    className="bg-white rounded-xl px-3 py-3 flex items-center gap-3 text-left"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                      <Icon className={`w-5 h-5 ${fg}`} strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm leading-tight">{tipo}</p>
                    </div>
                    <p className="text-sm font-bold text-red-500 shrink-0">
                      {cantidad} cuenta{cantidad > 1 ? "s" : ""}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && !arriendo && tiposServicio.map(({ tipo, icon: Icon, bg, fg }) => {
          const ultimo = ultimoPorTipo(tipo);
          const estado = ultimo ? estadoResumen(ultimo) : null;
          const p = estado ? estadoPillClasses(estado) : null;
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
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${p.bg} ${p.text}`}>{estado}</span>
                  )}
                </div>
                {ultimo ? (
                  <p className="text-sm text-slate-500 mt-1">Vence: {formatFechaCorta(vencimientoProximo(ultimo))}</p>
                ) : (
                  <p className="text-sm text-slate-400 mt-1">Sin registros</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                {ultimo && <p className="text-sm font-bold text-slate-900">{formatCLP(valorTotal(ultimo))}</p>}
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex-1" />
      <BottomNav variant="detail" onNavigate={onNavigate} />
    </>
  );
}
