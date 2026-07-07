import React from "react";

export const estados = ["Al día", "Por vencer", "Vencido", "Pagado"];

export const inputClass =
  "w-full h-9 border border-slate-200 rounded-lg px-2.5 text-sm text-slate-700 outline-none focus:border-violet-400 appearance-none bg-white";

export const selectClass =
  `${inputClass} bg-no-repeat bg-[right_0.6rem_center] pr-7 bg-[length:14px] bg-[url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%2394a3b8%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')]`;

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
            className={selectClass}
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
