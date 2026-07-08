import { supabase } from "./supabaseClient";

export async function fetchNotas() {
  const { data, error } = await supabase
    .from("notas")
    .select("*, profiles:created_by(nombre)")
    .order("updated_at", { ascending: false });
  if (error) return [];
  return data || [];
}

export async function fetchNota(id) {
  const { data, error } = await supabase
    .from("notas")
    .select("*, profiles:created_by(nombre)")
    .eq("id", id)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function crearNota({ titulo, contenido, color }) {
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase.from("notas").insert({
    titulo, contenido: contenido || null, color: color || "amber",
    created_by: userData?.user?.id ?? null,
  });
  return error;
}

export async function actualizarNota(id, { titulo, contenido, color }) {
  const { error } = await supabase
    .from("notas")
    .update({ titulo, contenido: contenido || null, color: color || "amber", updated_at: new Date().toISOString() })
    .eq("id", id);
  return error;
}

export async function eliminarNota(id) {
  const { error } = await supabase.from("notas").delete().eq("id", id);
  return error;
}
