import { Home as HomeIcon, Key, Users, FileText, Car, TrendingUp, ClipboardList } from "lucide-react";

export const SECCIONES_FIJAS = [
  {
    key: "propiedades", title: "Propiedades", modulo: "propiedades",
    subtitle: "Controla tus propiedades\ny obligaciones.",
    icon: HomeIcon, bg: "bg-violet-100", fg: "text-violet-600", disponible: true,
  },
  {
    key: "arriendos-persona", title: "Arriendos", modulo: "arriendos",
    subtitle: "Administra contratos de arriendo\ny pagos asociados.",
    icon: Key, bg: "bg-orange-100", fg: "text-orange-500", disponible: true,
  },
  {
    key: "trabajadores-persona", title: "Trabajadores", modulo: "trabajadores",
    subtitle: "Gestiona tu equipo\ny documentación.",
    icon: Users, bg: "bg-emerald-100", fg: "text-emerald-600", disponible: true,
  },
  {
    key: "impuestos-persona", title: "Impuestos", modulo: "impuestos",
    subtitle: "Revisa y gestiona tus impuestos\ny declaraciones.",
    icon: FileText, bg: "bg-violet-100", fg: "text-violet-600", disponible: true,
  },
  {
    key: "autos", title: "Autos", modulo: "autos",
    subtitle: "Administra tus vehículos\ny vencimientos.",
    icon: Car, bg: "bg-emerald-100", fg: "text-emerald-600", disponible: true,
  },
  {
    key: "inversiones", title: "Inversiones", modulo: "inversiones",
    subtitle: "Controla tus inversiones\ny plazos.",
    icon: TrendingUp, bg: "bg-violet-100", fg: "text-violet-600", disponible: true,
  },
  {
    key: "otros-gastos-persona", title: "Otros gastos", modulo: "otros_gastos",
    subtitle: "Registra y controla tus\ngastos diarios.",
    icon: ClipboardList, bg: "bg-amber-100", fg: "text-amber-500", disponible: true,
  },
];
