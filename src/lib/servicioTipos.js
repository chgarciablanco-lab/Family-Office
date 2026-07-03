import { Lightbulb, Droplet, Flame, Wifi, Shield, ShieldCheck, Landmark } from "lucide-react";
import ContribucionesForm from "../components/ContribucionesForm";
import SeguroServicioForm from "../components/SeguroServicioForm";
import GastosComunesForm from "../components/GastosComunesForm";
import UtilidadForm from "../components/UtilidadForm";

export const tiposServicio = [
  { tipo: "Luz", icon: Lightbulb, bg: "bg-amber-100", fg: "text-amber-500", Form: UtilidadForm },
  { tipo: "Agua", icon: Droplet, bg: "bg-blue-100", fg: "text-blue-500", Form: UtilidadForm },
  { tipo: "Gas", icon: Flame, bg: "bg-orange-100", fg: "text-orange-500", Form: UtilidadForm },
  { tipo: "Internet", icon: Wifi, bg: "bg-teal-100", fg: "text-teal-600", Form: UtilidadForm },
  { tipo: "Gastos comunes", icon: Shield, bg: "bg-emerald-100", fg: "text-emerald-600", Form: GastosComunesForm },
  { tipo: "Seguros", icon: ShieldCheck, bg: "bg-blue-100", fg: "text-blue-500", Form: SeguroServicioForm },
  { tipo: "Contribuciones", icon: Landmark, bg: "bg-violet-100", fg: "text-violet-600", Form: ContribucionesForm },
];

export function servicioTipoInfo(tipo) {
  return tiposServicio.find((t) => t.tipo === tipo) || tiposServicio[0];
}
