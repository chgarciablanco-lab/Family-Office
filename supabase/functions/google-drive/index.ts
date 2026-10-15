// Integración con Google Drive (permiso drive.file: la app solo ve lo que ella crea o lo que
// el usuario elige en el selector de Drive).
//
//   GET  ?code=...&state=...      → retorno de la autorización de Google (guarda el refresh token)
//   POST ?accion=url              → URL para autorizar (admin)
//   POST ?accion=token            → access token + datos para el selector de Drive (admin)
//   POST ?accion=sincronizar      → respalda en Drive lo pendiente (admin o cron con x-cron-secret)
//   POST ?accion=desconectar      → revoca y borra la conexión (admin)
import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

const APP_URL = "https://family-office-pink.vercel.app";
const PERSONA_DOC_ID = "00000000-0000-0000-0000-000000000001";
const RAIZ = "GB Gestión";
const CARPETA_MIME = "application/vnd.google-apps.folder";
const MAX_SUBIDAS_POR_CORRIDA = 25;
const PRESUPUESTO_MS = 100_000;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const redirigir = (params: Record<string, string>) =>
  new Response(null, { status: 302, headers: { Location: `${APP_URL}/?${new URLSearchParams(params)}` } });

const env = (k: string) => Deno.env.get(k) ?? "";
const SUPABASE_URL = env("SUPABASE_URL");
const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/google-drive`;

function admin() {
  return createClient(SUPABASE_URL, env("SUPABASE_SERVICE_ROLE_KEY"));
}

function faltaConfig() {
  return ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"].filter((k) => !env(k));
}

async function usuarioAdmin(req: Request, sb: SupabaseClient) {
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!jwt) return null;
  const { data } = await sb.auth.getUser(jwt);
  if (!data?.user) return null;
  const { data: perfil } = await sb.from("profiles").select("rol").eq("id", data.user.id).maybeSingle();
  return perfil?.rol === "admin" ? data.user : null;
}

// ---------------------------------------------------------------------------
// OAuth
// ---------------------------------------------------------------------------

async function accessToken(sb: SupabaseClient) {
  const { data: con } = await sb.from("drive_conexion").select("*").eq("id", 1).maybeSingle();
  if (!con) return { error: "sin_conexion" as const };
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env("GOOGLE_CLIENT_ID"),
      client_secret: env("GOOGLE_CLIENT_SECRET"),
      refresh_token: con.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  const t = await r.json();
  if (!r.ok || !t.access_token) {
    const motivo = t.error === "invalid_grant"
      ? "Google cortó el permiso. Vuelve a conectar Google Drive."
      : `No se pudo renovar el acceso a Drive (${t.error ?? r.status}).`;
    await sb.from("drive_conexion").update({ ultimo_error: motivo }).eq("id", 1);
    return { error: "token" as const, mensaje: motivo };
  }
  return { token: t.access_token as string, expira: t.expires_in as number, conexion: con };
}

function emailDeIdToken(idToken?: string) {
  try {
    const payload = JSON.parse(atob(idToken!.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.email as string;
  } catch {
    return null;
  }
}

async function callback(url: URL, sb: SupabaseClient) {
  const code = url.searchParams.get("code");
  const estado = url.searchParams.get("state");
  if (url.searchParams.get("error")) return redirigir({ drive: "cancelado" });
  if (!code || !estado) return redirigir({ drive: "error", motivo: "respuesta incompleta" });

  const { data: e } = await sb.from("drive_oauth_estados").select("*").eq("estado", estado).maybeSingle();
  await sb.from("drive_oauth_estados").delete().eq("estado", estado);
  if (!e || Date.now() - new Date(e.created_at).getTime() > 15 * 60_000) {
    return redirigir({ drive: "error", motivo: "la autorización expiró, intenta de nuevo" });
  }

  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env("GOOGLE_CLIENT_ID"),
      client_secret: env("GOOGLE_CLIENT_SECRET"),
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  const t = await r.json();
  if (!r.ok || !t.refresh_token) {
    console.error("Intercambio de código fallido", r.status, t.error);
    return redirigir({ drive: "error", motivo: t.error ?? "no llegó el permiso permanente" });
  }

  const email = emailDeIdToken(t.id_token);
  const { data: anterior } = await sb.from("drive_conexion").select("email").eq("id", 1).maybeSingle();
  if (anterior && anterior.email !== email) {
    // Otra cuenta de Google: lo respaldado antes está en otro Drive, se parte de cero.
    await sb.from("drive_respaldos").delete().neq("documento_id", "00000000-0000-0000-0000-000000000000");
    await sb.from("drive_carpetas").delete().neq("ruta", "");
  }
  await sb.from("drive_conexion").upsert({
    id: 1, user_id: e.user_id, email, refresh_token: t.refresh_token,
    conectado_at: new Date().toISOString(), ultimo_error: null,
  });
  // Primer respaldo en segundo plano (waitUntil evita que se corte al responder).
  const primerRespaldo = sincronizar(sb).catch((e) => console.error("Primer respaldo:", e?.message ?? e));
  (globalThis as any).EdgeRuntime?.waitUntil?.(primerRespaldo);
  return redirigir({ drive: "conectado" });
}

async function secretoCron(sb: SupabaseClient) {
  const { data } = await sb.rpc("get_vault_secret", { secret_name: "cron_shared_secret" });
  return data as string | null;
}

// ---------------------------------------------------------------------------
// Drive
// ---------------------------------------------------------------------------

async function drive(token: string, path: string, init: RequestInit = {}) {
  const r = await fetch(`https://www.googleapis.com${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
  });
  const body = r.status === 204 ? null : await r.json().catch(() => null);
  return { ok: r.ok, status: r.status, body };
}

