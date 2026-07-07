import React, { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
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

function medidorVacio() {
  return { compania: "", companiaOtra: false, numeroCliente: "", diaVencimiento: "5" };
}

function ultimoDiaMes(anio, mes) {
  return new Date(anio, mes, 0).getDate();
}

function generarFilasMedidor(anio, propiedadId, sociedadId, tipoServicio, medidor) {
  const dia = Math.min(31, Math.max(1, parseInt(medidor.diaVencimiento, 10) || 5));
  return Array.from({ length: 12 }, (_, i) => {
    const mesNum = i + 1;
    const mes = String(mesNum).padStart(2, "0");
    const diaMes = String(Math.min(dia, ultimoDiaMes(anio, mesNum))).padStart(2, "0");
    return {
      propiedad_id: propiedadId,
      sociedad_id: sociedadId,
      tipo_servicio: tipoServicio,
      compania: medidor.compania || null,
      numero_cliente: medidor.numeroCliente || null,
      periodo: `${anio}-${mes}-01`,
      vencimiento: `${anio}-${mes}-${diaMes}`,
      estado: "Pendiente",
    };
  });
}

export default function AnioCompletoForm({ propiedad, sociedadId, tipoServicio, esAdicional, onClose, onGenerated }) {
  const info = etiquetas[tipoServicio] || etiquetas.Luz;
  const [medidores, setMedidores] = useState([medidorVacio()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const actualizarMedidor = (idx, cambios) => {
    setMedidores((prev) => prev.map((m, i) => (i === idx ? { ...m, ...cambios } : m)));
  };

  const agregarMedidor = () => setMedidores((prev) => [...prev, medidorVacio()]);
  const quitarMedidor = (idx) => setMedidores((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const anio = new Date().getFullYear();
    const filas = medidores.flatMap((m) =>
      generarFilasMedidor(anio, propiedad.id, sociedadId, tipoServicio, m)
    );
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
            {esAdicional ? `Agregar N° de cliente de ${tipoServicio.toLowerCase()}` : `Configurar ${tipoServicio.toLowerCase()}`}
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
            Ingresa estos datos una sola vez: se aplicarán automáticamente a los 12 meses del año. Si la propiedad
            tiene más de un número de cliente (por ejemplo, dos medidores), agrégalos todos aquí mismo. Después
            solo edita el valor, la fecha de pago y el estado de cada mes.
          </p>

          {medidores.map((m, idx) => (
            <div key={idx} className="border border-slate-100 rounded-xl p-3 flex flex-col gap-3">
              {medidores.length > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500">N° de cliente {idx + 1}</p>
                  <button type="button" onClick={() => quitarMedidor(idx)} aria-label="Quitar este número de cliente">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              )}

              <Field label={info.compania}>
                {tipoServicio === "Luz" ? (
                  <>
                    <select
                      className={inputClass}
                      value={m.companiaOtra ? "Otra" : m.compania}
                      onChange={(e) => {
                        if (e.target.value === "Otra") {
                          actualizarMedidor(idx, { companiaOtra: true, compania: "" });
                        } else {
                          actualizarMedidor(idx, { companiaOtra: false, compania: e.target.value });
                        }
                      }}
                    >
                      <option value="" disabled>Selecciona una compañía</option>
                      {companiasLuz.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      <option value="Otra">Otra</option>
                    </select>
                    {m.companiaOtra && (
                      <input
                        autoComplete="off"
                        className={`${inputClass} mt-2`}
                        value={m.compania}
                        onChange={(e) => actualizarMedidor(idx, { compania: e.target.value })}
                        placeholder="Nombre de la compañía"
                      />
                    )}
                  </>
                ) : (
                  <input
                    autoComplete="off"
                    className={inputClass}
                    value={m.compania}
                    onChange={(e) => actualizarMedidor(idx, { compania: e.target.value })}
                    placeholder={info.placeholder}
                  />
                )}
              </Field>

              <Field label={info.numero}>
                <input
                  autoComplete="off"
                  className={inputClass}
                  value={m.numeroCliente}
                  onChange={(e) => actualizarMedidor(idx, { numeroCliente: e.target.value })}
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
                  value={m.diaVencimiento}
                  onChange={(e) => actualizarMedidor(idx, { diaVencimiento: e.target.value })}
                  placeholder="Ej. 10"
                />
              </Field>
            </div>
          ))}

          <button
            type="button"
            onClick={agregarMedidor}
            className="flex items-center justify-center gap-1.5 text-sm font-semibold text-violet-600 py-1"
          >
            <Plus className="w-4 h-4" strokeWidth={2.4} />
            Agregar otro número de cliente
          </button>

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
