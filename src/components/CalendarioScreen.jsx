import React, { useEffect, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Trash2, Clock } from "lucide-react";
import BottomNav from "./BottomNav";
import ConfirmDialog from "./ConfirmDialog";
import PendienteRow from "./PendienteRow";
import EventoCalendarioForm from "./EventoCalendarioForm";
import { fetchVencimientosMes, fetchEventosMes, eliminarEvento } from "../lib/calendario";

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DIAS_SEMANA = ["L", "M", "M", "J", "V", "S", "D"];

function diasGrid(anio, mes) {
  const primerDia = new Date(anio, mes - 1, 1);
  const totalDias = new Date(anio, mes, 0).getDate();
  const offset = (primerDia.getDay() + 6) % 7;
  const dias = [];
  for (let i = 0; i < offset; i++) dias.push(null);
  for (let d = 1; d <= totalDias; d++) dias.push(d);
  return dias;
}

function colorPunto(items) {
  if (items.some((i) => i.estado === "Vencido" || i.estado === "Vencida")) return "bg-red-500";
  if (items.some((i) => i.estado === "Por vencer")) return "bg-amber-500";
  return "bg-slate-300";
}

export default function CalendarioScreen({ backTo, onNavigate }) {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [diaSeleccionado, setDiaSeleccionado] = useState(hoy.getDate());
  const [vencimientos, setVencimientos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const cargar = async () => {
    setLoading(true);
    const [v, e] = await Promise.all([fetchVencimientosMes(anio, mes), fetchEventosMes(anio, mes)]);
    setVencimientos(v);
    setEventos(e);
    setLoading(false);
  };

  useEffect(() => {
    cargar();
  }, [anio, mes]);

  const cambiarMes = (delta) => {
    let m = mes + delta;
    let a = anio;
    if (m > 12) { m = 1; a += 1; }
    if (m < 1) { m = 12; a -= 1; }
    setMes(m);
    setAnio(a);
    setDiaSeleccionado(null);
  };

  const esMesActual = anio === hoy.getFullYear() && mes === hoy.getMonth() + 1;
  const dias = diasGrid(anio, mes);

  const vencimientosPorDia = (d) => vencimientos.filter((v) => v.dia === d);
  const eventosPorDia = (d) => eventos.filter((e) => e.dia === d);

  const vencimientosDia = diaSeleccionado ? vencimientosPorDia(diaSeleccionado) : [];
  const eventosDia = diaSeleccionado ? eventosPorDia(diaSeleccionado) : [];
  const fechaSeleccionadaStr = diaSeleccionado
    ? `${anio}-${String(mes).padStart(2, "0")}-${String(diaSeleccionado).padStart(2, "0")}`
    : null;

  const handleDeleteEvento = async () => {
    const id = confirmDelete;
    setConfirmDelete(null);
    await eliminarEvento(id);
    cargar();
  };

  return (
    <>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={() => onNavigate(backTo)} aria-label="Volver">
          <ArrowLeft className="w-6 h-6 text-blue-600" strokeWidth={2} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Calendario</h1>
        <div className="w-6" />
      </div>

      <div className="px-5 flex flex-col gap-3 pb-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => cambiarMes(-1)} aria-label="Mes anterior">
              <ChevronLeft className="w-5 h-5 text-slate-500" />
            </button>
            <p className="font-bold text-slate-900 text-sm capitalize">{MESES[mes - 1]} {anio}</p>
            <button onClick={() => cambiarMes(1)} aria-label="Mes siguiente">
              <ChevronRight className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {DIAS_SEMANA.map((d, i) => (
              <p key={i} className="text-center text-[10px] font-bold text-slate-400">{d}</p>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {dias.map((d, i) => {
              if (d === null) return <div key={i} />;
              const vDia = vencimientosPorDia(d);
              const eDia = eventosPorDia(d);
              const esHoy = esMesActual && d === hoy.getDate();
              const seleccionado = d === diaSeleccionado;
              return (
                <button
                  key={i}
                  onClick={() => setDiaSeleccionado(d)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 text-xs font-semibold ${
                    seleccionado ? "bg-violet-600 text-white" : esHoy ? "bg-violet-50 text-violet-700" : "text-slate-700"
                  }`}
                >
                  <span>{d}</span>
                  <span className="flex items-center gap-0.5 h-1">
                    {vDia.length > 0 && (
                      <span className={`w-1 h-1 rounded-full ${seleccionado ? "bg-white" : colorPunto(vDia)}`} />
                    )}
                    {eDia.length > 0 && (
                      <span className={`w-1 h-1 rounded-full ${seleccionado ? "bg-white" : "bg-violet-500"}`} />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {loading && <p className="text-sm text-slate-400 text-center py-4">Cargando...</p>}

        {!loading && diaSeleccionado && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3.5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-bold text-slate-900">{diaSeleccionado} de {MESES[mes - 1]}</p>
              <button
                onClick={() => setShowForm(true)}
                className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center"
                aria-label="Agregar tarea o reunión"
              >
                <Plus className="w-4 h-4 text-white" strokeWidth={2.4} />
              </button>
            </div>

            {vencimientosDia.length === 0 && eventosDia.length === 0 && (
              <p className="text-xs text-slate-400 mt-2">Sin vencimientos ni tareas este día.</p>
            )}

            {eventosDia.length > 0 && (
              <div className="flex flex-col gap-2 mt-2">
                {eventosDia.map((ev) => (
                  <div key={ev.id} className="flex items-center gap-2.5 bg-violet-50 rounded-xl px-3 py-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-violet-600" strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{ev.titulo}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {ev.hora ? ev.hora.slice(0, 5) : "Todo el día"}{ev.descripcion ? ` · ${ev.descripcion}` : ""}
                      </p>
                    </div>
                    <button onClick={() => setConfirmDelete(ev.id)} aria-label="Eliminar tarea" className="shrink-0">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {vencimientosDia.length > 0 && (
              <div className="flex flex-col gap-2.5 mt-2 pt-2 border-t border-slate-100">
                {vencimientosDia.map((item, i) => (
                  <PendienteRow key={i} item={item} onDone={cargar} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1" />
      <BottomNav variant="detail" onNavigate={onNavigate} />

      {showForm && fechaSeleccionadaStr && (
        <EventoCalendarioForm
          fecha={fechaSeleccionadaStr}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); cargar(); }}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="¿Eliminar esta tarea?"
          message="Esta acción no se puede deshacer."
          onConfirm={handleDeleteEvento}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </>
  );
}
