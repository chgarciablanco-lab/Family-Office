import React, { useState } from "react";
import HomeScreen from "./HomeScreen";
import AutosScreen from "./AutosScreen";
import PropiedadesScreen from "./PropiedadesScreen";

export default function MainApp({ session }) {
  const [screen, setScreen] = useState("home");
  const goHome = () => setScreen("home");

  if (screen === "autos") {
    return <AutosScreen session={session} onBack={goHome} />;
  }
  if (screen === "propiedades") {
    return <PropiedadesScreen session={session} onBack={goHome} />;
  }
  return <HomeScreen session={session} onNavigate={setScreen} />;
}
