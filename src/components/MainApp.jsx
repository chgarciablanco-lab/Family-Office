import React, { useState } from "react";
import AutosScreen from "./AutosScreen";
import PropiedadesScreen from "./PropiedadesScreen";
import BottomNav from "./BottomNav";

export default function MainApp({ session }) {
  const [tab, setTab] = useState("autos");

  return (
    <>
      {tab === "autos" && <AutosScreen session={session} />}
      {tab === "propiedades" && <PropiedadesScreen session={session} />}
      <BottomNav active={tab} onChange={setTab} />
    </>
  );
}
