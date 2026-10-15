import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, ScanLine, Search, ChevronRight, Building2, User, Home as HomeIcon, Users, Car, Folder, FolderOpen, Clock, X,
} from "lucide-react";
import BottomNav from "./BottomNav";
import DocumentosScreen from "./DocumentosScreen";
import DocumentoPreviewModal, { iconoDoc } from "./DocumentoPreviewModal";
import { fetchArbolDocumentos, formatTamano, categoriaDoc, PERSONA_DOC_ID } from "../lib/documentos";
import { formatFechaCorta } from "../lib/format";
import { usePermisos } from "../context/PermisosContext";

const FILTROS = [
  { key: "todos", label: "Todos" },
  { key: "pdf", label: "PDF" },
  { key: "imagen", label: "Imágenes" },
  { key: "otro", label: "Otros" },
];

const MAX_RECIENTES = 6;

function textoCantidad(c) {
  const docs = c?.docs || 0;
  const carpetas = c?.carpetas || 0;
  if (docs === 0 && carpetas === 0) return "Vacío";
  const partes = [];
  if (docs > 0) partes.push(`${docs} archivo${docs === 1 ? "" : "s"}`);
  if (carpetas > 0) partes.push(`${carpetas} carpeta${carpetas === 1 ? "" : "s"}`);
  return partes.join(" · ");
}

