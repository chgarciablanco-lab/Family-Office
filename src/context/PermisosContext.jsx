import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const PermisosContext = createContext(null);

export function PermisosProvider({ session, children }) {
  const [perfil, setPerfil] = useState(null);
  const [permisos, setPermisos] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargar = async () => {
    setLoading(true);
    const { data: perfilData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();
    setPerfil(perfilData);

    if (perfilData && perfilData.rol !== "admin") {
      const { data: permisosData } = await supabase
        .from("permisos")
        .select("*")
        .eq("profile_id", session.user.id);
      setPermisos(permisosData || []);
    } else {
      setPermisos([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.user.id]);

  const esAdmin = perfil?.rol === "admin";

  const puedeVer = (modulo) =>
    esAdmin || permisos.some((p) => p.modulo === modulo && (p.puede_ver || p.puede_editar));

  const puedeEditar = (modulo) =>
    esAdmin || permisos.some((p) => p.modulo === modulo && p.puede_editar);

  return (
    <PermisosContext.Provider value={{ perfil, esAdmin, puedeVer, puedeEditar, loading, recargar: cargar }}>
      {children}
    </PermisosContext.Provider>
  );
}

export function usePermisos() {
  return useContext(PermisosContext);
}
