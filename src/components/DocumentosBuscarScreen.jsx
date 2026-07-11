import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, Search, ChevronRight, Building2, User, Home as HomeIcon, Users, Car, Folder,
} from "lucide-react";
import BottomNav from "./BottomNav";
import DocumentosScreen from "./DocumentosScreen";
import DocumentoPreviewModal, { iconoDoc } from "./DocumentoPreviewModal";
import { fetchTodosLosDocumentos, formatTamano, PERSONA_DOC_ID } from "../lib/documentos";
import { formatFechaCorta } from "../lib/format";
import { supabase } from "../lib/supabaseClient";

function FolderRow({ icono: Icon, titulo, subtitulo, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3.5 flex items-center gap-3.5 text-left active:scale-[0.98] transition-transform"
    >
      <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-violet-600" strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900 truncate">{titulo}</p>
        {subtitulo && <p className="text-xs text-slate-500 mt-0.5 truncate">{subtitulo}</p>}
      </div>
      <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
    </button>
  );
}

export default function DocumentosBuscarScreen({ backTo, onNavigate }) {
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [preview, setPreview] = useState(null);
  const [path, setPath] = useState([]);
  const [nivelItems, setNivelItems] = useState(null);
  const [cargandoNivel, setCargandoNivel] = useState(false);

  useEffect(() => {
    fetchTodosLosDocumentos().then((data) => {
      setDocumentos(data);
      setLoading(false);
    });
  }, []);

  const paso = path[path.length - 1];

  const contarDocs = (entidadTipo, entidadId) =>
    documentos.filter((d) => d.entidad_tipo === entidadTipo && d.entidad_id === entidadId).length;

  useEffect(() => {
    if (!paso) return;
    setCargandoNivel(true);
    setNivelItems(null);

    const cargar = async () => {
      if (paso.tipo === "sociedades") {
        const { data } = await supabase.from("sociedades").select("id, nombre").order("nombre");
        return data || [];
      }
      if (paso.tipo === "propiedades") {
        let q = supabase.from("propiedades").select("id, nombre, comuna").order("nombre");
        q = paso.sociedadId ? q.eq("sociedad_id", paso.sociedadId) : q.is("sociedad_id", null);
        const { data } = await q;
        return data || [];
      }
      if (paso.tipo === "trabajadores") {
        let q = supabase.from("trabajadores").select("id, nombre, cargo").order("nombre");
        q = paso.sociedadId ? q.eq("sociedad_id", paso.sociedadId) : q.is("sociedad_id", null);
        const { data } = await q;
        return data || [];
      }
      if (paso.tipo === "autos") {
        const { data } = await supabase.from("autos").select("id, marca, modelo, patente").order("marca");
        return data || [];
      }
      return [];
    };

    cargar().then((items) => {
      setNivelItems(items);
      setCargandoNivel(false);
    });
  }, [paso]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return [];
    return documentos.filter((d) =>
      d.nombre.toLowerCase().includes(q) ||
      (d.carpetaNombre && d.carpetaNombre.toLowerCase().includes(q)) ||
      d.entidadNombre.toLowerCase().includes(q)
    );
  }, [documentos, busqueda]);

  const irAtras = () => {
    if (path.length > 0) setPath((p) => p.slice(0, -1));
    else onNavigate(backTo);
  };

  // Última parada: mostramos directamente la pantalla de Documentos de esa entidad.
  if (paso?.tipo === "documentos") {
    return (
      <DocumentosScreen
        entidadTipo={paso.entidadTipo}
        entidadId={paso.entidadId}
        entidadNombre={paso.entidadNombre}
        backTo="__atras__"
        onNavigate={irAtras}
      />
    );
  }

  const titulo = paso?.entidadNombre || "Documentos";

  return (
    <>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={irAtras} aria-label="Volver">
          <ArrowLeft className="w-6 h-6 text-blue-600" strokeWidth={2} />
        </button>
        <h1 className="text-xl font-bold text-slate-900 truncate px-2">{titulo}</h1>
        <div className="w-6" />
      </div>

      <div className="px-5 flex flex-col gap-3 pb-4">
        {path.length === 0 && (
          <div className="bg-white border border-slate-100 shadow-sm rounded-xl px-3 py-2.5 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" strokeWidth={2} />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Busca por nombre, categoría, propiedad..."
              className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none flex-1"
            />
          </div>
        )}

        {busqueda.trim() ? (
          <>
            <p className="text-xs text-slate-400 -mt-1">
              {filtrados.length} resultado{filtrados.length === 1 ? "" : "s"}
            </p>
            {filtrados.length === 0 && !loading && (
              <div className="bg-white rounded-2xl border border-slate-100 px-4 py-8 text-center">
                <p className="text-sm text-slate-500">No hay documentos que coincidan con tu búsqueda.</p>
              </div>
            )}
            {filtrados.map((doc) => {
              const Icon = iconoDoc(doc.content_type);
              return (
                <button
                  key={doc.id}
                  onClick={() => setPreview(doc)}
                  className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-3.5 py-3 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-slate-500" strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{doc.nombre}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {doc.carpetaNombre ? `${doc.carpetaNombre} · ` : ""}{doc.entidadNombre}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {formatTamano(doc.tamano_bytes)} · {formatFechaCorta(doc.created_at.slice(0, 10))}
                    </p>
                  </div>
                </button>
              );
            })}
          </>
        ) : (
          <>
            {loading && path.length === 0 && <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>}

            {!paso && !loading && (
              <>
                <FolderRow
                  icono={User}
                  titulo="Gestión familiar"
                  subtitulo="Propiedades, autos y trabajadores personales"
                  onClick={() => setPath([{ tipo: "gestion", entidadNombre: "Gestión familiar" }])}
                />
                <FolderRow
                  icono={Building2}
                  titulo="Sociedades"
                  subtitulo="Documentos por cada sociedad"
                  onClick={() => setPath([{ tipo: "sociedades", entidadNombre: "Sociedades" }])}
                />
              </>
            )}

            {paso?.tipo === "gestion" && (
              <>
                <FolderRow
                  icono={HomeIcon}
                  titulo="Propiedades"
                  onClick={() => setPath((p) => [...p, { tipo: "propiedades", sociedadId: null, entidadNombre: "Propiedades" }])}
                />
                <FolderRow
                  icono={Car}
                  titulo="Autos"
                  onClick={() => setPath((p) => [...p, { tipo: "autos", entidadNombre: "Autos" }])}
                />
                <FolderRow
                  icono={Users}
                  titulo="Trabajadores"
                  onClick={() => setPath((p) => [...p, { tipo: "trabajadores", sociedadId: null, entidadNombre: "Trabajadores" }])}
                />
                <FolderRow
                  icono={Folder}
                  titulo="Documentos generales"
                  subtitulo={`${contarDocs("persona", PERSONA_DOC_ID)} documento(s)`}
                  onClick={() => setPath((p) => [...p, {
                    tipo: "documentos", entidadTipo: "persona", entidadId: PERSONA_DOC_ID, entidadNombre: "Gestión familiar",
                  }])}
                />
              </>
            )}

            {paso?.tipo === "sociedades" && (
              <>
                {cargandoNivel && <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>}
                {!cargandoNivel && (nivelItems || []).length === 0 && (
                  <div className="bg-white rounded-2xl border border-slate-100 px-4 py-8 text-center">
                    <p className="text-sm text-slate-500">Aún no tienes sociedades registradas.</p>
                  </div>
                )}
                {!cargandoNivel && (nivelItems || []).map((s) => (
                  <FolderRow
                    key={s.id}
                    icono={Building2}
                    titulo={s.nombre}
                    onClick={() => setPath((p) => [...p, { tipo: "sociedad", sociedadId: s.id, entidadNombre: s.nombre }])}
                  />
                ))}
              </>
            )}

            {paso?.tipo === "sociedad" && (
              <>
                <FolderRow
                  icono={HomeIcon}
                  titulo="Propiedades"
                  onClick={() => setPath((p) => [...p, { tipo: "propiedades", sociedadId: paso.sociedadId, entidadNombre: `Propiedades · ${paso.entidadNombre}` }])}
                />
                <FolderRow
                  icono={Users}
                  titulo="Trabajadores"
                  onClick={() => setPath((p) => [...p, { tipo: "trabajadores", sociedadId: paso.sociedadId, entidadNombre: `Trabajadores · ${paso.entidadNombre}` }])}
                />
                <FolderRow
                  icono={Folder}
                  titulo="Documentos generales"
                  subtitulo={`${contarDocs("sociedad", paso.sociedadId)} documento(s)`}
                  onClick={() => setPath((p) => [...p, {
                    tipo: "documentos", entidadTipo: "sociedad", entidadId: paso.sociedadId, entidadNombre: paso.entidadNombre,
                  }])}
                />
              </>
            )}

            {paso?.tipo === "propiedades" && (
              <>
                {cargandoNivel && <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>}
                {!cargandoNivel && (nivelItems || []).length === 0 && (
                  <div className="bg-white rounded-2xl border border-slate-100 px-4 py-8 text-center">
                    <p className="text-sm text-slate-500">No hay propiedades acá.</p>
                  </div>
                )}
                {!cargandoNivel && (nivelItems || []).map((p) => (
                  <FolderRow
                    key={p.id}
                    icono={HomeIcon}
                    titulo={p.nombre}
                    subtitulo={p.comuna}
                    onClick={() => setPath((prev) => [...prev, {
                      tipo: "documentos", entidadTipo: "propiedad", entidadId: p.id, entidadNombre: p.nombre,
                    }])}
                  />
                ))}
              </>
            )}

            {paso?.tipo === "trabajadores" && (
              <>
                {cargandoNivel && <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>}
                {!cargandoNivel && (nivelItems || []).length === 0 && (
                  <div className="bg-white rounded-2xl border border-slate-100 px-4 py-8 text-center">
                    <p className="text-sm text-slate-500">No hay trabajadores acá.</p>
                  </div>
                )}
                {!cargandoNivel && (nivelItems || []).map((t) => (
                  <FolderRow
                    key={t.id}
                    icono={Users}
                    titulo={t.nombre}
                    subtitulo={t.cargo}
                    onClick={() => setPath((prev) => [...prev, {
                      tipo: "documentos", entidadTipo: "trabajador", entidadId: t.id, entidadNombre: t.nombre,
                    }])}
                  />
                ))}
              </>
            )}

            {paso?.tipo === "autos" && (
              <>
                {cargandoNivel && <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>}
                {!cargandoNivel && (nivelItems || []).length === 0 && (
                  <div className="bg-white rounded-2xl border border-slate-100 px-4 py-8 text-center">
                    <p className="text-sm text-slate-500">No hay autos registrados.</p>
                  </div>
                )}
                {!cargandoNivel && (nivelItems || []).map((a) => (
                  <FolderRow
                    key={a.id}
                    icono={Car}
                    titulo={`${a.marca} ${a.modelo}`}
                    subtitulo={a.patente}
                    onClick={() => setPath((prev) => [...prev, {
                      tipo: "documentos", entidadTipo: "auto", entidadId: a.id, entidadNombre: `${a.marca} ${a.modelo}`,
                    }])}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>

      <div className="flex-1" />
      <BottomNav onNavigate={onNavigate} />

      {preview && <DocumentoPreviewModal doc={preview} onClose={() => setPreview(null)} />}
    </>
  );
}
