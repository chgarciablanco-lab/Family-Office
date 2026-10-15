import React, { useEffect, useMemo, useState } from "react";
import { X, ArrowLeft, Folder, ChevronRight, MapPin, Check } from "lucide-react";
import { fetchCarpetas } from "../lib/documentos";
import { fetchDestinos } from "../lib/cargaDocumento";

// Elegir carpeta de destino para mover. Con `permitirOtroLugar`, además se puede cambiar de
// lugar (otra propiedad, sociedad, trabajador, auto o Gestión familiar); onSeleccionar recibe
// (carpetaId, lugar) donde lugar = { tipo, id, nombre }.
export default function SeleccionarCarpetaModal({
  entidadTipo, entidadId, entidadNombre, excluir, onSeleccionar, onClose, permitirOtroLugar = false,
}) {
  const [lugar, setLugar] = useState({ tipo: entidadTipo, id: entidadId, nombre: entidadNombre });
  const [eligiendoLugar, setEligiendoLugar] = useState(false);
  const [destinos, setDestinos] = useState(null);
  const [path, setPath] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const carpetaActual = path[path.length - 1] || null;
  const mismoLugar = lugar.tipo === entidadTipo && lugar.id === entidadId;

  useEffect(() => {
    setLoading(true);
    fetchCarpetas(lugar.tipo, lugar.id, carpetaActual?.id).then((data) => {
      setItems(excluir && mismoLugar ? data.filter((c) => !excluir.has(c.id)) : data);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carpetaActual?.id, lugar.tipo, lugar.id]);

  useEffect(() => {
    if (eligiendoLugar && !destinos) fetchDestinos().then(setDestinos);
  }, [eligiendoLugar, destinos]);

  const grupos = useMemo(() => {
    const g = {};
    (destinos || []).forEach((d) => { (g[d.grupo] = g[d.grupo] || []).push(d); });
    return Object.entries(g);
  }, [destinos]);

  const titulo = eligiendoLugar ? "Mover a otro lugar" : carpetaActual?.nombre || lugar.nombre;

  const elegirLugar = (d) => {
    setLugar({ tipo: d.tipo, id: d.id, nombre: d.nombre });
    setPath([]);
    setEligiendoLugar(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl max-h-[80vh] flex flex-col">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-slate-100 shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {(path.length > 0 || eligiendoLugar) && (
              <button
                onClick={() => (eligiendoLugar ? setEligiendoLugar(false) : setPath((p) => p.slice(0, -1)))}
                aria-label="Volver"
                className="shrink-0"
              >
                <ArrowLeft className="w-5 h-5 text-blue-600" strokeWidth={2} />
              </button>
            )}
            <h2 className="text-base font-bold text-slate-900 truncate">{titulo}</h2>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="shrink-0">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {eligiendoLugar ? (
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-1.5">
            {!destinos && <p className="text-sm text-slate-400 text-center py-6">Cargando...</p>}
            {grupos.map(([grupo, ds]) => (
              <div key={grupo} className="flex flex-col gap-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mt-2 px-1">{grupo}</p>
                {ds.map((d) => {
                  const actual = d.tipo === lugar.tipo && d.id === lugar.id;
                  return (
                    <button
                      key={`${d.tipo}:${d.id}`}
                      onClick={() => elegirLugar(d)}
                      className={`w-full rounded-xl px-3.5 py-2.5 flex items-center gap-3 text-left ${actual ? "bg-violet-50" : "bg-slate-50"}`}
                    >
                      <MapPin className="w-4 h-4 text-violet-600 shrink-0" strokeWidth={1.8} />
                      <p className="flex-1 min-w-0 text-sm font-semibold text-slate-900 truncate">{d.nombre}</p>
                      {actual && <Check className="w-4 h-4 text-violet-600 shrink-0" strokeWidth={2.4} />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2">
            {permitirOtroLugar && path.length === 0 && (
              <button
                onClick={() => setEligiendoLugar(true)}
                className="w-full border border-dashed border-violet-300 rounded-xl px-3.5 py-2.5 flex items-center gap-3 text-left mb-1"
              >
                <MapPin className="w-4 h-4 text-violet-600 shrink-0" strokeWidth={1.8} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-slate-400">Lugar</p>
                  <p className="text-sm font-semibold text-slate-900 truncate">{lugar.nombre}</p>
                </div>
                <span className="text-xs font-semibold text-violet-600 shrink-0">Cambiar</span>
              </button>
            )}
            {loading && <p className="text-sm text-slate-400 text-center py-6">Cargando...</p>}
            {!loading && items.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">No hay subcarpetas acá.</p>
            )}
            {!loading && items.map((c) => (
              <button
                key={c.id}
                onClick={() => setPath((p) => [...p, { id: c.id, nombre: c.nombre }])}
                className="w-full bg-slate-50 rounded-xl px-3.5 py-3 flex items-center gap-3 text-left"
              >
                <Folder className="w-4 h-4 text-violet-600 shrink-0" strokeWidth={1.8} />
                <p className="flex-1 min-w-0 text-sm font-semibold text-slate-900 truncate">{c.nombre}</p>
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
              </button>
            ))}
          </div>
        )}

        {!eligiendoLugar && (
          <div className="px-5 py-4 border-t border-slate-100 shrink-0">
            <button
              onClick={() => onSeleccionar(carpetaActual?.id || null, lugar)}
              className="w-full bg-violet-600 text-white font-semibold text-sm rounded-xl py-3 truncate"
            >
              Mover aquí — {carpetaActual ? `${lugar.nombre} › ${carpetaActual.nombre}` : lugar.nombre}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
