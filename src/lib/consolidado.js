import { supabase } from "./supabaseClient";

function medidorOFallback(s) {
  return Array.isArray(s.medidores) && s.medidores.length > 0 ? s.medidores : [s];
}

export async function fetchConsolidadoPagos() {
  const filas = [];

  const { data: servicios } = await supabase
    .from("servicios")
    .select("tipo_servicio, compania, numero_cliente, vencimiento, fecha_pago, valor, estado, medidores, propiedades:propiedad_id(nombre)");
  (servicios || []).forEach((s) => {
    const nombrePropiedad = s.propiedades?.nombre ?? "Propiedad";
    medidorOFallback(s).forEach((m) => {
      filas.push({
        categoria: s.tipo_servicio,
        entidad: nombrePropiedad,
        compania: m.compania ?? s.compania ?? "",
        numeroCliente: m.numero_cliente ?? s.numero_cliente ?? "",
        vencimiento: m.vencimiento ?? s.vencimiento ?? "",
        fechaPago: m.fecha_pago ?? s.fecha_pago ?? "",
        valor: Number(m.valor ?? s.valor ?? 0),
        estado: m.estado ?? s.estado ?? "",
      });
    });
  });

  const { data: pagosTrabajador } = await supabase
    .from("pagos_trabajador")
    .select("vencimiento, fecha_pago, liquidacion, previred, estado, trabajadores:trabajador_id(nombre)");
  (pagosTrabajador || []).forEach((p) => {
    filas.push({
      categoria: "Sueldo",
      entidad: p.trabajadores?.nombre ?? "Trabajador",
      compania: "",
      numeroCliente: "",
      vencimiento: p.vencimiento ?? "",
      fechaPago: p.fecha_pago ?? "",
      valor: (Number(p.liquidacion) || 0) + (Number(p.previred) || 0),
      estado: p.estado ?? "",
    });
  });

  const { data: impuestos } = await supabase
    .from("impuestos")
    .select("periodo, vencimiento, fecha_pago, total_iva, estado, sociedades:sociedad_id(nombre)");
  (impuestos || []).forEach((i) => {
    filas.push({
      categoria: "F29 · IVA",
      entidad: i.sociedades?.nombre ?? "Gestión personal",
      compania: i.periodo ?? "",
      numeroCliente: "",
      vencimiento: i.vencimiento ?? "",
      fechaPago: i.fecha_pago ?? "",
      valor: Number(i.total_iva) || 0,
      estado: i.estado ?? "",
    });
  });

  const { data: pagosArriendo } = await supabase
    .from("pagos_arriendo")
    .select("vencimiento, fecha_pago, monto, estado, arriendos:arriendo_id(nombre, contraparte_nombre)");
  (pagosArriendo || []).forEach((p) => {
    filas.push({
      categoria: "Arriendo",
      entidad: p.arriendos?.nombre ?? "Arriendo",
      compania: p.arriendos?.contraparte_nombre ?? "",
      numeroCliente: "",
      vencimiento: p.vencimiento ?? "",
      fechaPago: p.fecha_pago ?? "",
      valor: Number(p.monto) || 0,
      estado: p.estado ?? "",
    });
  });

  const TIPOS_AUTO = { seguro: "Seguro auto", revision: "Revisión técnica", permiso: "Permiso de circulación" };
  const { data: pagosAuto } = await supabase
    .from("pagos_auto")
    .select("tipo, vencimiento, fecha_pago, monto, estado, autos:auto_id(marca, modelo, patente)");
  (pagosAuto || []).forEach((p) => {
    const auto = p.autos;
    filas.push({
      categoria: TIPOS_AUTO[p.tipo] || "Auto",
      entidad: auto ? `${auto.marca} ${auto.modelo}` : "Auto",
      compania: "",
      numeroCliente: auto?.patente ?? "",
      vencimiento: p.vencimiento ?? "",
      fechaPago: p.fecha_pago ?? "",
      valor: Number(p.monto) || 0,
      estado: p.estado ?? "",
    });
  });

  const { data: otrosGastos } = await supabase
    .from("otros_gastos")
    .select("titulo, fecha, monto, sociedades:sociedad_id(nombre)");
  (otrosGastos || []).forEach((g) => {
    filas.push({
      categoria: "Otro gasto",
      entidad: g.sociedades?.nombre ?? "Gestión personal",
      compania: g.titulo ?? "",
      numeroCliente: "",
      vencimiento: "",
      fechaPago: g.fecha ?? "",
      valor: Number(g.monto) || 0,
      estado: "Pagado",
    });
  });

  const { data: patentes } = await supabase
    .from("patentes_sociedad")
    .select("vencimiento, fecha_pago, monto, estado, sociedades:sociedad_id(nombre)");
  (patentes || []).forEach((p) => {
    filas.push({
      categoria: "Patente municipal",
      entidad: p.sociedades?.nombre ?? "Sociedad",
      compania: "",
      numeroCliente: "",
      vencimiento: p.vencimiento ?? "",
      fechaPago: p.fecha_pago ?? "",
      valor: Number(p.monto) || 0,
      estado: p.estado ?? "",
    });
  });

  filas.sort((a, b) => (b.fechaPago || b.vencimiento || "").localeCompare(a.fechaPago || a.vencimiento || ""));
  return filas;
}

export async function descargarConsolidadoExcel() {
  const [XLSX, filas] = await Promise.all([import("xlsx"), fetchConsolidadoPagos()]);

  const datos = filas.map((f) => ({
    "Categoría": f.categoria,
    "Propiedad / Entidad": f.entidad,
    "Compañía": f.compania,
    "N° Cliente": f.numeroCliente,
    "Vencimiento": f.vencimiento,
    "Fecha de pago": f.fechaPago,
    "Valor": f.valor,
    "Estado": f.estado,
  }));

  const hoja = XLSX.utils.json_to_sheet(datos);
  hoja["!cols"] = [
    { wch: 20 }, { wch: 26 }, { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 },
  ];

  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Pagos");
  XLSX.writeFile(libro, `pagos-consolidado-${new Date().toISOString().slice(0, 10)}.xlsx`);

  return filas.length;
}
