import React, { useEffect, useRef, useState } from "react";
import Screen from "./Screen";
import EspacioScreen from "./EspacioScreen";
import EspacioPersonalScreen from "./EspacioPersonalScreen";
import HomeScreen from "./HomeScreen";
import PersonaScreen from "./PersonaScreen";
import PerfilScreen from "./PerfilScreen";
import AutosScreen from "./AutosScreen";
import AutoDetailScreen from "./AutoDetailScreen";
import AutoTramiteScreen from "./AutoTramiteScreen";
import PropiedadesScreen from "./PropiedadesScreen";
import SociedadesListScreen from "./SociedadesListScreen";
import SociedadDetailScreen from "./SociedadDetailScreen";
import TrabajadoresScreen from "./TrabajadoresScreen";
import TrabajadorDetailScreen from "./TrabajadorDetailScreen";
import OtrosGastosScreen from "./OtrosGastosScreen";
import ImpuestosScreen from "./ImpuestosScreen";
import ArriendosScreen from "./ArriendosScreen";
import ArriendoDetailScreen from "./ArriendoDetailScreen";
import InversionesScreen from "./InversionesScreen";
import PatenteSociedadScreen from "./PatenteSociedadScreen";
import NotificacionesScreen from "./NotificacionesScreen";
import DocumentosScreen from "./DocumentosScreen";
import CalendarioScreen from "./CalendarioScreen";
import UsuariosScreen from "./UsuariosScreen";
import NotaDetailScreen from "./NotaDetailScreen";
import HerramientasScreen from "./HerramientasScreen";
import DocumentosBuscarScreen from "./DocumentosBuscarScreen";
import { PermisosProvider, usePermisos } from "../context/PermisosContext";
import GastosBasicosScreen from "./GastosBasicosScreen";
import ServicioHistorialScreen from "./ServicioHistorialScreen";
import EtiquetasConfigScreen from "./EtiquetasConfigScreen";
import EtiquetaGastosScreen from "./EtiquetaGastosScreen";
import SociedadSeccionesConfigScreen from "./SociedadSeccionesConfigScreen";
import PropiedadServiciosConfigScreen from "./PropiedadServiciosConfigScreen";
import { fetchPendientes } from "../lib/pendientes";

const NAV_STORAGE_KEY = "familyOfficeNavState";

