import React, { useEffect, useState, useMemo } from "react";
import {
  ArrowLeft, Search, Plus, TrendingUp, Info,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import InversionForm from "./InversionForm";
import BottomNav from "./BottomNav";
import { formatCLP, formatFechaCorta, estadoInversionPillClasses } from "../lib/format";
import { usePermisos } from "../context/PermisosContext";

function InversionRow({ inv, onEdit, editable }) {
  const p = estadoInversionPillClasses(inv.estado);
  return (
    <button
      onClick={() => editable && onEdit(inv)}
      disabled={!editable}
      className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-violet-100">
        <TrendingUp className="w-6 h-6 text-violet-600" strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-slate-900 text-base leading-tight">{inv.nombre}</p>
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${p.bg} ${p.text}`}>{inv.estado}</span>
        </div>
        {inv.institucion && <p className="text-sm text-slate-500 mt-0.5">{inv.institucion}</p>}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-slate-400">
          {inv.fecha && <span>Desde: {formatFechaCorta(inv.fecha)}</span>}
          {inv.vencimiento && <span>Vence: {formatFechaCorta(inv.vencimiento)}</span>}
          {inv.rentabilidad && <span>{inv.rentabilidad}</span>}
        </div>
      </div>
      <p className="text-sm font-bold text-slate-900 shrink-0">{formatCLP(inv.monto)}</p>
    </button>
  );
}

export default function InversionesScreen({ sociedadId = null, ownerUserId = null, entidadNombre = "tus inversiones", backTo, onNavigate }) {
  const { puedeEditar } = usePermisos();
  const editable = Boolean(ownerUserId) || puedeEditar("inversiones");
  const [inversiones, setInversiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchInversiones = async () => {
    setLoading(true);
    let query = supabase.from("inversiones").select("*").order("fecha", { ascending: false });
    if (sociedadId) {
      query = query.eq("sociedad_id", sociedadId);
    } else {
      query = query.is("sociedad_id", null);
      query = ownerUserId ? query.eq("owner_user_id", ownerUserId) : query.is("owner_user_id", null);
    }
    const { data, error } = await query;
    if (!error) setInversiones(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchInversiones();
  }, [sociedadId, ownerUserId]);

  const filtradas = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return inversiones;
    return inversiones.filter(
      (i) => i.nombre.toLowerCase().includes(q) || (i.institucion || "").toLowerCase().includes(q)
    );
  }, [inversiones, search]);

  const totalInvertido = useMemo(
    () => inversiones.filter((i) => i.estado !== "Liquidada").reduce((sum, i) => sum + (Number(i.monto) || 0), 0),
    [inversiones]
  );

  const handleSaved = () => {
    setShowForm(false);
    setEditing(null);
    fetchInversiones();
  };

  return (
    <>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={() => onNavigate(backTo)} aria-label="Volver">
          <ArrowLeft className="w-6 h-6 text-blue-600" strokeWidth={2} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Inversiones</h1>
        {editable ? (
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center"
            aria-label="Agregar inversión"
          >
            <Plus className="w-5 h-5 text-white" strokeWidth={2.4} />
          </button>
        ) : (
          <div className="w-8" />
        )}
      </div>

      <div className="px-5 flex flex-col gap-3 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white border border-slate-100 shadow-sm rounded-xl px-3 py-2.5 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" strokeWidth={2} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar inversión, institución..."
              className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none flex-1"
            />
          </div>
        </div>

        <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Invertido en {entidadNombre}</p>
            <p className="text-sm text-slate-500 mt-0.5">{inversiones.length} inversiones</p>
          </div>
          <p className="text-lg font-bold text-slate-900">{formatCLP(totalInvertido)}</p>
        </div>

        {loading && <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>}

        {!loading && filtradas.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 px-4 py-8 text-center">
            <p className="text-sm text-slate-500">No hay inversiones que coincidan con tu búsqueda.</p>
          </div>
        )}

        {filtradas.map((inv) => (
          <InversionRow key={inv.id} inv={inv} onEdit={(i) => { setEditing(i); setShowForm(true); }} editable={editable} />
        ))}

        <div className="bg-white rounded-2xl border border-slate-100 px-4 py-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" strokeWidth={1.8} />
          <div>
            <p className="font-bold text-slate-900 text-sm">Mantén tus inversiones al día</p>
            <p className="text-sm text-slate-500 mt-0.5">Toca una inversión para editarla, o usa el botón + para agregar una nueva.</p>
          </div>
        </div>
      </div>

      <div className="flex-1" />
      <BottomNav variant={ownerUserId ? "personal" : "detail"} onNavigate={onNavigate} />

      {showForm && (
        <InversionForm
          inversion={editing}
          sociedadId={sociedadId}
          ownerUserId={ownerUserId}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
