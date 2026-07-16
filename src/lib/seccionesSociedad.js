import { Home as HomeIcon, Key, Users, FileText, Award, ClipboardList } from "lucide-react";

export const SECCIONES_SOCIEDAD_CONFIG = [
  { modulo: "propiedades", title: "Propiedades", icon: HomeIcon, bg: "bg-blue-100", fg: "text-blue-600" },
  { modulo: "arriendos", title: "Arriendos", icon: Key, bg: "bg-orange-100", fg: "text-orange-500" },
  { modulo: "trabajadores", title: "Trabajadores", icon: Users, bg: "bg-emerald-100", fg: "text-emerald-600" },
  { modulo: "impuestos", title: "Impuestos", icon: FileText, bg: "bg-violet-100", fg: "text-violet-600" },
  { modulo: "patente", title: "Patente", icon: Award, bg: "bg-teal-100", fg: "text-teal-600" },
  { modulo: "otros_gastos", title: "Otros gastos", icon: ClipboardList, bg: "bg-amber-100", fg: "text-amber-500" },
];
