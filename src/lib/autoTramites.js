import { ShieldCheck, ClipboardCheck, FileText } from "lucide-react";
import { formatMes } from "./format";

export const TIPOS_AUTO = [
  {
    key: "seguro", titulo: "Seguro",
    subtitle: "12 pagos mensuales.",
    icon: ShieldCheck, bg: "bg-blue-100", fg: "text-blue-600",
  },
  {
    key: "revision", titulo: "Revisión técnica",
    subtitle: "1 pago al año.",
    icon: ClipboardCheck, bg: "bg-emerald-100", fg: "text-emerald-600",
  },
  {
    key: "permiso", titulo: "Patente",
    subtitle: "2 pagos al año (semestral).",
    icon: FileText, bg: "bg-amber-100", fg: "text-amber-500",
  },
];

export function periodoLabelAuto(tipo, periodo) {
  if (!periodo) return "-";
  if (tipo === "seguro") return formatMes(periodo);
  const anio = periodo.slice(0, 4);
  if (tipo === "revision") return `Revisión técnica ${anio}`;
  const mes = parseInt(periodo.slice(5, 7), 10);
  return mes <= 6 ? `1er semestre ${anio}` : `2do semestre ${anio}`;
}

export function generarPeriodosAuto(tipo, autoId, anio) {
  if (tipo === "seguro") {
    return Array.from({ length: 12 }, (_, i) => {
      const mes = String(i + 1).padStart(2, "0");
      return {
        auto_id: autoId, tipo, periodo: `${anio}-${mes}-01`,
        monto: null, estado: "Pendiente", vencimiento: `${anio}-${mes}-05`,
      };
    });
  }
  if (tipo === "revision") {
    return [{ auto_id: autoId, tipo, periodo: `${anio}-01-01`, monto: null, estado: "Pendiente", vencimiento: null }];
  }
  return [
    { auto_id: autoId, tipo, periodo: `${anio}-01-01`, monto: null, estado: "Pendiente", vencimiento: null },
    { auto_id: autoId, tipo, periodo: `${anio}-07-01`, monto: null, estado: "Pendiente", vencimiento: null },
  ];
}
