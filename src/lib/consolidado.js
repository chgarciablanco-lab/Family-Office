import { supabase } from "./supabaseClient";

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function rangoMes(anio, mes) {
  const mm = String(mes).padStart(2, "0");
  const ultimoDiaNum = new Date(anio, mes, 0).getDate();
  return { primerDia: `${anio}-${mm}-01`, ultimoDia: `${anio}-${mm}-${String(ultimoDiaNum).padStart(2, "0")}` };
}

function medidorOFallback(s) {
  return Array.isArray(s.medidores) && s.medidores.length > 0 ? s.medidores : [s];
}

const ORDEN_CATEGORIAS = [
  "Servicios básicos", "Liquidaciones", "F29 · IVA", "Arriendos", "Autos", "Patentes municipales", "Otros gastos",
];

// Cada fila queda con {categoria, entidad, detalle, ...}: categoria y entidad son los dos
// niveles de agrupación del reporte (sección y subsección), detalle es lo específico de esa
// fila dentro de su entidad (tipo de servicio, nombre del trabajador, etc).
export async function fetchConsolidadoPagos(anio, mes) {
  const filas = [];

  const { data: sociedadesData } = await supabase.from("sociedades").select("id, nombre");
  const nombreSociedad = (id) => sociedadesData?.find((s) => s.id === id)?.nombre ?? "Gestión familiar";

  const { data: servicios } = await supabase
    .from("servicios")
    .select("tipo_servicio, compania, numero_cliente, vencimiento, fecha_pago, valor, estado, medidores, propiedades:propiedad_id(nombre)");
  (servicios || []).forEach((s) => {
    const nombrePropiedad = s.propiedades?.nombre ?? "Propiedad";
    medidorOFallback(s).forEach((m) => {
      filas.push({
        categoria: "Servicios básicos",
        entidad: nombrePropiedad,
        detalle: s.tipo_servicio,
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
    .select("vencimiento, fecha_pago, liquidacion, previred, estado, trabajadores:trabajador_id(nombre, sociedad_id)");
  (pagosTrabajador || []).forEach((p) => {
    filas.push({
      categoria: "Liquidaciones",
      entidad: nombreSociedad(p.trabajadores?.sociedad_id ?? null),
      detalle: p.trabajadores?.nombre ?? "Trabajador",
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
    .select("periodo, vencimiento, fecha_pago, total_iva, estado, sociedad_id");
  (impuestos || []).forEach((i) => {
    filas.push({
      categoria: "F29 · IVA",
      entidad: nombreSociedad(i.sociedad_id),
      detalle: i.periodo ?? "",
      compania: "",
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
      categoria: "Arriendos",
      entidad: p.arriendos?.nombre ?? "Arriendo",
      detalle: p.arriendos?.contraparte_nombre ?? "",
      compania: "",
      numeroCliente: "",
      vencimiento: p.vencimiento ?? "",
      fechaPago: p.fecha_pago ?? "",
      valor: Number(p.monto) || 0,
      estado: p.estado ?? "",
    });
  });

  const TIPOS_AUTO = { seguro: "Seguro", revision: "Revisión técnica", permiso: "Permiso de circulación" };
  const { data: pagosAuto } = await supabase
    .from("pagos_auto")
    .select("tipo, vencimiento, fecha_pago, monto, estado, autos:auto_id(marca, modelo, patente)");
  (pagosAuto || []).forEach((p) => {
    const auto = p.autos;
    filas.push({
      categoria: "Autos",
      entidad: auto ? `${auto.marca} ${auto.modelo} · ${auto.patente}` : "Auto",
      detalle: TIPOS_AUTO[p.tipo] || "Trámite",
      compania: "",
      numeroCliente: "",
      vencimiento: p.vencimiento ?? "",
      fechaPago: p.fecha_pago ?? "",
      valor: Number(p.monto) || 0,
      estado: p.estado ?? "",
    });
  });

  const { data: patentes } = await supabase
    .from("patentes_sociedad")
    .select("vencimiento, fecha_pago, monto, estado, sociedad_id");
  (patentes || []).forEach((p) => {
    filas.push({
      categoria: "Patentes municipales",
      entidad: nombreSociedad(p.sociedad_id),
      detalle: "",
      compania: "",
      numeroCliente: "",
      vencimiento: p.vencimiento ?? "",
      fechaPago: p.fecha_pago ?? "",
      valor: Number(p.monto) || 0,
      estado: p.estado ?? "",
    });
  });

  const { data: otrosGastos } = await supabase
    .from("otros_gastos")
    .select("titulo, fecha, monto, sociedad_id");
  (otrosGastos || []).forEach((g) => {
    filas.push({
      categoria: "Otros gastos",
      entidad: nombreSociedad(g.sociedad_id),
      detalle: g.titulo ?? "",
      compania: "",
      numeroCliente: "",
      vencimiento: "",
      fechaPago: g.fecha ?? "",
      valor: Number(g.monto) || 0,
      estado: "Pagado",
    });
  });

  let resultado = filas;
  if (anio && mes) {
    const { primerDia, ultimoDia } = rangoMes(anio, mes);
    resultado = filas.filter((f) => f.fechaPago && f.fechaPago >= primerDia && f.fechaPago <= ultimoDia);
  }

  resultado.sort((a, b) => {
    const oc = ORDEN_CATEGORIAS.indexOf(a.categoria) - ORDEN_CATEGORIAS.indexOf(b.categoria);
    if (oc !== 0) return oc;
    const oe = a.entidad.localeCompare(b.entidad);
    if (oe !== 0) return oe;
    return (a.vencimiento || a.fechaPago || "").localeCompare(b.vencimiento || b.fechaPago || "");
  });

  return resultado;
}

const AZUL_OSCURO = "FF1C3350";
const DORADO = "FFA6802F";
const GRIS_CLARO = "FFF1F5F9";
const COLUMNAS = [
  { header: "Detalle", width: 26 },
  { header: "Compañía", width: 20 },
  { header: "N° Cliente", width: 14 },
  { header: "Vencimiento", width: 14 },
  { header: "Fecha de pago", width: 14 },
  { header: "Valor", width: 15 },
  { header: "Estado", width: 13 },
];

function fechaOTexto(valor) {
  if (!valor) return "";
  const d = new Date(`${valor}T00:00:00`);
  return Number.isNaN(d.getTime()) ? valor : d;
}

const COLOR_ESTADO = {
  Pagado: "FFDCFCE7",
  Liquidada: "FFDCFCE7",
  Vencido: "FFFEE2E2",
  Vencida: "FFFEE2E2",
  "Por vencer": "FFFEF3C7",
};

export async function descargarConsolidadoExcel(anio, mes) {
  const [{ default: ExcelJS }, filas] = await Promise.all([import("exceljs"), fetchConsolidadoPagos(anio, mes)]);

  const libro = new ExcelJS.Workbook();
  libro.creator = "García Blanco Family Office";
  libro.created = new Date();

  const hoja = libro.addWorksheet("Pagos", {
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } },
    views: [{ state: "frozen", ySplit: 4 }],
  });

  hoja.columns = COLUMNAS.map((c) => ({ width: c.width }));

  const alcance = anio && mes ? `${MESES[mes - 1].charAt(0).toUpperCase()}${MESES[mes - 1].slice(1)} ${anio}` : "Historial completo";

  hoja.mergeCells(1, 1, 1, COLUMNAS.length);
  hoja.getCell(1, 1).value = "García Blanco Family Office — Consolidado de Pagos";
  hoja.getCell(1, 1).font = { bold: true, size: 14, color: { argb: AZUL_OSCURO } };

  hoja.mergeCells(2, 1, 2, COLUMNAS.length);
  hoja.getCell(2, 1).value = `${alcance} · Generado el ${new Date().toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" })}`;
  hoja.getCell(2, 1).font = { size: 10, color: { argb: DORADO } };

  hoja.getRow(3).height = 6;

  const filaHeader = hoja.getRow(4);
  COLUMNAS.forEach((c, i) => {
    const celda = filaHeader.getCell(i + 1);
    celda.value = c.header;
    celda.font = { bold: true, color: { argb: "FFFFFFFF" } };
    celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: AZUL_OSCURO } };
    celda.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
  });
  filaHeader.height = 20;
  hoja.pageSetup.printTitlesRow = "4:4";

  const bordeFino = { style: "thin", color: { argb: "FFE2E8F0" } };
  let fila = 5;
  let totalGeneral = 0;

  const categoriasPresentes = ORDEN_CATEGORIAS.filter((c) => filas.some((f) => f.categoria === c));

  for (const categoria of categoriasPresentes) {
    const celdaCategoria = hoja.getCell(fila, 1);
    hoja.mergeCells(fila, 1, fila, COLUMNAS.length);
    celdaCategoria.value = categoria.toUpperCase();
    celdaCategoria.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
    celdaCategoria.fill = { type: "pattern", pattern: "solid", fgColor: { argb: AZUL_OSCURO } };
    fila++;

    const itemsCategoria = filas.filter((f) => f.categoria === categoria);
    const entidades = [...new Set(itemsCategoria.map((f) => f.entidad))];
    let totalCategoria = 0;

    for (const entidad of entidades) {
      const celdaEntidad = hoja.getCell(fila, 1);
      hoja.mergeCells(fila, 1, fila, COLUMNAS.length);
      celdaEntidad.value = entidad;
      celdaEntidad.font = { bold: true, italic: true, color: { argb: AZUL_OSCURO } };
      celdaEntidad.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GRIS_CLARO } };
      fila++;

      let subtotal = 0;
      itemsCategoria.filter((f) => f.entidad === entidad).forEach((f) => {
        const filaDatos = hoja.getRow(fila);
        filaDatos.getCell(1).value = f.detalle;
        filaDatos.getCell(2).value = f.compania;
        filaDatos.getCell(3).value = f.numeroCliente;
        filaDatos.getCell(4).value = fechaOTexto(f.vencimiento);
        filaDatos.getCell(5).value = fechaOTexto(f.fechaPago);
        filaDatos.getCell(6).value = f.valor;
        filaDatos.getCell(7).value = f.estado;

        filaDatos.getCell(4).numFmt = "dd/mm/yyyy";
        filaDatos.getCell(5).numFmt = "dd/mm/yyyy";
        filaDatos.getCell(6).numFmt = '"$"#,##0';

        const colorEstado = COLOR_ESTADO[f.estado];
        if (colorEstado) filaDatos.getCell(7).fill = { type: "pattern", pattern: "solid", fgColor: { argb: colorEstado } };

        for (let c = 1; c <= COLUMNAS.length; c++) {
          filaDatos.getCell(c).border = { top: bordeFino, bottom: bordeFino, left: bordeFino, right: bordeFino };
        }

        subtotal += f.valor;
        fila++;
      });

      hoja.mergeCells(fila, 1, fila, 5);
      hoja.getCell(fila, 1).value = `Subtotal ${entidad}`;
      hoja.getCell(fila, 1).font = { bold: true, size: 10 };
      hoja.getCell(fila, 6).value = subtotal;
      hoja.getCell(fila, 6).numFmt = '"$"#,##0';
      hoja.getCell(fila, 6).font = { bold: true };
      for (let c = 1; c <= COLUMNAS.length; c++) hoja.getCell(fila, c).border = { top: { style: "thin" } };
      fila++;
      totalCategoria += subtotal;
    }

    hoja.mergeCells(fila, 1, fila, 5);
    hoja.getCell(fila, 1).value = `Total ${categoria}`;
    hoja.getCell(fila, 1).font = { bold: true, size: 11 };
    hoja.getCell(fila, 6).value = totalCategoria;
    hoja.getCell(fila, 6).numFmt = '"$"#,##0';
    hoja.getCell(fila, 6).font = { bold: true, size: 11 };
    for (let c = 1; c <= COLUMNAS.length; c++) hoja.getCell(fila, c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: GRIS_CLARO } };
    fila += 2;
    totalGeneral += totalCategoria;
  }

  hoja.mergeCells(fila, 1, fila, 5);
  hoja.getCell(fila, 1).value = "TOTAL GENERAL";
  hoja.getCell(fila, 1).font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
  hoja.getCell(fila, 6).value = totalGeneral;
  hoja.getCell(fila, 6).numFmt = '"$"#,##0';
  hoja.getCell(fila, 6).font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
  for (let c = 1; c <= COLUMNAS.length; c++) hoja.getCell(fila, c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: AZUL_OSCURO } };

  const buffer = await libro.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const sufijoNombre = anio && mes ? `${anio}-${String(mes).padStart(2, "0")}` : "historial";
  a.download = `pagos-consolidado-${sufijoNombre}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  return filas.length;
}