function FolderRow({ icono: Icon, titulo, subtitulo, total, vacio, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3.5 flex items-center gap-3.5 text-left active:scale-[0.98] transition-transform ${
        vacio ? "opacity-60" : ""
      }`}
    >
      <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-violet-600" strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900 truncate">{titulo}</p>
        {subtitulo && <p className="text-xs text-slate-500 mt-0.5 truncate">{subtitulo}</p>}
      </div>
      {total > 0 && (
        <span className="shrink-0 text-[11px] font-semibold text-violet-700 bg-violet-50 rounded-full px-2 py-0.5">
          {total}
        </span>
      )}
      <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
    </button>
  );
}

function SeccionTitulo({ children }) {
  return <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mt-2 -mb-1 px-1">{children}</p>;
}

function DocRow({ doc, onPreview, onIrACarpeta }) {
  const Icon = iconoDoc(doc.content_type);
  const ubicacion = [doc.entidadNombre, ...doc.rutaCarpeta.map((c) => c.nombre)].join(" › ");
  return (
    <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-3.5 py-3 flex items-center gap-3">
      <button onClick={() => onPreview(doc)} className="flex-1 min-w-0 flex items-center gap-3 text-left active:scale-[0.98] transition-transform">
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-slate-500" strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">{doc.nombre}</p>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{ubicacion}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {formatTamano(doc.tamano_bytes)} · {formatFechaCorta(doc.created_at.slice(0, 10))}
          </p>
        </div>
      </button>
      <button
        onClick={() => onIrACarpeta(doc)}
        aria-label={`Abrir la carpeta de ${doc.nombre}`}
        className="shrink-0 w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center"
      >
        <FolderOpen className="w-4 h-4 text-violet-600" strokeWidth={1.8} />
      </button>
    </div>
  );
}

function Vacio({ children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 px-4 py-8 text-center">
      <p className="text-sm text-slate-500">{children}</p>
    </div>
  );
}

export default function DocumentosBuscarScreen({ backTo, onNavigate }) {
  const { puedeEditar } = usePermisos();
  const puedeCargar = puedeEditar("documentos") || puedeEditar("propiedades") || puedeEditar("trabajadores");
  const [datos, setDatos] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [mostrarVacios, setMostrarVacios] = useState(false);
  const [preview, setPreview] = useState(null);
  // Pila de navegación: { tipo: "gestion" | "sociedad" | "documentos", ... }
  const [path, setPath] = useState([]);

  const cargar = () => fetchArbolDocumentos().then(setDatos);

  useEffect(() => {
    cargar();
  }, []);

  const paso = path[path.length - 1];
  const loading = datos === null;
  const filtrando = filtro !== "todos";
  const c = (tipo, id) => conteo[`${tipo}:${id}`];
  const tieneAlgo = (tipo, id) => (c(tipo, id)?.docs || 0) + (c(tipo, id)?.carpetas || 0) > 0;
  const visible = (tipo, id) => (mostrarVacios && !filtrando) || tieneAlgo(tipo, id);

  const docsFiltradosPorTipo = useMemo(() => {
    const docs = datos?.documentos || [];
    return filtro === "todos" ? docs : docs.filter((d) => categoriaDoc(d.content_type) === filtro);
  }, [datos, filtro]);

  // Con un filtro activo, los conteos (y qué carpetas se ven) salen solo de los archivos de ese
  // tipo; las carpetas vacías no cuentan como "contenido" en ese caso.
  const conteo = useMemo(() => {
    if (!filtrando) return datos?.conteo || {};
    const out = {};
    docsFiltradosPorTipo.forEach((d) => {
      const k = `${d.entidad_tipo}:${d.entidad_id}`;
      out[k] = out[k] || { docs: 0, carpetas: 0 };
      out[k].docs += 1;
    });
    return out;
  }, [datos, filtrando, docsFiltradosPorTipo]);

  const resultados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return [];
    return docsFiltradosPorTipo.filter((d) =>
      d.nombre.toLowerCase().includes(q) ||
      d.entidadNombre.toLowerCase().includes(q) ||
      d.rutaCarpeta.some((r) => r.nombre.toLowerCase().includes(q))
    );
  }, [docsFiltradosPorTipo, busqueda]);

  const recientes = docsFiltradosPorTipo.slice(0, MAX_RECIENTES);

  const irAtras = () => {
    if (path.length > 0) setPath((p) => p.slice(0, -1));
    else onNavigate(backTo);
  };

  const abrirEntidad = (entidadTipo, entidadId, entidadNombre, initialPath) =>
    setPath((p) => [...p, { tipo: "documentos", entidadTipo, entidadId, entidadNombre, initialPath }]);

  const irACarpetaDe = (doc) => {
    setBusqueda("");
    abrirEntidad(doc.entidad_tipo, doc.entidad_id, doc.entidadNombre, doc.rutaCarpeta);
  };

  // Última parada: la pantalla de Documentos de esa entidad (con su gestión de carpetas).
  if (paso?.tipo === "documentos") {
    return (
      <DocumentosScreen
        key={`${paso.entidadTipo}:${paso.entidadId}:${(paso.initialPath || []).map((r) => r.id).join("/")}`}
        entidadTipo={paso.entidadTipo}
        entidadId={paso.entidadId}
        entidadNombre={paso.entidadNombre}
        initialPath={paso.initialPath}
        backTo="__atras__"
        onNavigate={(destino) => {
          if (destino === "__atras__") {
            irAtras();
            cargar(); // pueden haber subido o borrado archivos
          } else onNavigate(destino);
        }}
      />
    );
  }

  const totalGrupo = (items, tipo) => items.reduce((s, it) => s + (c(tipo, it.id)?.docs || 0), 0);

  // Contenido de un grupo (Gestión familiar o una sociedad): documentos generales + entidades.
  const renderGrupo = ({ docsGenerales, propiedades, trabajadores, autos }) => {
    const props = propiedades.filter((p) => visible("propiedad", p.id));
    const trabs = trabajadores.filter((t) => visible("trabajador", t.id));
    const auts = (autos || []).filter((a) => visible("auto", a.id));
    const mostrarGenerales = (mostrarVacios && !filtrando) || tieneAlgo(docsGenerales.tipo, docsGenerales.id);
    const nada = !mostrarGenerales && props.length === 0 && trabs.length === 0 && auts.length === 0;

    return (
      <>
        {mostrarGenerales && (
          <FolderRow
            icono={Folder}
            titulo="Documentos generales"
            subtitulo={textoCantidad(c(docsGenerales.tipo, docsGenerales.id))}
            total={c(docsGenerales.tipo, docsGenerales.id)?.docs}
            vacio={!tieneAlgo(docsGenerales.tipo, docsGenerales.id)}
            onClick={() => abrirEntidad(docsGenerales.tipo, docsGenerales.id, docsGenerales.nombre)}
          />
        )}

        {props.length > 0 && <SeccionTitulo>Propiedades</SeccionTitulo>}
        {props.map((p) => (
          <FolderRow
            key={p.id}
            icono={HomeIcon}
            titulo={p.nombre}
            subtitulo={[p.comuna, textoCantidad(c("propiedad", p.id))].filter(Boolean).join(" · ")}
            total={c("propiedad", p.id)?.docs}
            vacio={!tieneAlgo("propiedad", p.id)}
            onClick={() => abrirEntidad("propiedad", p.id, p.nombre)}
          />
        ))}

        {auts.length > 0 && <SeccionTitulo>Autos</SeccionTitulo>}
        {auts.map((a) => (
          <FolderRow
            key={a.id}
            icono={Car}
            titulo={`${a.marca} ${a.modelo}`}
            subtitulo={[a.patente, textoCantidad(c("auto", a.id))].filter(Boolean).join(" · ")}
            total={c("auto", a.id)?.docs}
            vacio={!tieneAlgo("auto", a.id)}
            onClick={() => abrirEntidad("auto", a.id, `${a.marca} ${a.modelo}`)}
          />
        ))}

        {trabs.length > 0 && <SeccionTitulo>Trabajadores</SeccionTitulo>}
        {trabs.map((t) => (
          <FolderRow
            key={t.id}
            icono={Users}
            titulo={t.nombre}
            subtitulo={[t.cargo, textoCantidad(c("trabajador", t.id))].filter(Boolean).join(" · ")}
            total={c("trabajador", t.id)?.docs}
            vacio={!tieneAlgo("trabajador", t.id)}
            onClick={() => abrirEntidad("trabajador", t.id, t.nombre)}
          />
        ))}

        {nada && <Vacio>No hay documentos acá todavía.</Vacio>}
      </>
    );
  };

  const titulo = paso?.entidadNombre || "Documentos";
  const buscando = busqueda.trim().length > 0;

  // Datos derivados para la raíz.
  const propsPersonales = (datos?.propiedades || []).filter((p) => !p.sociedad_id);
  const trabsPersonales = (datos?.trabajadores || []).filter((t) => !t.sociedad_id);
  const totalGestion =
    (c("persona", PERSONA_DOC_ID)?.docs || 0) +
    totalGrupo(propsPersonales, "propiedad") +
    totalGrupo(trabsPersonales, "trabajador") +
    totalGrupo(datos?.autos || [], "auto");
  const totalSociedad = (s) =>
    (c("sociedad", s.id)?.docs || 0) +
    totalGrupo((datos?.propiedades || []).filter((p) => p.sociedad_id === s.id), "propiedad") +
    totalGrupo((datos?.trabajadores || []).filter((t) => t.sociedad_id === s.id), "trabajador");
  const sociedadesVisibles = (datos?.sociedades || []).filter((s) => (mostrarVacios && !filtrando) || totalSociedad(s) > 0);

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
          <>
            {puedeCargar && (
              <button
                onClick={() => onNavigate("cargar-documento")}
                className="w-full bg-violet-600 text-white rounded-2xl px-4 py-3.5 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
              >
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <ScanLine className="w-5 h-5" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">Cargar documento</p>
                  <p className="text-[11px] text-violet-100">Planillas, liquidaciones o cualquier archivo: la app sabe dónde va</p>
                </div>
              </button>
            )}
            <div className="bg-white border border-slate-100 shadow-sm rounded-xl px-3 py-2.5 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" strokeWidth={2} />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Busca por nombre, carpeta, propiedad..."
                className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none flex-1 min-w-0"
              />
              {buscando && (
                <button onClick={() => setBusqueda("")} aria-label="Limpiar búsqueda" className="shrink-0">
                  <X className="w-4 h-4 text-slate-400" strokeWidth={2} />
                </button>
              )}
            </div>

            <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1">
              {FILTROS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFiltro(f.key)}
                  className={`shrink-0 text-xs font-semibold rounded-full px-3 py-1.5 border transition-colors ${
                    filtro === f.key
                      ? "bg-violet-600 border-violet-600 text-white"
                      : "bg-white border-slate-200 text-slate-600"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </>
        )}

        {loading && <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>}

        {!loading && buscando && path.length === 0 && (
          <>
            <p className="text-xs text-slate-400 -mt-1">
              {resultados.length} resultado{resultados.length === 1 ? "" : "s"}
            </p>
            {resultados.length === 0 && <Vacio>No hay documentos que coincidan con tu búsqueda.</Vacio>}
            {resultados.map((doc) => (
              <DocRow key={doc.id} doc={doc} onPreview={setPreview} onIrACarpeta={irACarpetaDe} />
            ))}
          </>
        )}

        {!loading && !buscando && !paso && (
          <>
            <SeccionTitulo>
              {filtrando
                ? `Carpetas · ${docsFiltradosPorTipo.length} ${FILTROS.find((f) => f.key === filtro).label.toLowerCase()}`
                : "Carpetas"}
            </SeccionTitulo>
            {filtrando && docsFiltradosPorTipo.length === 0 && (
              <Vacio>No hay archivos de este tipo.</Vacio>
            )}
            {((mostrarVacios && !filtrando) || totalGestion > 0 || tieneAlgo("persona", PERSONA_DOC_ID)) && (
              <FolderRow
                icono={User}
                titulo="Gestión familiar"
                subtitulo="Propiedades, autos y trabajadores personales"
                total={totalGestion}
                vacio={totalGestion === 0}
                onClick={() => setPath([{ tipo: "gestion", entidadNombre: "Gestión familiar" }])}
              />
            )}
            {sociedadesVisibles.map((s) => (
              <FolderRow
                key={s.id}
                icono={Building2}
                titulo={s.nombre}
                subtitulo="Sociedad"
                total={totalSociedad(s)}
                vacio={totalSociedad(s) === 0}
                onClick={() => setPath([{ tipo: "sociedad", sociedadId: s.id, entidadNombre: s.nombre }])}
              />
            ))}

            {recientes.length > 0 && (
              <>
                <SeccionTitulo>
                  <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" strokeWidth={2.2} /> Recientes</span>
                </SeccionTitulo>
                {recientes.map((doc) => (
                  <DocRow key={doc.id} doc={doc} onPreview={setPreview} onIrACarpeta={irACarpetaDe} />
                ))}
              </>
            )}
          </>
        )}

        {!loading && paso?.tipo === "gestion" &&
          renderGrupo({
            docsGenerales: { tipo: "persona", id: PERSONA_DOC_ID, nombre: "Gestión familiar" },
            propiedades: propsPersonales,
            trabajadores: trabsPersonales,
            autos: datos.autos,
          })}

        {!loading && paso?.tipo === "sociedad" &&
          renderGrupo({
            docsGenerales: { tipo: "sociedad", id: paso.sociedadId, nombre: paso.entidadNombre },
            propiedades: datos.propiedades.filter((p) => p.sociedad_id === paso.sociedadId),
            trabajadores: datos.trabajadores.filter((t) => t.sociedad_id === paso.sociedadId),
          })}

        {!loading && !buscando && !filtrando && (
          <button
            onClick={() => setMostrarVacios((v) => !v)}
            className="self-center text-xs font-semibold text-violet-600 py-2"
          >
            {mostrarVacios ? "Ocultar ítems sin documentos" : "Mostrar también ítems sin documentos"}
          </button>
        )}
      </div>

      <div className="flex-1" />
      <BottomNav onNavigate={onNavigate} />

      {preview && <DocumentoPreviewModal doc={preview} onClose={() => setPreview(null)} />}
    </>
  );
}
