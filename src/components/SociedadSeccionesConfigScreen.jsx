import React, { useEffect, useState } from "react";
import { ArrowLeft, Info } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import BottomNav from "./BottomNav";
import { SECCIONES_SOCIEDAD_CONFIG } from "../lib/seccionesSociedad";

export default function SociedadSeccionesConfigScreen({ sociedad, backTo = "sociedad-detail", onNavigate }) {
  const [global, setGlobal] = useState({});
  const [propio, setPropio] = useState({});

  const cargar = async () => {
    const [{ data: g }, { data: p }] = await Promise.all([
      supabase.from("secciones_config").select("*"),
      supabase.from("secciones_config_sociedad").select("*").eq("sociedad_id", sociedad.id),
    ]);
    const mapaG = {};
    (g || []).forEach((s) => { mapaG[s.modulo] = s.visible; });
    setGlobal(mapaG);
    const mapaP = {};
    (p || []).forEach((s) => { mapaP[s.modulo] = s.visible; });
    setPropio(mapaP);
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sociedad.id]);

  const toggle = async (modulo) => {
    const actual = propio[modulo] !== undefined ? propio[modulo] : global[modulo] !== false;
    setPropio((prev) => ({ ...prev, [modulo]: !actual }));
    await supabase
      .from("secciones_config_sociedad")
      .upsert({ sociedad_id: sociedad.id, modulo, visible: !actual }, { onConflict: "sociedad_id,modulo" });
  };

  return (
    <>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={() => onNavigate(backTo)} aria-label="Volver">
          <ArrowLeft className="w-6 h-6 text-blue-600" strokeWidth={2} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Configurar {sociedad.nombre}</h1>
        <div className="w-6" />
      </div>

      <div className="px-5 flex flex-col gap-3 pb-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">Secciones de esta sociedad</p>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {SECCIONES_SOCIEDAD_CONFIG.map((sec) => {
            const visible = propio[sec.modulo] !== undefined ? propio[sec.modulo] : global[sec.modulo] !== false;
            return (
              <div key={sec.modulo} className="flex items-center gap-3 px-4 py-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${sec.bg}`}>
                  <sec.icon className={`w-5 h-5 ${sec.fg}`} strokeWidth={1.8} />
                </div>
                <p className="flex-1 font-semibold text-slate-800 text-sm">{sec.title}</p>
                <button
                  type="button"
                  onClick={() => toggle(sec.modulo)}
                  aria-label={visible ? `Ocultar ${sec.title}` : `Mostrar ${sec.title}`}
                  className={`shrink-0 w-11 h-6 p-0 border-0 appearance-none rounded-full relative transition-colors ${visible ? "bg-emerald-500" : "bg-slate-200"}`}
                  style={{ WebkitAppearance: "none" }}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${visible ? "translate-x-5" : "translate-x-0"}`}
                  />
                </button>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 px-4 py-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" strokeWidth={1.8} />
          <div>
            <p className="font-bold text-slate-900 text-sm">Solo para esta sociedad</p>
            <p className="text-sm text-slate-500 mt-0.5">
              Estos ajustes son propios de {sociedad.nombre} y no afectan a otras sociedades. Ocultar una sección no borra su información.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1" />
      <BottomNav variant={sociedad.owner_user_id ? "personal" : "detail"} onNavigate={onNavigate} />
    </>
  );
}