const limpiar = (s: string) => (s || "Sin nombre").replace(/[\/\\]/g, "-").trim() || "Sin nombre";

async function asegurarCarpeta(sb: SupabaseClient, token: string, segmentos: string[], cache: Map<string, string>) {
  let padre = "root";
  let ruta = "";
  for (const seg of segmentos) {
    ruta = ruta ? `${ruta}/${seg}` : seg;
    let id = cache.get(ruta);
    if (!id) {
      const r = await drive(token, "/drive/v3/files?fields=id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: seg, mimeType: CARPETA_MIME, parents: [padre] }),
      });
      if (!r.ok) throw new Error(`No se pudo crear la carpeta "${ruta}" en Drive (${r.status})`);
      id = r.body.id as string;
      cache.set(ruta, id);
      await sb.from("drive_carpetas").upsert({ ruta, drive_id: id });
    }
    padre = id;
  }
  return padre;
}

// Ruta en Drive de cada documento compartido (los privados de cada usuario no se respaldan).
async function rutasDocumentos(sb: SupabaseClient) {
  const [docs, carpetas, socs, props, trabs, autos] = await Promise.all([
    sb.from("documentos").select("id, nombre, storage_path, content_type, entidad_tipo, entidad_id, carpeta_id"),
    sb.from("carpetas").select("id, nombre, carpeta_padre_id"),
    sb.from("sociedades").select("id, nombre, owner_user_id"),
    sb.from("propiedades").select("id, nombre, sociedad_id, owner_user_id"),
    sb.from("trabajadores").select("id, nombre, sociedad_id, owner_user_id"),
    sb.from("autos").select("id, marca, modelo, patente, owner_user_id"),
  ]);
  const mapa = <T extends { id: string }>(xs: T[] | null) => new Map((xs ?? []).map((x) => [x.id, x]));
  const C = mapa(carpetas.data), S = mapa(socs.data), P = mapa(props.data), T = mapa(trabs.data), A = mapa(autos.data);

  const base = (tipo: string, id: string): string[] | null => {
    const deSociedad = (sid: string | null, owner: string | null, grupo: string, nombre: string) => {
      if (owner) return null;
      if (sid) {
        const s = S.get(sid);
        if (!s || s.owner_user_id) return null;
        return [RAIZ, "Sociedades", limpiar(s.nombre), grupo, limpiar(nombre)];
      }
      return [RAIZ, "Gestión familiar", grupo, limpiar(nombre)];
    };
    if (tipo === "persona") return id === PERSONA_DOC_ID ? [RAIZ, "Gestión familiar", "Documentos generales"] : null;
    if (tipo === "sociedad") {
      const s = S.get(id);
      return s && !s.owner_user_id ? [RAIZ, "Sociedades", limpiar(s.nombre), "Documentos generales"] : null;
    }
    if (tipo === "propiedad") {
      const p = P.get(id);
      return p ? deSociedad(p.sociedad_id, p.owner_user_id, "Propiedades", p.nombre) : null;
    }
    if (tipo === "trabajador") {
      const t = T.get(id);
      return t ? deSociedad(t.sociedad_id, t.owner_user_id, "Trabajadores", t.nombre) : null;
    }
    if (tipo === "auto") {
      const a = A.get(id);
      return a && !a.owner_user_id
        ? [RAIZ, "Gestión familiar", "Autos", limpiar([a.marca, a.modelo, a.patente].filter(Boolean).join(" "))]
        : null;
    }
    return null;
  };

  const cadena = (carpetaId: string | null) => {
    const r: string[] = [];
    const vistos = new Set<string>();
    let c = carpetaId ? C.get(carpetaId) : null;
    while (c && !vistos.has(c.id)) {
      vistos.add(c.id);
      r.unshift(limpiar(c.nombre));
      c = c.carpeta_padre_id ? C.get(c.carpeta_padre_id) : null;
    }
    return r;
  };

  const resultado = new Map<string, { doc: any; segmentos: string[]; ruta: string }>();
  for (const d of docs.data ?? []) {
    const b = base(d.entidad_tipo, d.entidad_id);
    if (!b) continue;
    const segmentos = [...b, ...cadena(d.carpeta_id)];
    resultado.set(d.id, { doc: d, segmentos, ruta: segmentos.join("/") });
  }
  return resultado;
}

