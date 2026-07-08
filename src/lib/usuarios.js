import { supabase } from "./supabaseClient";

export const MODULOS = [
  { key: "sociedades", label: "Sociedades" },
  { key: "propiedades", label: "Propiedades" },
  { key: "autos", label: "Autos" },
  { key: "trabajadores", label: "Trabajadores" },
  { key: "impuestos", label: "Impuestos" },
  { key: "arriendos", label: "Arriendos" },
  { key: "inversiones", label: "Inversiones" },
  { key: "otros_gastos", label: "Otros gastos" },
  { key: "documentos", label: "Documentos" },
  { key: "calendario_tareas", label: "Calendario y tareas" },
  { key: "notas", label: "Notas" },
];

export async function fetchProfiles() {
  const { data, error } = await supabase.from("profiles").select("*").order("nombre", { ascending: true });
  if (error) return [];
  return data || [];
}

export async function fetchPermisos(profileId) {
  const { data, error } = await supabase.from("permisos").select("*").eq("profile_id", profileId);
  if (error) return [];
  return data || [];
}

async function invocar(body) {
  const { data, error } = await supabase.functions.invoke("admin-usuarios", { body });
  if (error) {
    let mensaje = error.message;
    try {
      const ctx = await error.context.json();
      if (ctx?.error) mensaje = ctx.error;
    } catch {
      // keep default message
    }
    return { error: mensaje };
  }
  if (data?.error) return { error: data.error };
  return { data };
}

export async function crearUsuario({ nombre, email, password, rol, permisos }) {
  return invocar({ accion: "crear_usuario", nombre, email, password, rol, permisos });
}

export async function actualizarPermisos({ profile_id, rol, permisos }) {
  return invocar({ accion: "actualizar_permisos", profile_id, rol, permisos });
}

export async function eliminarUsuario(profile_id) {
  return invocar({ accion: "eliminar_usuario", profile_id });
}
