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

  filas.sort((a, b) => {
    const porEntidad = a.entidad.localeCompare(b.entidad);
    if (porEntidad !== 0) return porEntidad;
    return (a.vencimiento || a.fechaPago || "").localeCompare(b.vencimiento || b.fechaPago || "");
  });
  return filas;
}

const AZUL_OSCURO = "FF1C3350";
const DORADO = "FFA6802F";
const GRIS_CLARO = "FFF1F5F9";
const COLUMNAS = [
  { header: "Propiedad / Entidad", key: "entidad", width: 26 },
  { header: "Categoría", key: "categoria", width: 20 },
  { header: "Compañía", key: "compania", width: 20 },
  { header: "N° Cliente", key: "numeroCliente", width: 14 },
  { header: "Vencimiento", key: "vencimiento", width: 14 },
  { header: "Fecha de pago", key: "fechaPago", width: 14 },
  { header: "Valor", key: "valor", width: 15 },
  { header: "Estado", key: "estado", width: 13 },
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

export async function descargarConsolidadoExcel() {
  const [{ default: ExcelJS }, filas] = await Promise.all([import("exceljs"), fetchConsolidadoPagos()]);

  const libro = new ExcelJS.Workbook();
  libro.creator = "García Blanco Family Office";
  libro.created = new Date();

  const hoja = libro.addWorksheet("Pagos", {
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } },
    views: [{ state: "frozen", ySplit: 4 }],
  });

  hoja.columns = COLUMNAS.map((c) => ({ key: c.key, width: c.width }));

  hoja.mergeCells(1, 1, 1, COLUMNAS.length);
  const filaTitulo = hoja.getCell(1, 1);
  filaTitulo.value = "García Blanco Family Office — Consolidado de Pagos";
  filaTitulo.font = { bold: true, size: 14, color: { argb: AZUL_OSCURO } };
  filaTitulo.alignment = { horizontal: "left" };

  hoja.mergeCells(2, 1, 2, COLUMNAS.length);
  const filaFecha = hoja.getCell(2, 1);
  filaFecha.value = `Generado el ${new Date().toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" })}`;
  filaFecha.font = { size: 10, color: { argb: DORADO } };

  hoja.getRow(3).height = 6;

  const filaHeader = hoja.getRow(4);
  COLUMNAS.forEach((c, i) => {
    const celda = filaHeader.getCell(i + 1);
    celda.value = c.header;
    celda.font = { bold: true, color: { argb: "FFFFFFFF" } };
    celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: AZUL_OSCURO } };
    celda.alignment = { vertical: "middle" };
    celda.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
  });
  filaHeader.height = 20;
  hoja.pageSetup.printTitlesRow = "4:4";

  let filaActual = 5;
  let totalGeneral = 0;
  const gruposPorEntidad = new Map();
  filas.forEach((f) => {
    if (!gruposPorEntidad.has(f.entidad)) gruposPorEntidad.set(f.entidad, []);
    gruposPorEntidad.get(f.entidad).push(f);
  });

  const bordeFino = { style: "thin", color: { argb: "FFE2E8F0" } };

  for (const [entidad, items] of gruposPorEntidad) {
    hoja.mergeCells(filaActual, 1, filaActual, COLUMNAS.length);
    const celdaGrupo = hoja.getCell(filaActual, 1);
    celdaGrupo.value = entidad;
    celdaGrupo.font = { bold: true, size: 11, color: { argb: AZUL_OSCURO } };
    celdaGrupo.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GRIS_CLARO } };
    filaActual++;

    let subtotal = 0;
    items.forEach((f) => {
      const fila = hoja.getRow(filaActual);
      fila.getCell(1).value = f.entidad;
      fila.getCell(2).value = f.categoria;
      fila.getCell(3).value = f.compania;
      fila.getCell(4).value = f.numeroCliente;
      fila.getCell(5).value = fechaOTexto(f.vencimiento);
      fila.getCell(6).value = fechaOTexto(f.fechaPago);
      fila.getCell(7).value = f.valor;
      fila.getCell(8).value = f.estado;

      fila.getCell(5).numFmt = "dd/mm/yyyy";
      fila.getCell(6).numFmt = "dd/mm/yyyy";
      fila.getCell(7).numFmt = '"$"#,##0';

      const colorEstado = COLOR_ESTADO[f.estado];
      if (colorEstado) {
        fila.getCell(8).fill = { type: "pattern", pattern: "solid", fgColor: { argb: colorEstado } };
      }

      for (let c = 1; c <= COLUMNAS.length; c++) {
        fila.getCell(c).border = { top: bordeFino, bottom: bordeFino, left: bordeFino, right: bordeFino };
      }

      subtotal += f.valor;
      filaActual++;
    });

    const filaSubtotal = hoja.getRow(filaActual);
    hoja.mergeCells(filaActual, 1, filaActual, 6);
    filaSubtotal.getCell(1).value = `Subtotal ${entidad}`;
    filaSubtotal.getCell(1).font = { bold: true, italic: true };
    filaSubtotal.getCell(7).value = subtotal;
    filaSubtotal.getCell(7).numFmt = '"$"#,##0';
    filaSubtotal.getCell(7).font = { bold: true };
    for (let c = 1; c <= COLUMNAS.length; c++) {
      filaSubtotal.getCell(c).border = { top: { style: "thin" } };
    }
    filaActual++;
    totalGeneral += subtotal;
    filaActual++; // fila en blanco entre grupos
  }

  const filaTotal = hoja.getRow(filaActual);
  hoja.mergeCells(filaActual, 1, filaActual, 6);
  filaTotal.getCell(1).value = "TOTAL GENERAL";
  filaTotal.getCell(1).font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
  filaTotal.getCell(7).value = totalGeneral;
  filaTotal.getCell(7).numFmt = '"$"#,##0';
  filaTotal.getCell(7).font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
  for (let c = 1; c <= COLUMNAS.length; c++) {
    filaTotal.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: AZUL_OSCURO } };
  }

  const buffer = await libro.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pagos-consolidado-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  return filas.length;
}
