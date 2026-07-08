import { Users, FileText, Key, ShieldCheck, ClipboardCheck, Award, TrendingUp } from "lucide-react";
import { supabase } from "./supabaseClient";
import { tiposServicio } from "./servicioTipos";
import { formatMes } from "./format";

const ICONOS_EXTRA = {
  Sueldo: { icon: Users, bg: "bg-emerald-100", fg: "text-emerald-600" },
  "F29 · IVA": { icon: FileText, bg: "bg-violet-100", fg: "text-violet-600" },
  Arriendo: { icon: Key, bg: "bg-orange-100", fg: "text-orange-500" },
  "Seguro auto": { icon: ShieldCheck, bg: "bg-blue-100", fg: "text-blue-600" },
  "Revisión técnica": { icon: ClipboardCheck, bg: "bg-emerald-100", fg: "text-emerald-600" },
  Patente: { icon: FileText, bg: "bg-amber-100", fg: "text-amber-500" },
  "Patente municipal": { icon: Award, bg: "bg-teal-100", fg: "text-teal-600" },
  Inversión: { icon: TrendingUp, bg: "bg-violet-100", fg: "text-violet-600" },
};

function iconoServicio(tipoServicio) {
  const info = tiposServicio.find((t) => t.tipo === tipoServicio);
  return info
    ? { icon: info.icon, bg: info.bg, fg: info.fg }
    : { icon: FileText, bg: "bg-slate-100", fg: "text-slate-500" };
}

function subtitulo(compania, numeroCliente) {
  const partes = [];
  if (numeroCliente) partes.push(`N° ${numeroCliente}`);
  if (compania) partes.push(compania);
  return partes.join(" · ") || "-";
}

function rangoMes(anio, mes) {
  const mm = String(mes).padStart(2, "0");
  const ultimoDiaNum = new Date(anio, mes, 0).getDate();
  return {
    primerDia: `${anio}-${mm}-01`,
    ultimoDia: `${anio}-${mm}-${String(ultimoDiaNum).padStart(2, "0")}`,
  };
}

function diaDe(fecha) {
  return parseInt(fecha.slice(8, 10), 10);
}

