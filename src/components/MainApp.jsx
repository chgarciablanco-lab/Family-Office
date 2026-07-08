import React, { useEffect, useState } from "react";
import Screen from "./Screen";
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
import GastosBasicosScreen from "./GastosBasicosScreen";
import ServicioHistorialScreen from "./ServicioHistorialScreen";

const NAV_STORAGE_KEY = "familyOfficeNavState";

function loadNavState() {
  try {
    return JSON.parse(sessionStorage.getItem(NAV_STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

export default function MainApp({ session }) {
  const initialNav = loadNavState();
  const [screen, setScreen] = useState(initialNav.screen || "home");
  const [selectedSociedad, setSelectedSociedad] = useState(initialNav.selectedSociedad || null);
  const [selectedPropiedad, setSelectedPropiedad] = useState(initialNav.selectedPropiedad || null);
  const [propiedadBackTo, setPropiedadBackTo] = useState(initialNav.propiedadBackTo || "propiedades");
  const [selectedTipoServicio, setSelectedTipoServicio] = useState(initialNav.selectedTipoServicio || null);
  const [selectedTrabajador, setSelectedTrabajador] = useState(initialNav.selectedTrabajador || null);
  const [trabajadorBackTo, setTrabajadorBackTo] = useState(initialNav.trabajadorBackTo || "trabajadores-persona");
  const [selectedArriendo, setSelectedArriendo] = useState(initialNav.selectedArriendo || null);
  const [arriendoBackTo, setArriendoBackTo] = useState(initialNav.arriendoBackTo || "arriendos-persona");
  const [selectedAuto, setSelectedAuto] = useState(initialNav.selectedAuto || null);
  const [selectedTramiteAuto, setSelectedTramiteAuto] = useState(initialNav.selectedTramiteAuto || null);

  useEffect(() => {
    sessionStorage.setItem(
      NAV_STORAGE_KEY,
      JSON.stringify({
        screen, selectedSociedad, selectedPropiedad, propiedadBackTo, selectedTipoServicio,
        selectedTrabajador, trabajadorBackTo, selectedArriendo, arriendoBackTo, selectedAuto, selectedTramiteAuto,
      })
    );
  }, [
    screen, selectedSociedad, selectedPropiedad, propiedadBackTo, selectedTipoServicio,
    selectedTrabajador, trabajadorBackTo, selectedArriendo, arriendoBackTo, selectedAuto, selectedTramiteAuto,
  ]);

  const handleSelectSociedad = (s) => {
    setSelectedSociedad(s);
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

  const handleSelectAuto = (a) => {
    setSelectedAuto(a);
    setScreen("auto-detail");
  };

  const handleSelectTramiteAuto = (tipo) => {
    setSelectedTramiteAuto(tipo);
    setScreen("auto-tramite");
  };

  return (
    <Screen>
      {screen === "home" && <HomeScreen session={session} onNavigate={setScreen} />}
      {screen === "notificaciones" && (
        <NotificacionesScreen backTo="home" onNavigate={setScreen} />
      )}
      {screen === "persona" && <PersonaScreen onNavigate={setScreen} />}
      {screen === "perfil" && <PerfilScreen session={session} onNavigate={setScreen} />}
      {screen === "autos" && <AutosScreen onNavigate={setScreen} onSelect={handleSelectAuto} />}
      {screen === "auto-detail" && selectedAuto && (
        <AutoDetailScreen
          auto={selectedAuto}
          backTo="autos"
          onNavigate={setScreen}
          onSelectTramite={handleSelectTramiteAuto}
          onUpdated={() => setScreen("autos")}
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
          entidadNombre="Gestión personal"
          backTo="persona"
          onNavigate={setScreen}
          onSelect={handleSelectPropiedad("propiedades")}
        />
      )}

      {screen === "sociedades-list" && (
        <SociedadesListScreen onNavigate={setScreen} onSelect={handleSelectSociedad} />
      )}
      {screen === "sociedad-detail" && selectedSociedad && (
        <SociedadDetailScreen
          sociedad={selectedSociedad}
          onNavigate={setScreen}
          onUpdated={() => setScreen("sociedades-list")}
        />
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
        />
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
          entidadNombre="Gestión personal"
          backTo="persona"
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
          entidadNombre="Gestión personal"
          backTo="persona"
          onNavigate={setScreen}
          onSelect={handleSelectArriendo("arriendos-persona")}
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
          entidadNombre="Gestión personal"
          entidadColor="violet"
          backTo="persona"
          onNavigate={setScreen}
          onSelect={handleSelectTrabajador("trabajadores-persona")}
        />
      )}
      {screen === "trabajador-detail" && selectedTrabajador && (
        <TrabajadorDetailScreen
          trabajador={selectedTrabajador}
          backTo={trabajadorBackTo}
          onNavigate={setScreen}
        />
      )}
      {screen === "inversiones" && (
        <InversionesScreen
          sociedadId={null}
          entidadNombre="Gestión personal"
          backTo="persona"
          onNavigate={setScreen}
        />
      )}
      {screen === "otros-gastos-persona" && (
        <OtrosGastosScreen
          sociedadId={null}
          entidadNombre="Gestión personal"
          entidadColor="amber"
          backTo="persona"
          onNavigate={setScreen}
        />
      )}
    </Screen>
  );
}
