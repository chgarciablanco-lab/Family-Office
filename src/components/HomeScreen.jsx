import React, { useEffect, useState } from "react";
import { Building2, User, ChevronRight, ClipboardList, ShieldCheck, StickyNote, FileBarChart, FolderSearch } from "lucide-react";
import BottomNav from "./BottomNav";
import PendienteRow from "./PendienteRow";
import { fetchPendientes } from "../lib/pendientes";
import { usePermisos } from "../context/PermisosContext";

const MODULOS_PERSONA = ["propiedades", "autos", "trabajadores", "impuestos", "arriendos", "inversiones", "otros_gastos"];

function saludoSegunHora(hora) {
  if (hora >= 5 && hora < 7) return "Hola, madrugador";
  if (hora >= 7 && hora < 12) return "Buenos días";
  if (hora >= 12 && hora < 19) return "Buenas tardes";
  if (hora >= 19 && hora < 24) return "Buenas noches";
  return "Hola, trasnochador";
}

const menuItems = [
  {
    key: "sociedades-list",
    title: "Sociedades",
    subtitle: "Gestiona tus sociedades\ny obligaciones",
    icon: Building2,
    bg: "bg-blue-100",
    fg: "text-blue-600",
  },
  {
    key: "persona",
    title: "Gestión personal",
    subtitle: "Propiedades, autos, trabajadores\ne inversiones personales",
    icon: User,
    bg: "bg-violet-100",
    fg: "text-violet-600",
  },
  {
    key: "tareas",
    title: "Tareas",
    subtitle: "Asigna tareas a otras personas\ny avísales por correo",
    icon: ClipboardList,
    bg: "bg-emerald-100",
    fg: "text-emerald-600",
  },
  {
    key: "notas",
    title: "Notas",
    subtitle: "Apuntes rápidos compartidos\ncon tu familia",
    icon: StickyNote,
    bg: "bg-rose-100",
    fg: "text-rose-500",
  },
  {
    key: "informes",
    title: "Informes",
    subtitle: "Gastos e ingresos del mes\npor sociedad y gestión personal",
    icon: FileBarChart,
    bg: "bg-indigo-100",
    fg: "text-indigo-600",
  },
  {
    key: "documentos-buscar",
    title: "Documentos",
    subtitle: "Busca cualquier archivo\nguardado en la app",
    icon: FolderSearch,
    bg: "bg-teal-100",
    fg: "text-teal-600",
  },
  {
    key: "usuarios",
    title: "Usuarios",
    subtitle: "Crea usuarios y decide qué\npuede ver y editar cada uno",
    icon: ShieldCheck,
    bg: "bg-amber-100",
    fg: "text-amber-600",
    soloAdmin: true,
  },
];

export default function HomeScreen({ session, onNavigate }) {
  const { esAdmin, puedeVer, perfil } = usePermisos();
  const primerNombre = (perfil?.nombre || "").trim().split(" ")[0];
  const saludo = saludoSegunHora(new Date().getHours());

  const itemsVisibles = menuItems.filter((item) => {
    if (item.soloAdmin) return esAdmin;
    if (item.key === "sociedades") return puedeVer("sociedades");
    if (item.key === "persona") return MODULOS_PERSONA.some((m) => puedeVer(m));
    if (item.key === "tareas") return puedeVer("calendario_tareas");
    if (item.key === "notas") return puedeVer("notas");
    if (item.key === "informes") return puedeVer("informes");
    if (item.key === "documentos-buscar") return puedeVer("documentos");
    return true;
  });

  const fecha = new Date().toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const fechaCap = fecha.charAt(0).toUpperCase() + fecha.slice(1);

  const [porVencer, setPorVencer] = useState([]);
  const [vencidos, setVencidos] = useState([]);
  const [abierto, setAbierto] = useState(null);

  const cargarPendientes = () => {
    fetchPendientes().then(({ porVencer, vencidos }) => {
      setPorVencer(porVencer);
      setVencidos(vencidos);
    });
  };

  useEffect(() => {
    cargarPendientes();
  }, []);

  const totalPendientes = porVencer.length + vencidos.length;
  const listaAbierta = abierto === "por-vencer" ? porVencer : abierto === "vencidos" ? vencidos : [];

  return (
    <>
      <div className="px-5 pt-2 pb-2 flex items-center gap-3">
        <img src="/logo.png" alt="García Blanco Family Office" className="w-16 h-16 object-contain shrink-0" />
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-tight">
            García Blanco <span className="whitespace-nowrap">Family Office</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">{fechaCap}</p>
        </div>
      </div>

      <div className="px-5 pt-4 pb-3">
        <h2 className="text-lg font-bold text-slate-900">
          {saludo}{primerNombre ? `, ${primerNombre}` : ""}
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">¿Qué quieres gestionar hoy?</p>
      </div>

      {totalPendientes > 0 && (
        <div className="px-5 pb-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <p className="px-4 pt-3.5 text-sm font-bold text-slate-900">Pendientes</p>
            <div className="flex gap-2 px-4 py-3">
              <button
                onClick={() => setAbierto(abierto === "por-vencer" ? null : "por-vencer")}
                className={`flex-1 rounded-xl px-3 py-2.5 flex items-baseline gap-1.5 bg-amber-100 border ${
                  abierto === "por-vencer" ? "border-amber-600" : "border-transparent"
                }`}
              >
                <span className="text-lg font-extrabold text-amber-800">{porVencer.length}</span>
                <span className="text-xs font-semibold text-amber-700">por vencer</span>
              </button>
              <button
                onClick={() => setAbierto(abierto === "vencidos" ? null : "vencidos")}
                className={`flex-1 rounded-xl px-3 py-2.5 flex items-baseline gap-1.5 bg-red-100 border ${
                  abierto === "vencidos" ? "border-red-600" : "border-transparent"
                }`}
              >
                <span className="text-lg font-extrabold text-red-800">{vencidos.length}</span>
                <span className="text-xs font-semibold text-red-700">vencidos</span>
              </button>
            </div>

            {abierto && (
              <div className="border-t border-slate-100">
                <p className="px-4 pt-2.5 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                  {abierto === "por-vencer" ? `Por vencer (${porVencer.length})` : `Vencidos (${vencidos.length})`}
                </p>
                <div className="flex flex-col gap-2.5 px-2 pb-2">
                  {listaAbierta.slice(0, 5).map((item, i) => (
                    <PendienteRow key={i} item={item} onDone={cargarPendientes} />
                  ))}
                </div>
                {listaAbierta.length > 5 && (
                  <button
                    onClick={() => onNavigate("notificaciones")}
                    className="w-full text-center py-2.5 text-xs font-bold text-violet-600 border-t border-slate-100"
                  >
                    Ver los {listaAbierta.length} {abierto === "por-vencer" ? "por vencer" : "vencidos"} →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="px-5 flex flex-col gap-3 pb-4">
        {itemsVisibles.map((item) => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${item.bg}`}>
              <item.icon className={`w-7 h-7 ${item.fg}`} strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-base leading-tight">{item.title}</p>
              <p className="text-sm text-slate-500 leading-snug whitespace-pre-line mt-0.5">{item.subtitle}</p>
              {item.key === "persona" && (
                <p className="text-xs text-slate-400 mt-1">{session.user.email}</p>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
          </button>
        ))}
      </div>

      <div className="flex-1" />
      <BottomNav variant="home" onNavigate={onNavigate} />
    </>
  );
}
