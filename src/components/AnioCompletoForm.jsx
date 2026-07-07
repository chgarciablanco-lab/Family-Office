import React, { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { Field, inputClass } from "./TramiteSection";
import { companiasLuz } from "../lib/companiasChile";

const etiquetas = {
  Luz: { compania: "Compañía", numero: "N° de cliente", placeholder: "Enel, CGE..." },
  Gas: { compania: "Compañía", numero: "N° de cliente", placeholder: "Metrogas, Lipigas..." },
  Agua: { compania: "Compañía", numero: "N° de cliente", placeholder: "Aguas Andinas..." },
  "Gastos comunes": { compania: "Administración / edificio", numero: "N° de unidad", placeholder: "Nombre del edificio" },
  Seguros: { compania: "Compañía aseguradora", numero: "N° de póliza", placeholder: "Consorcio, HDI..." },
};

function ultimoDiaMes(anio, mes) {
  return new Date(anio, mes, 0).getDate();
}

function generarFilas(anio, propiedadId, sociedadId, tipoServicio, compania, numeroCliente, diaVencimiento) {
  return Array.from({ length: 12 }, (_, i) => {
    const mesNum = i + 1;
    const mes = String(mesNum).padStart(2, "0");
    const dia = String(Math.min(diaVencimiento, ultimoDiaMes(anio, mesNum))).padStart(2, "0");
    return {
      propiedad_id: propiedadId,
      sociedad_id: sociedadId,
      tipo_servicio: tipoServicio,
      compania: compania || null,
      numero_cliente: numeroCliente || null,
      periodo: `${anio}-${mes}-01`,
      vencimiento: `${anio}-${mes}-${dia}`,
      estado: "Pendiente",
    };
  });
}

export default function AnioCompletoForm({ propiedad, sociedadId, tipoServicio, esAdicional, onClose, onGenerated }) {
  const info = etiquetas[tipoServicio] || etiquetas.Luz;
  const [compania, setCompania] = useState("");
  const [companiaOtra, setCompaniaOtra] = useState(false);
  const [numeroCliente, setNumeroCliente] = useState("");
  const [diaVencimiento, setDiaVencimiento] = useState("5");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const anio = new Date().getFullYear();
    const dia = Math.min(31, Math.max(1, parseInt(diaVencimiento, 10) || 5));
    const filas = generarFilas(anio, propiedad.id, sociedadId, tipoServicio, compania, numeroCliente, dia);
    const { error } = await supabase.from("servicios").insert(filas);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    onGenerated();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-5 pt-5 pb-3 flex items-center justify-between border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">
            {esAdicional ? `Agregar otro N° de cliente de ${tipoServicio.toLowerCase()}` : `Configurar ${tipoServicio.toLowerCase()}`}
          </h2>
          <button onClick={onClose} aria-label="Cerrar">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="px-5 pt-4">
          <div className="bg-slate-50 rounded-xl px-3.5 py-3">
            <p className="text-sm font-bold text-slate-900">{propiedad.nombre}</p>
            <p className="text-xs text-slate-500 mt-0.5">{propiedad.direccion}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" className="p-5 flex flex-col gap-4">
          <p className="text-sm text-slate-500 -mt-1">
            {esAdicional
              ? "Esta propiedad tiene más de un número de cliente (por ejemplo, dos medidores). Ingresa los datos del otro número y se generarán sus propios 12 meses del año."
              : "Ingresa estos datos una sola vez: se aplicarán automáticamente a los 12 meses del año. Después solo edita el valor, la fecha de pago y el estado de cada mes."}
          </p>

          <Field label={info.compania}>
            {tipoServicio === "Luz" ? (
              <>
                <select
                  className={inputClass}
                  value={companiaOtra ? "Otra" : compania}
                  onChange={(e) => {
                    if (e.target.value === "Otra") {
                      setCompaniaOtra(true);
                      setCompania("");
                    } else {
                      setCompaniaOtra(false);
                      setCompania(e.target.value);
                    }
                  }}
                >
                  <option value="" disabled>Selecciona una compañía</option>
                  {companiasLuz.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="Otra">Otra</option>
                </select>
                {companiaOtra && (
                  <input
                    autoComplete="off"
                    className={`${inputClass} mt-2`}
                    value={compania}
                    onChange={(e) => setCompania(e.target.value)}
                    placeholder="Nombre de la compañía"
                  />
                )}
              </>
            ) : (
              <input
                autoComplete="off"
                className={inputClass}
                value={compania}
                onChange={(e) => setCompania(e.target.value)}
                placeholder={info.placeholder}
              />
            )}
          </Field>

          <Field label={info.numero}>
            <input
              autoComplete="off"
              className={inputClass}
              value={numeroCliente}
              onChange={(e) => setNumeroCliente(e.target.value)}
            />
          </Field>

          <Field label="Día de vencimiento (1-31)">
            <input
              autoComplete="off"
              required
              type="number"
              min={1}
              max={31}
              className={inputClass}
              value={diaVencimiento}
              onChange={(e) => setDiaVencimiento(e.target.value)}
              placeholder="Ej. 10"
            />
            <p className="text-xs text-slate-400 mt-1">
              Se usará este día en los 12 meses (se ajusta automáticamente en meses más cortos).
            </p>
          </Field>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-violet-600 text-white font-semibold text-sm rounded-xl py-3 disabled:opacity-60 mt-1"
          >
            {saving ? "Generando..." : "Generar los 12 meses del año"}
          </button>
        </form>
      </div>
    </div>
  );
}
