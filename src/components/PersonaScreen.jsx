import React, { useEffect, useState } from "react";
import { ArrowLeft, Settings, Info, Folder, ChevronRight } from "lucide-react";
import BottomNav from "./BottomNav";
import { supabase } from "../lib/supabaseClient";
import { usePermisos } from "../context/PermisosContext";
import { PERSONA_DOC_ID } from "../lib/documentos";
import { ICONOS_ETIQUETA } from "../lib/etiquetas";
import { colorClasses } from "../lib/format";
import { SECCIONES_FIJAS } from "../lib/seccionesFijas";

const secciones = SECCIONES_FIJAS;

export default function PersonaScreen({ onNavigate, onOpenDocumentos, onSelectEtiqueta, ownerUserId = null }) {
  const { puedeVer, esAdmin } = usePermisos();
  const esPersonal = Boolean(ownerUserId);
  const [etiquetas, setEtiquetas] = useState([]);
  const [visibilidad, setVisibilidad] = useState({});

  const seccionesVisibles = secciones
    .filter((sec) => esPersonal || puedeVer(sec.modulo))
    .filter((sec) => visibilidad[sec.modulo] !== false);

  useEffect(() => {
    supabase
      .from("etiquetas_gasto")
      .select("*")
      .order("orden", { ascending: true })
      .order("created_at", { ascending: true })
      .then(({ data, error }) => { if (!error) setEtiquetas(data || []); });

    supabase
      .from("secciones_config")
      .select("*")
      .then(({ data, error }) => {
        if (error) return;
        const mapa = {};
        (data || []).forEach((s) => { mapa[s.modulo] = s.visible; });
        setVisibilidad(mapa);
      });
  }, []);

  return (
    <>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={() => onNavigate(esPersonal ? "espacio-personal" : "home")} aria-label="Volver">
          <ArrowLeft className="w-6 h-6 text-blue-600" strokeWidth={2} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">{esPersonal ? "Mis gastos personales" : "Gestión familiar"}</h1>
        {!esPersonal && esAdmin ? (
          <button onClick={() => onNavigate("etiquetas-config")} aria-label="Configurar pantalla">
            <Settings className="w-6 h-6 text-blue-600" strokeWidth={2} />
          </button>
        ) : (
          <div className="w-6" />
        )}
      </div>

      <div className="px-5 flex flex-col gap-3 pb-4">
        {seccionesVisibles.map((sec) => (
          <button
            key={sec.key}
            onClick={() => sec.disponible && onNavigate(esPersonal ? `${sec.key}-mio` : sec.key)}
            disabled={!sec.disponible}
            className={`w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 flex items-center gap-4 text-left transition-transform ${
              sec.disponible ? "active:scale-[0.98]" : "opacity-60"
            }`}
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${sec.bg}`}>
              <sec.icon className={`w-7 h-7 ${sec.fg}`} strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-base leading-tight">{sec.title}</p>
              <p className="text-sm text-slate-500 leading-snug whitespace-pre-line mt-0.5">
                {sec.disponible ? sec.subtitle : "Próximamente"}
              </p>
            </div>
          </button>
        ))}

        {etiquetas.map((et) => {
          const Icon = ICONOS_ETIQUETA[et.icono] || ICONOS_ETIQUETA.Tag;
          const c = colorClasses[et.color] || colorClasses.slate;
          return (
            <button
              key={et.id}
              onClick={() => onSelectEtiqueta(et)}
              className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${c.bg}`}>
                <Icon className={`w-7 h-7 ${c.fg}`} strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 text-base leading-tight">{et.nombre}</p>
                <p className="text-sm text-slate-500 leading-snug mt-0.5">Etiqueta personalizada</p>
              </div>
            </button>
          );
        })}

        <button
          onClick={() => onOpenDocumentos({ id: esPersonal ? ownerUserId : PERSONA_DOC_ID, nombre: esPersonal ? "Mis gastos personales" : "Gestión familiar" })}
          className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3.5 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            <Folder className="w-5 h-5 text-slate-500" strokeWidth={1.8} />
          </div>
          <p className="flex-1 font-bold text-slate-900 text-sm">Documentos</p>
          <ChevronRight className="w-5 h-5 text-slate-300" />
        </button>

        <div className="bg-white rounded-2xl border border-slate-100 px-4 py-4 flex items-start gap-3 mb-2">
          <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" strokeWidth={1.8} />
          <div>
            <p className="font-bold text-slate-900 text-sm">{esPersonal ? "Tu información privada" : "Gestión familiar"}</p>
            <p className="text-sm text-slate-500 mt-0.5">
              {esPersonal
                ? "Solo tú puedes ver esta sección, ni siquiera los administradores del family office."
                : "Propiedades, autos e inversiones son distintos de los de tus sociedades."}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1" />
      <BottomNav variant={esPersonal ? "personal" : "home"} onNavigate={onNavigate} />
    </>
  );
}