function cuerpoMultipart(metadata: unknown, archivo: Blob, tipo: string) {
  const limite = `gbgestion${crypto.randomUUID().replace(/-/g, "")}`;
  const cuerpo = new Blob([
    `--${limite}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
    `--${limite}\r\nContent-Type: ${tipo}\r\n\r\n`,
    archivo,
    `\r\n--${limite}--`,
  ]);
  return { cuerpo, tipoContenido: `multipart/related; boundary=${limite}` };
}

async function sincronizar(sb: SupabaseClient) {
  const inicio = Date.now();
  const acceso = await accessToken(sb);
  if ("error" in acceso) {
    return { ok: acceso.error === "sin_conexion", mensaje: acceso.error === "sin_conexion" ? "Drive no está conectado" : acceso.mensaje };
  }
  const { token } = acceso;

  const { data: cacheFilas } = await sb.from("drive_carpetas").select("ruta, drive_id");
  const cache = new Map((cacheFilas ?? []).map((f) => [f.ruta, f.drive_id]));
  const { data: respaldosFilas } = await sb.from("drive_respaldos").select("*");
  const respaldos = new Map((respaldosFilas ?? []).map((r) => [r.documento_id, r]));
  const rutas = await rutasDocumentos(sb);

  const resumen = { subidos: 0, movidos: 0, eliminados: 0, pendientes: 0, errores: [] as string[] };
  const queda = () => Date.now() - inicio < PRESUPUESTO_MS;

  // 1) Documentos borrados (o que pasaron a ser privados) → papelera de Drive.
  for (const [docId, r] of respaldos) {
    if (rutas.has(docId) || !queda()) continue;
    const res = await drive(token, `/drive/v3/files/${r.drive_file_id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trashed: true }),
    });
    if (res.ok || res.status === 404) {
      await sb.from("drive_respaldos").delete().eq("documento_id", docId);
      resumen.eliminados++;
    } else resumen.errores.push(`Papelera ${r.nombre}: ${res.status}`);
  }

  // 2) Movidos o renombrados.
  for (const [docId, { doc, segmentos, ruta }] of rutas) {
    const r = respaldos.get(docId);
    if (!r || (r.ruta === ruta && r.nombre === doc.nombre) || !queda()) continue;
    try {
      const params = new URLSearchParams({ fields: "id" });
      if (r.ruta !== ruta) {
        const nuevoPadre = await asegurarCarpeta(sb, token, segmentos, cache);
        const actual = await drive(token, `/drive/v3/files/${r.drive_file_id}?fields=parents`);
        if (actual.status === 404) {
          await sb.from("drive_respaldos").delete().eq("documento_id", docId); // se vuelve a subir
          respaldos.delete(docId);
          continue;
        }
        params.set("addParents", nuevoPadre);
        params.set("removeParents", (actual.body?.parents ?? []).join(","));
      }
      const res = await drive(token, `/drive/v3/files/${r.drive_file_id}?${params}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: doc.nombre }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await sb.from("drive_respaldos").update({ ruta, nombre: doc.nombre, sincronizado_at: new Date().toISOString() })
        .eq("documento_id", docId);
      resumen.movidos++;
    } catch (e) {
      resumen.errores.push(`Mover ${doc.nombre}: ${e instanceof Error ? e.message : e}`);
    }
  }

  // 3) Nuevos.
  for (const [docId, { doc, segmentos, ruta }] of rutas) {
    if (respaldos.has(docId)) continue;
    if (resumen.subidos >= MAX_SUBIDAS_POR_CORRIDA || !queda()) {
      resumen.pendientes++;
      continue;
    }
    try {
      const padre = await asegurarCarpeta(sb, token, segmentos, cache);
      const { data: blob, error } = await sb.storage.from("documentos").download(doc.storage_path);
      if (error || !blob) throw new Error("no se pudo leer el archivo");
      const tipo = doc.content_type || "application/octet-stream";
      const { cuerpo, tipoContenido } = cuerpoMultipart({ name: doc.nombre, parents: [padre] }, blob, tipo);
      const res = await drive(token, "/upload/drive/v3/files?uploadType=multipart&fields=id", {
        method: "POST",
        headers: { "Content-Type": tipoContenido },
        body: cuerpo,
      });
      if (res.status === 404) {
        // Alguna carpeta guardada ya no existe en Drive: se olvidan y se recrean la próxima vez.
        await sb.from("drive_carpetas").delete().like("ruta", `${RAIZ}%`);
        cache.clear();
        throw new Error("carpeta de Drive no encontrada (se recreará)");
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await sb.from("drive_respaldos").insert({ documento_id: docId, drive_file_id: res.body.id, ruta, nombre: doc.nombre });
      resumen.subidos++;
    } catch (e) {
      resumen.errores.push(`Subir ${doc.nombre}: ${e instanceof Error ? e.message : e}`);
    }
  }

  await sb.from("drive_conexion").update({
    ultimo_respaldo_at: new Date().toISOString(),
    ultimo_error: resumen.errores.length ? resumen.errores.slice(0, 3).join(" · ") : null,
  }).eq("id", 1);
  return { ok: true, ...resumen };
}

// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const url = new URL(req.url);
  const sb = admin();

  // Retorno desde Google (no trae JWT de la app).
  if (req.method === "GET" && (url.searchParams.has("code") || url.searchParams.has("error"))) {
    if (faltaConfig().length) return redirigir({ drive: "error", motivo: "faltan las credenciales de Google" });
    return callback(url, sb);
  }

  const accion = url.searchParams.get("accion");
  const esCron = !!req.headers.get("x-cron-secret") && req.headers.get("x-cron-secret") === (await secretoCron(sb));
  if (accion === "sincronizar" && esCron) {
    if (faltaConfig().length) return json(200, { ok: false, mensaje: "Drive no configurado" });
    return json(200, await sincronizar(sb));
  }

  const usuario = await usuarioAdmin(req, sb);
  if (!usuario) return json(401, { error: "no_autorizado", mensaje: "Solo un administrador puede usar Google Drive." });
  const falta = faltaConfig();
  if (falta.length) {
    return json(503, { error: "sin_config", mensaje: `Faltan secretos en Supabase: ${falta.join(", ")}.` });
  }

  if (accion === "url") {
    const estado = crypto.randomUUID();
    await sb.from("drive_oauth_estados").delete().lt("created_at", new Date(Date.now() - 3600_000).toISOString());
    await sb.from("drive_oauth_estados").insert({ estado, user_id: usuario.id });
    const params = new URLSearchParams({
      client_id: env("GOOGLE_CLIENT_ID"),
      redirect_uri: REDIRECT_URI,
      response_type: "code",
      scope: "openid email https://www.googleapis.com/auth/drive.file",
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
      state: estado,
    });
    return json(200, { url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
  }

  if (accion === "token") {
    const acceso = await accessToken(sb);
    if ("error" in acceso) return json(409, { error: acceso.error, mensaje: acceso.mensaje ?? "Drive no está conectado." });
    if (!env("GOOGLE_API_KEY") || !env("GOOGLE_APP_ID")) {
      return json(503, { error: "sin_config", mensaje: "Faltan GOOGLE_API_KEY o GOOGLE_APP_ID en Supabase." });
    }
    return json(200, {
      access_token: acceso.token,
      expira: acceso.expira,
      api_key: env("GOOGLE_API_KEY"),
      app_id: env("GOOGLE_APP_ID"),
      email: acceso.conexion.email,
    });
  }

  if (accion === "sincronizar") return json(200, await sincronizar(sb));

  if (accion === "desconectar") {
    const { data: con } = await sb.from("drive_conexion").select("refresh_token").eq("id", 1).maybeSingle();
    if (con) {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(con.refresh_token)}`, { method: "POST" })
        .catch(() => {});
    }
    await sb.from("drive_conexion").delete().eq("id", 1);
    await sb.from("drive_respaldos").delete().neq("documento_id", "00000000-0000-0000-0000-000000000000");
    await sb.from("drive_carpetas").delete().neq("ruta", "");
    return json(200, { ok: true });
  }

  return json(400, { error: "accion", mensaje: "Acción no válida." });
});
