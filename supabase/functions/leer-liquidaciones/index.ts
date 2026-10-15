// Lee liquidaciones de sueldo chilenas (PDF convertido a imágenes, o fotos) y devuelve los
// datos de cada una. Usa la API de Anthropic (secreto ANTHROPIC_API_KEY).
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MODELO = "claude-sonnet-5-5";
const MAX_PAGINAS = 12;

const responder = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const monto = (d: string) => ({ type: ["integer", "null"], description: `${d} en pesos, entero sin puntos.` });

const HERRAMIENTA = {
  name: "registrar_liquidaciones",
  description: "Registra los datos de cada liquidación de sueldo encontrada.",
  input_schema: {
    type: "object",
    properties: {
      liquidaciones: {
        type: "array",
        items: {
          type: "object",
          properties: {
            paginas: { type: "array", items: { type: "integer" }, description: "Números de página (desde 1) que ocupa esta liquidación." },
            nombre_trabajador: { type: "string", description: "Nombre completo del trabajador tal como aparece." },
            rut_trabajador: { type: ["string", "null"], description: "RUT del trabajador con puntos y guion, ej. 10.588.070-7." },
            empleador: { type: ["string", "null"], description: "Razón social del empleador." },
            rut_empleador: { type: ["string", "null"] },
            mes: { type: ["integer", "null"], description: "Mes de remuneraciones (1-12)." },
            anio: { type: ["integer", "null"] },
            total_imponible: monto("Total imponible"),
            total_haberes: monto("Total haberes"),
            descuentos_legales: monto("Total descuentos legales (previsión + salud + cesantía)"),
            total_descuentos: monto("Total descuentos"),
            alcance_liquido: monto("Alcance líquido a pagar"),
            dudoso: { type: "boolean", description: "true si algún dato es ilegible o ambiguo." },
            nota: { type: ["string", "null"] },
          },
          required: ["paginas", "nombre_trabajador", "rut_trabajador", "mes", "anio", "alcance_liquido", "dudoso"],
        },
      },
    },
    required: ["liquidaciones"],
  },
};

const INSTRUCCIONES = `Transcribes liquidaciones de sueldo chilenas (formato Nubox u otros). Cada imagen es una página, en orden.

Reglas:
- Devuelve una entrada por cada trabajador/liquidación. Si una liquidación ocupa varias páginas, lista todas en "paginas".
- Montos en formato chileno: el punto separa miles ("861.984" = 861984). Devuélvelos como enteros.
- "alcance_liquido" es el ALCANCE LÍQUIDO / LÍQUIDO A PAGAR. Verifica que sea total haberes menos total descuentos; si no cuadra, marca dudoso=true y explica en nota.
- El mes viene de "REMUNERACIONES MES DE: ..." (SEPTIEMBRE = 9).
- No inventes datos: usa null si algo no se lee.

Responde SIEMPRE llamando a la herramienta registrar_liquidaciones, sin texto adicional.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return responder(405, { error: "metodo" });

  const secreto = Deno.env.get("ANTHROPIC_API_KEY");
  if (!secreto) {
    return responder(503, { error: "sin_key", mensaje: "La lectura automática no está activada (falta la API key)." });
  }
  const apiKey = secreto.match(/sk-ant-[A-Za-z0-9_-]+/)?.[0];
  if (!apiKey) {
    return responder(503, { error: "key_invalida", mensaje: "La API key guardada no tiene el formato correcto." });
  }

  let body: { imagenes?: string[]; media_type?: string };
  try {
    body = await req.json();
  } catch {
    return responder(400, { error: "cuerpo", mensaje: "Solicitud inválida." });
  }
  const imagenes = (body.imagenes ?? []).filter((x): x is string => typeof x === "string" && x.length > 0);
  if (imagenes.length === 0) return responder(400, { error: "sin_imagen", mensaje: "No llegó el documento." });
  if (imagenes.length > MAX_PAGINAS) {
    return responder(413, { error: "muchas_paginas", mensaje: `Máximo ${MAX_PAGINAS} páginas por carga.` });
  }
  if (imagenes.reduce((s, x) => s + x.length, 0) > 25_000_000) {
    return responder(413, { error: "imagen_grande", mensaje: "El archivo es demasiado grande." });
  }

  let respuesta: Response;
  try {
    respuesta = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: MODELO,
        max_tokens: 16000,
        system: INSTRUCCIONES,
        tools: [HERRAMIENTA],
        tool_choice: { type: "auto" },
        messages: [
          {
            role: "user",
            content: [
              ...imagenes.flatMap((data, i) => [
                { type: "text", text: `Página ${i + 1}:` },
                { type: "image", source: { type: "base64", media_type: body.media_type || "image/jpeg", data } },
              ]),
              { type: "text", text: "Registra todas las liquidaciones de estas páginas." },
            ],
          },
        ],
      }),
    });
  } catch (e) {
    // No registrar el mensaje original: podría incluir los encabezados con la key.
    console.error("Fallo al llamar a Anthropic:", e instanceof Error ? e.name : "error");
    return responder(502, { error: "ia", mensaje: "No se pudo conectar con el servicio de lectura." });
  }

  if (!respuesta.ok) {
    const detalle = await respuesta.text();
    console.error("Anthropic error", respuesta.status, detalle.slice(0, 500));
    const sinCredito = respuesta.status === 401 || respuesta.status === 403;
    return responder(502, {
      error: sinCredito ? "key_invalida" : "ia",
      mensaje: sinCredito ? "La API key no es válida o no tiene crédito." : "No se pudo leer el documento. Intenta de nuevo.",
    });
  }

  const json = await respuesta.json();
  const bloques: Array<{ type: string; input?: unknown; text?: string }> = json.content ?? [];
  const uso = bloques.find((c) => c.type === "tool_use");
  if (uso?.input) return responder(200, uso.input);

  const texto = bloques.filter((c) => c.type === "text").map((c) => c.text ?? "").join("\n");
  const inicio = texto.indexOf("{");
  const fin = texto.lastIndexOf("}");
  if (inicio !== -1 && fin > inicio) {
    try {
      const datos = JSON.parse(texto.slice(inicio, fin + 1));
      if (Array.isArray(datos?.liquidaciones)) return responder(200, datos);
    } catch {
      /* sigue abajo */
    }
  }
  console.error("Respuesta sin datos", json.stop_reason);
  return responder(502, { error: "ia", mensaje: "La lectura no devolvió datos." });
});