function loadNavState() {
  try {
    return JSON.parse(sessionStorage.getItem(NAV_STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

export default function MainApp({ session }) {
  return (
    <PermisosProvider session={session}>
      <MainAppInner session={session} />
    </PermisosProvider>
  );
}

function MainAppInner({ session }) {
  const { loading: cargandoPermisos } = usePermisos();
  const initialNav = loadNavState();
  const [screen, setScreen] = useState(initialNav.screen || "espacio");
  const [selectedSociedad, setSelectedSociedad] = useState(initialNav.selectedSociedad || null);
  const [sociedadBackTo, setSociedadBackTo] = useState(initialNav.sociedadBackTo || "sociedades-list");
  const [selectedPropiedad, setSelectedPropiedad] = useState(initialNav.selectedPropiedad || null);
  const [propiedadBackTo, setPropiedadBackTo] = useState(initialNav.propiedadBackTo || "propiedades");
  const [selectedTipoServicio, setSelectedTipoServicio] = useState(initialNav.selectedTipoServicio || null);
  const [selectedTrabajador, setSelectedTrabajador] = useState(initialNav.selectedTrabajador || null);
  const [trabajadorBackTo, setTrabajadorBackTo] = useState(initialNav.trabajadorBackTo || "trabajadores-persona");
  const [selectedArriendo, setSelectedArriendo] = useState(initialNav.selectedArriendo || null);
  const [arriendoBackTo, setArriendoBackTo] = useState(initialNav.arriendoBackTo || "arriendos-persona");
  const [selectedAuto, setSelectedAuto] = useState(initialNav.selectedAuto || null);
  const [autoBackTo, setAutoBackTo] = useState(initialNav.autoBackTo || "autos");
  const [selectedTramiteAuto, setSelectedTramiteAuto] = useState(initialNav.selectedTramiteAuto || null);
  const [documentosCtx, setDocumentosCtx] = useState(initialNav.documentosCtx || null);
  const [selectedEtiqueta, setSelectedEtiqueta] = useState(initialNav.selectedEtiqueta || null);
  const [etiquetaBackTo, setEtiquetaBackTo] = useState(initialNav.etiquetaBackTo || "persona");
  const [selectedNota, setSelectedNota] = useState(initialNav.selectedNota || null);
  const [herramientasTab, setHerramientasTab] = useState(initialNav.herramientasTab || "tareas");
  const [notifCount, setNotifCount] = useState(0);

  const screenHistoryRef = useRef([]);
  const prevScreenRef = useRef(screen);
  const retrocesoPorGestoRef = useRef(false);

  useEffect(() => {
    if (prevScreenRef.current !== screen) {
      if (retrocesoPorGestoRef.current) {
        // handleSwipeBack ya sacó la pantalla anterior del historial antes de llamar
        // setScreen; no lo volvamos a tocar acá o se reinsertaría la pantalla de la que
        // acabamos de salir.
        retrocesoPorGestoRef.current = false;
      } else {
        const historial = screenHistoryRef.current;
        if (historial[historial.length - 1] === screen) {
          // Navegamos justo a la pantalla que ya está en el tope del historial (típicamente
          // un botón "volver" en pantalla): lo tratamos como retroceder, no como avanzar.
          historial.pop();
        } else {
          historial.push(prevScreenRef.current);
        }
      }
      prevScreenRef.current = screen;
    }
  }, [screen]);

  const handleSwipeBack = () => {
    const previo = screenHistoryRef.current.pop();
    if (previo) {
      retrocesoPorGestoRef.current = true;
      setScreen(previo);
    }
  };

  const cargarNotifCount = () => {
    fetchPendientes().then(({ porVencer, vencidos }) => setNotifCount(porVencer.length + vencidos.length));
  };

  useEffect(() => {
    cargarNotifCount();
  }, []);

  useEffect(() => {
    if (screen === "home") cargarNotifCount();
  }, [screen]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

  useEffect(() => {
    sessionStorage.setItem(
      NAV_STORAGE_KEY,
      JSON.stringify({
        screen, selectedSociedad, sociedadBackTo, selectedPropiedad, propiedadBackTo, selectedTipoServicio,
        selectedTrabajador, trabajadorBackTo, selectedArriendo, arriendoBackTo, selectedAuto, autoBackTo, selectedTramiteAuto,
        documentosCtx, selectedNota, herramientasTab, selectedEtiqueta, etiquetaBackTo,
      })
    );
  }, [
    screen, selectedSociedad, sociedadBackTo, selectedPropiedad, propiedadBackTo, selectedTipoServicio,
    selectedTrabajador, trabajadorBackTo, selectedArriendo, arriendoBackTo, selectedAuto, autoBackTo, selectedTramiteAuto,
    documentosCtx, selectedNota, herramientasTab, selectedEtiqueta, etiquetaBackTo,
  ]);

  const handleSelectSociedad = (backTo) => (s) => {
    setSelectedSociedad(s);
    setSociedadBackTo(backTo);
    setScreen("sociedad-detail");
  };

  const handleSelectPropiedad = (backTo) => (p) => {
    setSelectedPropiedad(p);
    setPropiedadBackTo(backTo);
    setScreen("gastos-basicos");
  };

  const handleSelectTipo = (tipo) => {
    setSelectedTipoServicio(tipo);
    setScreen("servicio-historial");
  };

  const handleSelectTrabajador = (backTo) => (t) => {
    setSelectedTrabajador(t);
    setTrabajadorBackTo(backTo);
    setScreen("trabajador-detail");
  };

  const handleSelectArriendo = (backTo) => (a) => {
    setSelectedArriendo(a);
    setArriendoBackTo(backTo);
    setScreen("arriendo-detail");
  };

  const handleSelectAuto = (backTo) => (a) => {
    setSelectedAuto(a);
    setAutoBackTo(backTo);
    setScreen("auto-detail");
  };

  const handleSelectTramiteAuto = (tipo) => {
    setSelectedTramiteAuto(tipo);
    setScreen("auto-tramite");
  };

  const handleSelectNota = (n) => {
    setSelectedNota(n);
    setScreen("nota-detail");
  };

  const handleOpenDocumentos = (entidadTipo, backTo) => (entidad) => {
    setDocumentosCtx({ entidadTipo, entidadId: entidad.id, entidadNombre: entidad.nombre, backTo });
    setScreen("documentos");
  };

  const handleSelectEtiqueta = (backTo) => (etiqueta) => {
    setSelectedEtiqueta(etiqueta);
    setEtiquetaBackTo(backTo);
    setScreen("etiqueta-gastos");
  };

  if (cargandoPermisos) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm text-slate-400">Cargando...</p>
      </div>
    );
  }

  return (
    <Screen onNavigate={setScreen} notifCount={notifCount} ocultarCampana={screen === "notificaciones"} onSwipeBack={handleSwipeBack}>
      {screen === "espacio" && <EspacioScreen onNavigate={setScreen} />}
      {screen === "espacio-personal" && <EspacioPersonalScreen onNavigate={setScreen} />}
      {screen === "home" && <HomeScreen session={session} onNavigate={setScreen} />}
      {screen === "notificaciones" && (
        <NotificacionesScreen backTo="home" onNavigate={setScreen} />
      )}
      {screen === "calendario" && (
        <CalendarioScreen backTo="home" onNavigate={setScreen} />
      )}
      {screen === "usuarios" && (
        <UsuariosScreen backTo="home" onNavigate={setScreen} />
      )}
      {screen === "herramientas" && (
        <HerramientasScreen
          tab={herramientasTab}
          onTabChange={setHerramientasTab}
          backTo="home"
          onNavigate={setScreen}
          onSelectNota={handleSelectNota}
        />
      )}
      {screen === "nota-detail" && selectedNota && (
        <NotaDetailScreen nota={selectedNota} backTo="herramientas" onNavigate={setScreen} />
      )}
      {screen === "documentos-buscar" && (
        <DocumentosBuscarScreen backTo="home" onNavigate={setScreen} />
      )}
      {screen === "documentos" && documentosCtx && (
        <DocumentosScreen
          entidadTipo={documentosCtx.entidadTipo}
          entidadId={documentosCtx.entidadId}
          entidadNombre={documentosCtx.entidadNombre}
          backTo={documentosCtx.backTo}
          onNavigate={setScreen}
        />
      )}
      {screen === "persona" && (
        <PersonaScreen
          onNavigate={setScreen}
          onOpenDocumentos={handleOpenDocumentos("persona", "persona")}
          onSelectEtiqueta={handleSelectEtiqueta("persona")}
        />
      )}
      {screen === "gastos-personales" && (
        <PersonaScreen
          onNavigate={setScreen}
          onOpenDocumentos={handleOpenDocumentos("persona", "gastos-personales")}
          onSelectEtiqueta={handleSelectEtiqueta("gastos-personales")}
          ownerUserId={session.user.id}
        />
      )}
      {screen === "etiquetas-config" && (
        <EtiquetasConfigScreen backTo="persona" onNavigate={setScreen} />
      )}
      {screen === "etiqueta-gastos" && selectedEtiqueta && (
        <EtiquetaGastosScreen
          etiqueta={selectedEtiqueta}
          ownerUserId={etiquetaBackTo === "gastos-personales" ? session.user.id : null}
          backTo={etiquetaBackTo}
          onNavigate={setScreen}
        />
      )}
      {screen === "perfil" && <PerfilScreen session={session} onNavigate={setScreen} />}
      {screen === "autos" && <AutosScreen onNavigate={setScreen} onSelect={handleSelectAuto("autos")} />}
      {screen === "autos-mio" && (
        <AutosScreen
          ownerUserId={session.user.id}
          backTo="gastos-personales"
          onNavigate={setScreen}
          onSelect={handleSelectAuto("autos-mio")}
        />
      )}
      {screen === "auto-detail" && selectedAuto && (
        <AutoDetailScreen
          auto={selectedAuto}
          backTo={autoBackTo}
          onNavigate={setScreen}
          onSelectTramite={handleSelectTramiteAuto}
          onUpdated={() => setScreen(autoBackTo)}
          onOpenDocumentos={handleOpenDocumentos("auto", "auto-detail")}
        />
      )}
      {screen === "auto-tramite" && selectedAuto && selectedTramiteAuto && (
        <AutoTramiteScreen
          auto={selectedAuto}
          tipo={selectedTramiteAuto}
          backTo="auto-detail"
          onNavigate={setScreen}
        />
      )}

      {screen === "propiedades" && (
        <PropiedadesScreen
          sociedadId={null}
          entidadNombre="Gestión familiar"
          backTo="persona"
          onNavigate={setScreen}
          onSelect={handleSelectPropiedad("propiedades")}
        />
      )}
      {screen === "propiedades-mio" && (
        <PropiedadesScreen
          sociedadId={null}
          ownerUserId={session.user.id}
          entidadNombre="tus gastos personales"
          backTo="gastos-personales"
          onNavigate={setScreen}
          onSelect={handleSelectPropiedad("propiedades-mio")}
        />
      )}

      {screen === "sociedades-list" && (
        <SociedadesListScreen onNavigate={setScreen} onSelect={handleSelectSociedad("sociedades-list")} />
      )}
      {screen === "sociedades-personales" && (
        <SociedadesListScreen
          onNavigate={setScreen}
          onSelect={handleSelectSociedad("sociedades-personales")}
          ownerUserId={session.user.id}
        />
      )}
      {screen === "sociedad-detail" && selectedSociedad && (
        <SociedadDetailScreen
          sociedad={selectedSociedad}
          backTo={sociedadBackTo}
          onNavigate={setScreen}
          onUpdated={() => setScreen(sociedadBackTo)}
          onOpenDocumentos={handleOpenDocumentos("sociedad", "sociedad-detail")}
        />
      )}
      {screen === "sociedad-config" && selectedSociedad && (
        <SociedadSeccionesConfigScreen sociedad={selectedSociedad} backTo="sociedad-detail" onNavigate={setScreen} />
      )}

      {screen === "propiedades-sociedad" && selectedSociedad && (
        <PropiedadesScreen
          sociedadId={selectedSociedad.id}
          entidadNombre={selectedSociedad.nombre}
          backTo="sociedad-detail"
          onNavigate={setScreen}
          onSelect={handleSelectPropiedad("propiedades-sociedad")}
        />
      )}
      {screen === "gastos-basicos" && selectedPropiedad && (
        <GastosBasicosScreen
          propiedad={selectedPropiedad}
          backTo={propiedadBackTo}
          onNavigate={setScreen}
          onSelectTipo={handleSelectTipo}
          onOpenDocumentos={handleOpenDocumentos("propiedad", "gastos-basicos")}
        />
      )}
      {screen === "propiedad-config" && selectedPropiedad && (
        <PropiedadServiciosConfigScreen propiedad={selectedPropiedad} backTo="gastos-basicos" onNavigate={setScreen} />
      )}
      {screen === "servicio-historial" && selectedPropiedad && selectedTipoServicio && (
        <ServicioHistorialScreen
          propiedad={selectedPropiedad}
          sociedadId={selectedPropiedad.sociedad_id}
          tipoServicio={selectedTipoServicio}
          backTo="gastos-basicos"
          onNavigate={setScreen}
        />
      )}
      {screen === "impuestos-sociedad" && selectedSociedad && (
        <ImpuestosScreen
          sociedadId={selectedSociedad.id}
          entidadNombre={selectedSociedad.nombre}
          backTo="sociedad-detail"
          onNavigate={setScreen}
        />
      )}
      {screen === "patente-sociedad" && selectedSociedad && (
        <PatenteSociedadScreen
          sociedad={selectedSociedad}
          backTo="sociedad-detail"
          onNavigate={setScreen}
        />
      )}
      {screen === "impuestos-persona" && (
        <ImpuestosScreen
          sociedadId={null}
          entidadNombre="Gestión familiar"
          backTo="persona"
          onNavigate={setScreen}
        />
      )}
      {screen === "impuestos-persona-mio" && (
        <ImpuestosScreen
          sociedadId={null}
          ownerUserId={session.user.id}
          entidadNombre="tus gastos personales"
          backTo="gastos-personales"
          onNavigate={setScreen}
        />
      )}
      {screen === "arriendos-sociedad" && selectedSociedad && (
        <ArriendosScreen
          sociedadId={selectedSociedad.id}
          entidadNombre={selectedSociedad.nombre}
          backTo="sociedad-detail"
          onNavigate={setScreen}
          onSelect={handleSelectArriendo("arriendos-sociedad")}
        />
      )}
      {screen === "arriendos-persona" && (
        <ArriendosScreen
          sociedadId={null}
          entidadNombre="Gestión familiar"
          backTo="persona"
          onNavigate={setScreen}
          onSelect={handleSelectArriendo("arriendos-persona")}
        />
      )}
      {screen === "arriendos-persona-mio" && (
        <ArriendosScreen
          sociedadId={null}
          ownerUserId={session.user.id}
          entidadNombre="tus gastos personales"
          backTo="gastos-personales"
          onNavigate={setScreen}
          onSelect={handleSelectArriendo("arriendos-persona-mio")}
        />
      )}
      {screen === "arriendo-detail" && selectedArriendo && (
        <ArriendoDetailScreen
          arriendo={selectedArriendo}
          backTo={arriendoBackTo}
          onNavigate={setScreen}
        />
      )}
      {screen === "trabajadores-sociedad" && selectedSociedad && (
        <TrabajadoresScreen
          sociedadId={selectedSociedad.id}
          entidadNombre={selectedSociedad.nombre}
          entidadColor={selectedSociedad.color_tag}
          backTo="sociedad-detail"
          onNavigate={setScreen}
          onSelect={handleSelectTrabajador("trabajadores-sociedad")}
        />
      )}
      {screen === "otros-gastos-sociedad" && selectedSociedad && (
        <OtrosGastosScreen
          sociedadId={selectedSociedad.id}
          entidadNombre={selectedSociedad.nombre}
          entidadColor={selectedSociedad.color_tag}
          backTo="sociedad-detail"
          onNavigate={setScreen}
        />
      )}

      {screen === "trabajadores-persona" && (
        <TrabajadoresScreen
          sociedadId={null}
          entidadNombre="Gestión familiar"
          entidadColor="violet"
          backTo="persona"
          onNavigate={setScreen}
          onSelect={handleSelectTrabajador("trabajadores-persona")}
        />
      )}
      {screen === "trabajadores-persona-mio" && (
        <TrabajadoresScreen
          sociedadId={null}
          ownerUserId={session.user.id}
          entidadNombre="tus gastos personales"
          entidadColor="violet"
          backTo="gastos-personales"
          onNavigate={setScreen}
          onSelect={handleSelectTrabajador("trabajadores-persona-mio")}
        />
      )}
      {screen === "trabajador-detail" && selectedTrabajador && (
        <TrabajadorDetailScreen
          trabajador={selectedTrabajador}
          backTo={trabajadorBackTo}
          onNavigate={setScreen}
          onOpenDocumentos={handleOpenDocumentos("trabajador", "trabajador-detail")}
        />
      )}
      {screen === "inversiones" && (
        <InversionesScreen
          sociedadId={null}
          entidadNombre="Gestión familiar"
          backTo="persona"
          onNavigate={setScreen}
        />
      )}
      {screen === "inversiones-mio" && (
        <InversionesScreen
          sociedadId={null}
          ownerUserId={session.user.id}
          entidadNombre="tus gastos personales"
          backTo="gastos-personales"
          onNavigate={setScreen}
        />
      )}
      {screen === "otros-gastos-persona" && (
        <OtrosGastosScreen
          sociedadId={null}
          entidadNombre="Gestión familiar"
          entidadColor="amber"
          backTo="persona"
          onNavigate={setScreen}
        />
      )}
      {screen === "otros-gastos-persona-mio" && (
        <OtrosGastosScreen
          sociedadId={null}
          ownerUserId={session.user.id}
          entidadNombre="tus gastos personales"
          entidadColor="amber"
          backTo="gastos-personales"
          onNavigate={setScreen}
        />
      )}
    </Screen>
  );
}
