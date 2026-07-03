import React, { useState } from "react";
import Screen from "./Screen";
import HomeScreen from "./HomeScreen";
import PersonaScreen from "./PersonaScreen";
import PerfilScreen from "./PerfilScreen";
import AutosScreen from "./AutosScreen";
import PropiedadesScreen from "./PropiedadesScreen";
import SociedadesListScreen from "./SociedadesListScreen";
import SociedadDetailScreen from "./SociedadDetailScreen";

export default function MainApp({ session }) {
  const [screen, setScreen] = useState("home");
  const [selectedSociedad, setSelectedSociedad] = useState(null);

  const handleSelectSociedad = (s) => {
    setSelectedSociedad(s);
    setScreen("sociedad-detail");
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
    </Screen>
  );
}
