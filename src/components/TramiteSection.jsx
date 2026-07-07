import React from "react";

export const estados = ["Al día", "Por vencer", "Vencido", "Pagado"];

export const inputClass =
  "w-full h-11 border border-slate-200 rounded-lg px-3 text-sm text-slate-700 outline-none focus:border-violet-400";

export function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-500">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export function SeccionTramite({ titulo, prefix, form, setForm, tipoFecha = "month" }) {
  return (
    <div className="border border-slate-100 rounded-xl p-3 flex flex-col gap-2.5">
      <p className="text-sm font-bold text-slate-900">{titulo}</p>
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Estado">
          <select
            className={inputClass}
            value={form[`${prefix}_estado`]}
            onChange={(e) => setForm({ ...form, [`${prefix}_estado`]: e.target.value })}
          >
            {estados.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </Field>
        {tipoFecha === "dia" ? (
          <Field label="Vence (día del mes)">
            <input
              type="number"
              min={1}
              max={31}
              className={inputClass}
              value={form[`${prefix}_dia_vencimiento`] || ""}
              onChange={(e) => setForm({ ...form, [`${prefix}_dia_vencimiento`]: e.target.value })}
              placeholder="Ej. 5"
            />
          </Field>
        ) : (
          <Field label="Vence (mes)">
            <input
              type="month"
              className={inputClass}
              value={(form[`${prefix}_vence`] || "").slice(0, 7)}
              onChange={(e) =>
                setForm({ ...form, [`${prefix}_vence`]: e.target.value ? `${e.target.value}-01` : "" })
              }
            />
          </Field>
        )}
      </div>
      <Field label="Valor ($)">
        <input
          type="number"
          className={inputClass}
          value={form[`${prefix}_valor`] || ""}
          onChange={(e) => setForm({ ...form, [`${prefix}_valor`]: e.target.value })}
          placeholder="0"
        />
      </Field>
    </div>
  );
}
