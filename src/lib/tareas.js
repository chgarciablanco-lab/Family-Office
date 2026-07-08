import { supabase } from "./supabaseClient";

export async function fetchUsuarios() {
  const { data, error } = await supabase
    .from("usuarios_asignables")
    .select("*")
    .order("nombre", { ascending: true });
  if (error) return [];
  return data || [];
}

export async function crearUsuario({ nombre, email }) {
  const { data, error } = await supabase
    .from("usuarios_asignables")
    .insert({ nombre, email })
    .select()
    .single();
  return { data, error };
}

export async function fetchTareasAsignadas() {
  const hoy = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("eventos_calendario")
    .select("*, usuarios_asignables:usuario_asignado_id(nombre, email)")
    .not("usuario_asignado_id", "is", null)
    .gte("fecha", hoy)
    .order("fecha", { ascending: true })
    .order("hora", { ascending: true, nullsFirst: false });
  if (error) return [];
  return data || [];
}

export async function asignarTarea({ usuario, titulo, fecha, hora, descripcion }) {
  const { data: evento, error } = await supabase
    .from("eventos_calendario")
    .insert({
      titulo,
      fecha,
      hora: hora || null,
      descripcion: descripcion || null,
      usuario_asignado_id: usuario.id,
    })
    .select()
    .single();

  if (error) return { error };

  const { error: emailError } = await supabase.functions.invoke("enviar-tarea-asignada", {
    body: { nombre: usuario.nombre, email: usuario.email, titulo, fecha, hora: hora || null, descripcion: descripcion || null },
  });

  return { data: evento, emailError };
}

export async function eliminarTarea(id) {
  const { error } = await supabase.from("eventos_calendario").delete().eq("id", id);
  return error;
}
