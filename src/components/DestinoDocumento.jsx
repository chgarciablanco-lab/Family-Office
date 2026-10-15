import React, { useEffect, useId, useMemo, useState } from "react";
import { fetchCarpetas } from "../lib/documentos";

const inputCls =
  "w-full h-9 border border-slate-200 rounded-lg px-2.5 text-sm text-slate-900 bg-white outline-none focus:border-violet-400";
const labelCls = "text-[11px] font-semibold text-slate-500 mb-0.5 block";

export const claveDestino = (d) => (d ? `${d.tipo}:${d.id}` : "");

// Elegir dónde guardar un documento: entidad (opcional) + carpeta (con las existentes como
// sugerencia; si se escribe una nueva, se crea al guardar) + nombre del archivo (opcional).
export default function DestinoDocumento({
  destinos, // si viene, se muestra el selector de "Guardar en"
  destinoClave,
  onDestino,
  carpeta,
  onCarpeta,
  nombre, // si viene (string), se muestra el campo de nombre
  onNombre,
  carpetasDe, // { tipo, id } para sugerir carpetas cuando no hay selector de destino
}) {
  const listId = useId();
  const [carpetas, setCarpetas] = useState([]);

  const destino = destinos?.find((d) => claveDestino(d) === destinoClave) || carpetasDe || null;

  useEffect(() => {
    let vigente = true;
    if (!destino) return undefined;
    fetchCarpetas(destino.tipo, destino.id, null).then((cs) => { if (vigente) setCarpetas(cs); });
    return () => { vigente = false; };
  }, [destino?.tipo, destino?.id]);

  const grupos = useMemo(() => {
    const g = {};
    (destinos || []).forEach((d) => { (g[d.grupo] = g[d.grupo] || []).push(d); });
    return Object.entries(g);
  }, [destinos]);

  const existe = carpetas.some((c) => c.nombre.toLowerCase() === (carpeta || "").trim().toLowerCase());

  return (
    <div className="flex flex-col gap-3">
      {destinos && (
        <div>
          <label className={labelCls}>Guardar en</label>
          <select className={inputCls} value={destinoClave} onChange={(e) => onDestino(e.target.value)}>
            {grupos.map(([grupo, ds]) => (
              <optgroup key={grupo} label={grupo}>
                {ds.map((d) => (
                  <option key={claveDestino(d)} value={claveDestino(d)}>{d.nombre}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className={labelCls}>Carpeta</label>
        <input
          className={inputCls}
          list={listId}
          value={carpeta}
          onChange={(e) => onCarpeta(e.target.value)}
          placeholder="Sin carpeta (en la raíz)"
        />
        <datalist id={listId}>
          {carpetas.map((c) => <option key={c.id} value={c.nombre} />)}
        </datalist>
        {carpetas.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {carpetas.slice(0, 8).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onCarpeta(c.nombre)}
                className={`text-[11px] font-semibold rounded-full px-2.5 py-1 border ${
                  c.nombre.toLowerCase() === (carpeta || "").trim().toLowerCase()
                    ? "bg-violet-600 border-violet-600 text-white"
                    : "bg-white border-slate-200 text-slate-600"
                }`}
              >
                {c.nombre}
              </button>
            ))}
          </div>
        )}
        {(carpeta || "").trim() && !existe && destino && (
          <p className="text-[11px] text-slate-400 mt-1">Se creará la carpeta "{carpeta.trim()}".</p>
        )}
      </div>
      {typeof nombre === "string" && (
        <div>
          <label className={labelCls}>Nombre del archivo</label>
          <input className={inputCls} value={nombre} onChange={(e) => onNombre(e.target.value)} />
        </div>
      )}
    </div>
  );
}
