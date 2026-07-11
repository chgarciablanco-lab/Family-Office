import React, { useEffect, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Scale } from "lucide-react";
import BottomNav from "./BottomNav";
import { fetchInformeMes } from "../lib/informes";
import { formatCLP } from "../lib/format";

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export default function InformesScreen({ backTo, onNavigate, embedded = false }) {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargar = async () => {
    setLoading(true);
    setGrupos(await fetchInformeMes(anio, mes));
    setLoading(false);
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anio, mes]);

  const cambiarMes = (delta) => {
    let m = mes + delta;
    let a = anio;
    if (m > 12) { m = 1; a += 1; }
    if (m < 1) { m = 12; a -= 1; }
    setMes(m);
    setAnio(a);
  };

  const totalGastos = grupos.reduce((sum, g) => sum + g.gastos, 0);
  const totalIngresos = grupos.reduce((sum, g) => sum + g.ingresos, 0);
  const totalNeto = totalIngresos - totalGastos;

  return (
    <>
      {!embedded && (
        <div className="px-5 pt-6 pb-4 flex items-center justify-between">
          <button onClick={() => onNavigate(backTo)} aria-label="Volver">
            <ArrowLeft className="w-6 h-6 text-blue-600" strokeWidth={2} />
          </button>
          <h1 className="text-xl font-bold text-slate-900">Informes</h1>
          <div className="w-6" />
        </div>
      )}

      <div className={`px-5 flex flex-col gap-3 pb-4 ${embedded ? "pt-1" : ""}`}>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3.5 flex items-center justify-between">
          <button onClick={() => cambiarMes(-1)} aria-label="Mes anterior">
            <ChevronLeft className="w-5 h-5 text-slate-500" />
          </button>
          <p className="font-bold text-slate-900 text-sm capitalize">{MESES[mes - 1]} {anio}</p>
          <button onClick={() => cambiarMes(1)} aria-label="Mes siguiente">
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {loading && <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>}

        {!loading && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Total del mes</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center gap-1">
                <TrendingDown className="w-4 h-4 text-red-500" strokeWidth={1.8} />
                <p className="text-[11px] text-slate-500">Gastos</p>
                <p className="text-sm font-bold text-red-600">{formatCLP(totalGastos)}</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <TrendingUp className="w-4 h-4 text-emerald-500" strokeWidth={1.8} />
                <p className="text-[11px] text-slate-500">Ingresos</p>
                <p className="text-sm font-bold text-emerald-600">{formatCLP(totalIngresos)}</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Scale className="w-4 h-4 text-slate-500" strokeWidth={1.8} />
                <p className="text-[11px] text-slate-500">Neto</p>
                <p className={`text-sm font-bold ${totalNeto >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatCLP(totalNeto)}</p>
              </div>
            </div>
          </div>
        )}

        {!loading && grupos.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 px-4 py-8 text-center">
            <p className="text-sm text-slate-500">No hay gastos ni ingresos registrados en {MESES[mes - 1]}.</p>
          </div>
        )}

        {!loading && grupos.length > 0 && (
          <>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">Por sociedad / gestión personal</p>
            {grupos.map((g) => (
              <div key={g.sociedadId ?? "persona"} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3.5">
                <p className="font-bold text-slate-900 text-sm mb-2">{g.nombre}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Gastos</span>
                  <span className="font-semibold text-red-600">{formatCLP(g.gastos)}</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1.5">
                  <span className="text-slate-500">Ingresos</span>
                  <span className="font-semibold text-emerald-600">{formatCLP(g.ingresos)}</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1.5 pt-1.5 border-t border-slate-50">
                  <span className="text-slate-500">Neto</span>
                  <span className={`font-bold ${g.neto >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatCLP(g.neto)}</span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {!embedded && (
        <>
          <div className="flex-1" />
          <BottomNav onNavigate={onNavigate} />
        </>
      )}
    </>
  );
}
