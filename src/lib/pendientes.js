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

// nombre de la columna que guarda el monto en cada tabla
const CAMPO_MONTO = {
  servicios: "valor",
  pagos_trabajador: "liquidacion",
  impuestos: "total_iva",
  pagos_arriendo: "monto",
  pagos_auto: "monto",
  patentes_sociedad: "monto",
  inversiones: "monto",
};

export const MODULO_DE_TABLA = {
  servicios: "propiedades",
  pagos_trabajador: "trabajadores",
  impuestos: "impuestos",
  pagos_arriendo: "arriendos",
  pagos_auto: "autos",
  patentes_sociedad: "sociedades",
  inversiones: "inversiones",
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

export async function fetchPendientes() {
  const porVencer = [];
  const vencidos = [];

  const agregar = (estado, item) => {
    if (estado === "Por vencer") porVencer.push(item);
    else if (estado === "Vencido" || estado === "Vencida") vencidos.push(item);
  };

  const { data: servicios } = await supabase
    .from("servicios")
    .select("id, tipo_servicio, compania, numero_cliente, valor, estado, medidores, propiedades:propiedad_id(nombre)");

  (servicios || []).forEach((s) => {
    const grupo = s.propiedades?.nombre ?? "Propiedad";
    const iconInfo = iconoServicio(s.tipo_servicio);
    if (Array.isArray(s.medidores) && s.medidores.length > 0) {
      s.medidores.forEach((m) => {
        agregar(m.estado, {
          tabla: "servicios", id: s.id, medidor: { compania: m.compania ?? null, numero_cliente: m.numero_cliente ?? null },
          grupo, tipo: s.tipo_servicio, sub: subtitulo(m.compania, m.numero_cliente), estado: m.estado,
          monto: m.valor ?? null, ...iconInfo,
        });
      });
    } else {
      agregar(s.estado, {
        tabla: "servicios", id: s.id, medidor: null,
        grupo, tipo: s.tipo_servicio, sub: subtitulo(s.compania, s.numero_cliente), estado: s.estado,
        monto: s.valor ?? null, ...iconInfo,
      });
    }
  });

  const { data: pagosTrabajador } = await supabase
    .from("pagos_trabajador")
    .select("id, estado, liquidacion, trabajadores:trabajador_id(nombre, cargo)")
    .in("estado", ["Por vencer", "Vencido"]);

  (pagosTrabajador || []).forEach((p) => {
    agregar(p.estado, {
      tabla: "pagos_trabajador", id: p.id, medidor: null,
      grupo: p.trabajadores?.nombre ?? "Trabajador", tipo: "Sueldo", sub: p.trabajadores?.cargo ?? "-",
      estado: p.estado, monto: p.liquidacion ?? null, ...ICONOS_EXTRA.Sueldo,
    });
  });

  const { data: impuestos } = await supabase
    .from("impuestos")
    .select("id, periodo, estado, total_iva, sociedades:sociedad_id(nombre)")
    .in("estado", ["Por vencer", "Vencido"]);

  (impuestos || []).forEach((i) => {
    agregar(i.estado, {
      tabla: "impuestos", id: i.id, medidor: null,
      grupo: i.sociedades?.nombre ?? "Gestión familiar", tipo: "F29 · IVA", sub: formatMes(i.periodo),
      estado: i.estado, monto: i.total_iva ?? null, ...ICONOS_EXTRA["F29 · IVA"],
    });
  });

  const { data: pagosArriendo } = await supabase
    .from("pagos_arriendo")
    .select("id, estado, monto, arriendos:arriendo_id(nombre, contraparte_nombre)")
    .in("estado", ["Por vencer", "Vencido"]);

  (pagosArriendo || []).forEach((p) => {
    agregar(p.estado, {
      tabla: "pagos_arriendo", id: p.id, medidor: null,
      grupo: p.arriendos?.nombre ?? "Arriendo", tipo: "Arriendo", sub: p.arriendos?.contraparte_nombre ?? "-",
      estado: p.estado, monto: p.monto ?? null, ...ICONOS_EXTRA.Arriendo,
    });
  });

  const { data: pagosAuto } = await supabase
    .from("pagos_auto")
    .select("id, tipo, estado, monto, autos:auto_id(patente, marca, modelo)")
    .in("estado", ["Por vencer", "Vencido"]);

  (pagosAuto || []).forEach((p) => {
    const auto = p.autos;
    const grupo = auto ? `${auto.marca} ${auto.modelo}` : "Auto";
    const tipoLabel = p.tipo === "seguro" ? "Seguro auto" : p.tipo === "revision" ? "Revisión técnica" : "Patente";
    agregar(p.estado, {
      tabla: "pagos_auto", id: p.id, medidor: null,
      grupo, tipo: tipoLabel, sub: auto?.patente ?? "-", estado: p.estado, monto: p.monto ?? null,
      ...ICONOS_EXTRA[tipoLabel],
    });
  });

  const { data: patentesSociedad } = await supabase
    .from("patentes_sociedad")
    .select("id, estado, monto, sociedades:sociedad_id(nombre)")
    .in("estado", ["Por vencer", "Vencido"]);

  (patentesSociedad || []).forEach((p) => {
    agregar(p.estado, {
      tabla: "patentes_sociedad", id: p.id, medidor: null,
      grupo: p.sociedades?.nombre ?? "Sociedad", tipo: "Patente municipal", sub: "Patente semestral",
      estado: p.estado, monto: p.monto ?? null, ...ICONOS_EXTRA["Patente municipal"],
    });
  });

  const { data: inversiones } = await supabase
    .from("inversiones")
    .select("id, nombre, institucion, monto, estado")
    .in("estado", ["Por vencer", "Vencida"]);

  (inversiones || []).forEach((i) => {
    agregar(i.estado, {
      tabla: "inversiones", id: i.id, medidor: null,
      grupo: i.nombre, tipo: "Inversión", sub: i.institucion ?? "-", estado: i.estado, monto: i.monto ?? null,
      ...ICONOS_EXTRA.Inversión,
    });
  });

  return { porVencer, vencidos };
}

export async function marcarComoPagado(item, montoPagado) {
  const hoy = new Date().toISOString().slice(0, 10);
  const ahora = new Date().toISOString();
  const campoMonto = CAMPO_MONTO[item.tabla];
  const monto = montoPagado !== "" && montoPagado != null ? parseFloat(montoPagado) : null;

  if (item.tabla === "inversiones") {
    const { error } = await supabase
      .from("inversiones")
      .update({ estado: "Liquidada", [campoMonto]: monto, updated_at: ahora })
      .eq("id", item.id);
    return error;
  }

  if (item.tabla === "servicios" && item.medidor) {
    const { data: row, error: fetchError } = await supabase
      .from("servicios")
      .select("medidores")
      .eq("id", item.id)
      .single();
    if (fetchError) return fetchError;

    const medidores = (row.medidores || []).map((m) =>
      (m.compania ?? null) === item.medidor.compania && (m.numero_cliente ?? null) === item.medidor.numero_cliente
        ? { ...m, valor: monto, fecha_pago: hoy, estado: "Pagado" }
        : m
    );

    const { error } = await supabase
      .from("servicios")
      .update({ medidores, updated_at: ahora })
      .eq("id", item.id);
    if (!error) await supabase.rpc("actualizar_estados_por_vencer");
    return error;
  }

  const { error } = await supabase
    .from(item.tabla)
    .update({ [campoMonto]: monto, fecha_pago: hoy, estado: "Pagado", updated_at: ahora })
    .eq("id", item.id);
  if (!error) await supabase.rpc("actualizar_estados_por_vencer");
  return error;
}
