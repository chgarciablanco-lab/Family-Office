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

export async function fetchPendientes() {
  const porVencer = [];
  const vencidos = [];

  const agregar = (estado, item) => {
    if (estado === "Por vencer") porVencer.push(item);
    else if (estado === "Vencido" || estado === "Vencida") vencidos.push(item);
  };

  const { data: servicios } = await supabase
    .from("servicios")
    .select("tipo_servicio, compania, numero_cliente, estado, medidores, propiedades:propiedad_id(nombre)");

  (servicios || []).forEach((s) => {
    const grupo = s.propiedades?.nombre ?? "Propiedad";
    const iconInfo = iconoServicio(s.tipo_servicio);
    if (Array.isArray(s.medidores) && s.medidores.length > 0) {
      s.medidores.forEach((m) => {
        agregar(m.estado, {
          grupo, tipo: s.tipo_servicio, sub: subtitulo(m.compania, m.numero_cliente), estado: m.estado, ...iconInfo,
        });
      });
    } else {
      agregar(s.estado, {
        grupo, tipo: s.tipo_servicio, sub: subtitulo(s.compania, s.numero_cliente), estado: s.estado, ...iconInfo,
      });
    }
  });

  const { data: pagosTrabajador } = await supabase
    .from("pagos_trabajador")
    .select("estado, trabajadores:trabajador_id(nombre, cargo)")
    .in("estado", ["Por vencer", "Vencido"]);

  (pagosTrabajador || []).forEach((p) => {
    agregar(p.estado, {
      grupo: p.trabajadores?.nombre ?? "Trabajador", tipo: "Sueldo", sub: p.trabajadores?.cargo ?? "-",
      estado: p.estado, ...ICONOS_EXTRA.Sueldo,
    });
  });

  const { data: impuestos } = await supabase
    .from("impuestos")
    .select("periodo, estado, sociedades:sociedad_id(nombre)")
    .in("estado", ["Por vencer", "Vencido"]);

  (impuestos || []).forEach((i) => {
    agregar(i.estado, {
      grupo: i.sociedades?.nombre ?? "Gestión personal", tipo: "F29 · IVA", sub: formatMes(i.periodo),
      estado: i.estado, ...ICONOS_EXTRA["F29 · IVA"],
    });
  });

  const { data: pagosArriendo } = await supabase
    .from("pagos_arriendo")
    .select("estado, arriendos:arriendo_id(nombre, contraparte_nombre)")
    .in("estado", ["Por vencer", "Vencido"]);

  (pagosArriendo || []).forEach((p) => {
    agregar(p.estado, {
      grupo: p.arriendos?.nombre ?? "Arriendo", tipo: "Arriendo", sub: p.arriendos?.contraparte_nombre ?? "-",
      estado: p.estado, ...ICONOS_EXTRA.Arriendo,
    });
  });

  const { data: pagosAuto } = await supabase
    .from("pagos_auto")
    .select("tipo, estado, autos:auto_id(patente, marca, modelo)")
    .in("estado", ["Por vencer", "Vencido"]);

  (pagosAuto || []).forEach((p) => {
    const auto = p.autos;
    const grupo = auto ? `${auto.marca} ${auto.modelo}` : "Auto";
    const tipoLabel = p.tipo === "seguro" ? "Seguro auto" : p.tipo === "revision" ? "Revisión técnica" : "Patente";
    agregar(p.estado, {
      grupo, tipo: tipoLabel, sub: auto?.patente ?? "-", estado: p.estado, ...ICONOS_EXTRA[tipoLabel],
    });
  });

  const { data: patentesSociedad } = await supabase
    .from("patentes_sociedad")
    .select("estado, sociedades:sociedad_id(nombre)")
    .in("estado", ["Por vencer", "Vencido"]);

  (patentesSociedad || []).forEach((p) => {
    agregar(p.estado, {
      grupo: p.sociedades?.nombre ?? "Sociedad", tipo: "Patente municipal", sub: "Patente semestral",
      estado: p.estado, ...ICONOS_EXTRA["Patente municipal"],
    });
  });

  const { data: inversiones } = await supabase
    .from("inversiones")
    .select("nombre, institucion, estado")
    .in("estado", ["Por vencer", "Vencida"]);

  (inversiones || []).forEach((i) => {
    agregar(i.estado, {
      grupo: i.nombre, tipo: "Inversión", sub: i.institucion ?? "-", estado: i.estado, ...ICONOS_EXTRA.Inversión,
    });
  });

  return { porVencer, vencidos };
}
