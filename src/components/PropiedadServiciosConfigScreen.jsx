import React, { useEffect, useState } from "react";
import { ArrowLeft, Info } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import BottomNav from "./BottomNav";
import { tiposServicio } from "../lib/servicioTipos";

export default function PropiedadServiciosConfigScreen({ propiedad, backTo = "gastos-basicos", onNavigate }) {
  const [global, setGlobal] = useState({});
  const [propio, setPropio] = useState({});

  const cargar = async () => {
    const [{ data: g }, { data: p }] = await Promise.all([
      supabase.from("servicios_config").select("*"),
      supabase.from("servicios_config_propiedad").select("*").eq("propiedad_id", propiedad.id),
    ]);
    const mapaG = {};
    (g || []).forEach((s) => { mapaG[s.tipo_servicio] = s.visible; });
    setGlobal(mapaG);
    const mapaP = {};
    (p || []).forEach((s) => { mapaP[s.tipo_servicio] = s.visible; });
    setPropio(mapaP);
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propiedad.id]);

  const toggle = async (tipo) => {
    const actual = propio[tipo] !== undefined ? propio[tipo] : global[tipo] !== false;
    setPropio((prev) => ({ ...prev, [tipo]: !actual }));
    await supabase
      .from("servicios_config_propiedad")
      .upsert({ propiedad_id: propiedad.id, tipo_servicio: tipo, visible: !actual }, { onConflict: "propiedad_id,tipo_servicio" });
  };

  return (
    <>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={() => onNavigate(backTo)} aria-label="Volver">
          <ArrowLeft className="w-6 h-6 text-blue-600" strokeWidth={2} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Configurar {propiedad.nombre}</h1>
        <div className="w-6" />
      </div>

      <div className="px-5 flex flex-col gap-3 pb-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">Gastos básicos de esta propiedad</p>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {tiposServicio.map((serv) => {
            const visible = propio[serv.tipo] !== undefined ? propio[serv.tipo] : global[serv.tipo] !== false;
            return (
              <div key={serv.tipo} className="flex items-center gap-3 px-4 py-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${serv.bg}`}>
                  <serv.icon className={`w-5 h-5 ${serv.fg}`} strokeWidth={1.8} />
                </div>
                <p className="flex-1 font-semibold text-slate-800 text-sm">{serv.tipo}</p>
                <button
                  type="button"
                  onClick={() => toggle(serv.tipo)}
                  aria-label={visible ? `Ocultar ${serv.tipo}` : `Mostrar ${serv.tipo}`}
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
            <p className="font-bold text-slate-900 text-sm">Solo para esta propiedad</p>
            <p className="text-sm text-slate-500 mt-0.5">
              Estos ajustes son propios de {propiedad.nombre} y no afectan a otras propiedades. Ocultar un gasto no borra su información.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1" />
      <BottomNav variant={propiedad.owner_user_id ? "personal" : "detail"} onNavigate={onNavigate} />
    </>
  );
}