export async function fetchVencimientosMes(anio, mes) {
  const { primerDia, ultimoDia } = rangoMes(anio, mes);
  const enRango = (f) => f && f >= primerDia && f <= ultimoDia;
  const items = [];

  const agregar = (fecha, item) => {
    if (!enRango(fecha)) return;
    items.push({ dia: diaDe(fecha), ...item });
  };

  const { data: servicios } = await supabase
    .from("servicios")
    .select("id, tipo_servicio, compania, numero_cliente, valor, vencimiento, estado, medidores, propiedades:propiedad_id(nombre)");

  (servicios || []).forEach((s) => {
    const grupo = s.propiedades?.nombre ?? "Propiedad";
    const iconInfo = iconoServicio(s.tipo_servicio);
    if (Array.isArray(s.medidores) && s.medidores.length > 0) {
      s.medidores.forEach((m) => {
        agregar(m.vencimiento, {
          tabla: "servicios", id: s.id, medidor: { compania: m.compania ?? null, numero_cliente: m.numero_cliente ?? null },
          grupo, tipo: s.tipo_servicio, sub: subtitulo(m.compania, m.numero_cliente), estado: m.estado,
          monto: m.valor ?? null, ...iconInfo,
        });
      });
    } else {
      agregar(s.vencimiento, {
        tabla: "servicios", id: s.id, medidor: null,
        grupo, tipo: s.tipo_servicio, sub: subtitulo(s.compania, s.numero_cliente), estado: s.estado,
        monto: s.valor ?? null, ...iconInfo,
      });
    }
  });

  const { data: pagosTrabajador } = await supabase
    .from("pagos_trabajador")
    .select("id, estado, liquidacion, vencimiento, trabajadores:trabajador_id(nombre, cargo)")
    .gte("vencimiento", primerDia)
    .lte("vencimiento", ultimoDia);

  (pagosTrabajador || []).forEach((p) => {
    agregar(p.vencimiento, {
      tabla: "pagos_trabajador", id: p.id, medidor: null,
      grupo: p.trabajadores?.nombre ?? "Trabajador", tipo: "Sueldo", sub: p.trabajadores?.cargo ?? "-",
      estado: p.estado, monto: p.liquidacion ?? null, ...ICONOS_EXTRA.Sueldo,
    });
  });

  const { data: impuestos } = await supabase
    .from("impuestos")
    .select("id, periodo, estado, total_iva, vencimiento, sociedades:sociedad_id(nombre)")
    .gte("vencimiento", primerDia)
    .lte("vencimiento", ultimoDia);

  (impuestos || []).forEach((i) => {
    agregar(i.vencimiento, {
      tabla: "impuestos", id: i.id, medidor: null,
      grupo: i.sociedades?.nombre ?? "Gestión personal", tipo: "F29 · IVA", sub: formatMes(i.periodo),
      estado: i.estado, monto: i.total_iva ?? null, ...ICONOS_EXTRA["F29 · IVA"],
    });
  });

  const { data: pagosArriendo } = await supabase
    .from("pagos_arriendo")
    .select("id, estado, monto, vencimiento, arriendos:arriendo_id(nombre, contraparte_nombre)")
    .gte("vencimiento", primerDia)
    .lte("vencimiento", ultimoDia);

  (pagosArriendo || []).forEach((p) => {
    agregar(p.vencimiento, {
      tabla: "pagos_arriendo", id: p.id, medidor: null,
      grupo: p.arriendos?.nombre ?? "Arriendo", tipo: "Arriendo", sub: p.arriendos?.contraparte_nombre ?? "-",
      estado: p.estado, monto: p.monto ?? null, ...ICONOS_EXTRA.Arriendo,
    });
  });

  const { data: pagosAuto } = await supabase
    .from("pagos_auto")
    .select("id, tipo, estado, monto, vencimiento, autos:auto_id(patente, marca, modelo)")
    .gte("vencimiento", primerDia)
    .lte("vencimiento", ultimoDia);

  (pagosAuto || []).forEach((p) => {
    const auto = p.autos;
    const grupo = auto ? `${auto.marca} ${auto.modelo}` : "Auto";
    const tipoLabel = p.tipo === "seguro" ? "Seguro auto" : p.tipo === "revision" ? "Revisión técnica" : "Patente";
    agregar(p.vencimiento, {
      tabla: "pagos_auto", id: p.id, medidor: null,
      grupo, tipo: tipoLabel, sub: auto?.patente ?? "-", estado: p.estado, monto: p.monto ?? null,
      ...ICONOS_EXTRA[tipoLabel],
    });
  });

  const { data: patentesSociedad } = await supabase
    .from("patentes_sociedad")
    .select("id, estado, monto, vencimiento, sociedades:sociedad_id(nombre)")
    .gte("vencimiento", primerDia)
    .lte("vencimiento", ultimoDia);

  (patentesSociedad || []).forEach((p) => {
    agregar(p.vencimiento, {
      tabla: "patentes_sociedad", id: p.id, medidor: null,
      grupo: p.sociedades?.nombre ?? "Sociedad", tipo: "Patente municipal", sub: "Patente semestral",
      estado: p.estado, monto: p.monto ?? null, ...ICONOS_EXTRA["Patente municipal"],
    });
  });

  const { data: inversiones } = await supabase
    .from("inversiones")
    .select("id, nombre, institucion, monto, vencimiento, estado")
    .gte("vencimiento", primerDia)
    .lte("vencimiento", ultimoDia);

  (inversiones || []).forEach((i) => {
    agregar(i.vencimiento, {
      tabla: "inversiones", id: i.id, medidor: null,
      grupo: i.nombre, tipo: "Inversión", sub: i.institucion ?? "-", estado: i.estado, monto: i.monto ?? null,
      ...ICONOS_EXTRA.Inversión,
    });
  });

  return items;
}

export async function fetchEventosMes(anio, mes) {
  const { primerDia, ultimoDia } = rangoMes(anio, mes);
  const { data, error } = await supabase
    .from("eventos_calendario")
    .select("*")
    .gte("fecha", primerDia)
    .lte("fecha", ultimoDia)
    .order("hora", { ascending: true, nullsFirst: true });
  if (error) return [];
  return (data || []).map((e) => ({ ...e, dia: diaDe(e.fecha) }));
}

export async function fetchEventosProximos() {
  const hoy = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("eventos_calendario")
    .select("*")
    .gte("fecha", hoy)
    .order("fecha", { ascending: true })
    .order("hora", { ascending: true, nullsFirst: false });
  if (error) return [];
  return data || [];
}

export async function crearEvento({ titulo, fecha, hora, descripcion }) {
  const { error } = await supabase.from("eventos_calendario").insert({
    titulo, fecha, hora: hora || null, descripcion: descripcion || null,
  });
  return error;
}

export async function eliminarEvento(id) {
  const { error } = await supabase.from("eventos_calendario").delete().eq("id", id);
  return error;
}
