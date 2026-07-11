import { supabase } from "./supabaseClient";

function rangoMes(anio, mes) {
  const mm = String(mes).padStart(2, "0");
  const ultimoDiaNum = new Date(anio, mes, 0).getDate();
  return {
    primerDia: `${anio}-${mm}-01`,
    ultimoDia: `${anio}-${mm}-${String(ultimoDiaNum).padStart(2, "0")}`,
  };
}

export async function fetchInformeMes(anio, mes) {
  const { primerDia, ultimoDia } = rangoMes(anio, mes);
  const enRango = (f) => f && f >= primerDia && f <= ultimoDia;

  const { data: sociedades } = await supabase.from("sociedades").select("id, nombre").order("nombre");

  const grupos = new Map();
  grupos.set(null, { sociedadId: null, nombre: "Gestión familiar", gastos: 0, ingresos: 0 });
  (sociedades || []).forEach((s) => grupos.set(s.id, { sociedadId: s.id, nombre: s.nombre, gastos: 0, ingresos: 0 }));

  const addGasto = (sociedadId, monto) => {
    const g = grupos.get(sociedadId ?? null);
    if (g) g.gastos += Number(monto) || 0;
  };
  const addIngreso = (sociedadId, monto) => {
    const g = grupos.get(sociedadId ?? null);
    if (g) g.ingresos += Number(monto) || 0;
  };

  const { data: servicios } = await supabase
    .from("servicios")
    .select("valor, estado, fecha_pago, medidores, propiedades:propiedad_id(sociedad_id)");
  (servicios || []).forEach((s) => {
    const sociedadId = s.propiedades?.sociedad_id ?? null;
    const items = Array.isArray(s.medidores) && s.medidores.length > 0
      ? s.medidores
      : [{ valor: s.valor, estado: s.estado, fecha_pago: s.fecha_pago }];
    items.forEach((m) => {
      if (m.estado === "Pagado" && enRango(m.fecha_pago)) addGasto(sociedadId, m.valor);
    });
  });

  const { data: pagosTrabajador } = await supabase
    .from("pagos_trabajador")
    .select("liquidacion, previred, estado, fecha_pago, trabajadores:trabajador_id(sociedad_id)")
    .eq("estado", "Pagado")
    .gte("fecha_pago", primerDia)
    .lte("fecha_pago", ultimoDia);
  (pagosTrabajador || []).forEach((p) => {
    addGasto(p.trabajadores?.sociedad_id ?? null, (Number(p.liquidacion) || 0) + (Number(p.previred) || 0));
  });

  const { data: impuestos } = await supabase
    .from("impuestos")
    .select("total_iva, sociedad_id, estado, fecha_pago")
    .eq("estado", "Pagado")
    .gte("fecha_pago", primerDia)
    .lte("fecha_pago", ultimoDia);
  (impuestos || []).forEach((i) => addGasto(i.sociedad_id, i.total_iva));

  const { data: pagosArriendo } = await supabase
    .from("pagos_arriendo")
    .select("monto, estado, fecha_pago, arriendos:arriendo_id(sociedad_id, relacion)")
    .eq("estado", "Pagado")
    .gte("fecha_pago", primerDia)
    .lte("fecha_pago", ultimoDia);
  (pagosArriendo || []).forEach((p) => {
    const sociedadId = p.arriendos?.sociedad_id ?? null;
    if (p.arriendos?.relacion === "propia") addIngreso(sociedadId, p.monto);
    else addGasto(sociedadId, p.monto);
  });

  const { data: pagosAuto } = await supabase
    .from("pagos_auto")
    .select("monto, estado, fecha_pago")
    .eq("estado", "Pagado")
    .gte("fecha_pago", primerDia)
    .lte("fecha_pago", ultimoDia);
  (pagosAuto || []).forEach((p) => addGasto(null, p.monto));

  const { data: otrosGastos } = await supabase
    .from("otros_gastos")
    .select("monto, sociedad_id, fecha")
    .gte("fecha", primerDia)
    .lte("fecha", ultimoDia);
  (otrosGastos || []).forEach((g) => addGasto(g.sociedad_id, g.monto));

  const { data: patentes } = await supabase
    .from("patentes_sociedad")
    .select("monto, sociedad_id, estado, fecha_pago")
    .eq("estado", "Pagado")
    .gte("fecha_pago", primerDia)
    .lte("fecha_pago", ultimoDia);
  (patentes || []).forEach((p) => addGasto(p.sociedad_id, p.monto));

  return Array.from(grupos.values())
    .map((g) => ({ ...g, neto: g.ingresos - g.gastos }))
    .filter((g) => g.gastos > 0 || g.ingresos > 0);
}
