import React, { useState } from "react";
import Screen from "./Screen";
import HomeScreen from "./HomeScreen";
import PersonaScreen from "./PersonaScreen";
import PerfilScreen from "./PerfilScreen";
import AutosScreen from "./AutosScreen";
import PropiedadesScreen from "./PropiedadesScreen";
import SociedadesListScreen from "./SociedadesListScreen";
import SociedadDetailScreen from "./SociedadDetailScreen";
import SociedadPropiedadesScreen from "./SociedadPropiedadesScreen";
import TrabajadoresScreen from "./TrabajadoresScreen";
import OtrosGastosScreen from "./OtrosGastosScreen";
import ImpuestosScreen from "./ImpuestosScreen";
import ArriendosScreen from "./ArriendosScreen";
import GastosBasicosScreen from "./GastosBasicosScreen";

export default function MainApp({ session }) {
  const [screen, setScreen] = useState("home");
  const [selectedSociedad, setSelectedSociedad] = useState(null);
  const [selectedPropiedad, setSelectedPropiedad] = useState(null);

  const handleSelectSociedad = (s) => {
    setSelectedSociedad(s);
    setScreen("sociedad-detail");
  };

  const handleSelectPropiedad = (p) => {
    setSelectedPropiedad(p);
    setScreen("gastos-basicos");
  };

  return (
    <Screen>
      {screen === "home" && <HomeScreen session={session} onNavigate={setScreen} />}
      {screen === "persona" && <PersonaScreen onNavigate={setScreen} />}
      {screen === "perfil" && <PerfilScreen session={session} onNavigate={setScreen} />}
      {screen === "autos" && <AutosScreen onNavigate={setScreen} />}
      {screen === "propiedades" && <PropiedadesScreen onNavigate={setScreen} />}

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
        <SociedadPropiedadesScreen
          sociedad={selectedSociedad}
          backTo="sociedad-detail"
          onNavigate={setScreen}
          onSelect={handleSelectPropiedad}
        />
      )}
      {screen === "gastos-basicos" && selectedPropiedad && (
        <GastosBasicosScreen propiedad={selectedPropiedad} backTo="propiedades-sociedad" onNavigate={setScreen} />
      )}
      {screen === "impuestos-sociedad" && selectedSociedad && (
        <ImpuestosScreen sociedad={selectedSociedad} backTo="sociedad-detail" onNavigate={setScreen} />
      )}
      {screen === "arriendos-sociedad" && selectedSociedad && (
        <ArriendosScreen sociedad={selectedSociedad} backTo="sociedad-detail" onNavigate={setScreen} />
      )}
      {screen === "trabajadores-sociedad" && selectedSociedad && (
        <TrabajadoresScreen
          sociedadId={selectedSociedad.id}
          entidadNombre={selectedSociedad.nombre}
          entidadColor={selectedSociedad.color_tag}
          backTo="sociedad-detail"
          onNavigate={setScreen}
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
