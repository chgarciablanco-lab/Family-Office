// Recibe un documento (fotos o páginas de un PDF), reconoce qué es y extrae sus datos:
//  - planilla manuscrita de cuentas por pagar → filas por propiedad
//  - liquidaciones de sueldo → datos de cada trabajador
//  - cualquier otro documento → sugerencia de dónde guardarlo en Documentos
// Usa la API de Anthropic (secreto ANTHROPIC_API_KEY).
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

const HERRAMIENTAS = [
  {
    name: "registrar_planilla",
    description: "Úsala si el documento es una planilla (normalmente manuscrita) de cuentas por pagar con secciones por propiedad, números de cliente y montos.",
    input_schema: {
      type: "object",
      properties: {
        mes: { type: ["integer", "null"], description: "Mes de la planilla (1-12), del encabezado 'Mes:'." },
        anio: { type: ["integer", "null"], description: "Año, del encabezado 'Año:'." },
        filas: {
          type: "array",
          items: {
            type: "object",
            properties: {
              seccion: { type: "string", description: "Nombre impreso de la propiedad/sección (ej. 'Casa Talca')." },
              concepto: { type: "string", description: "Concepto impreso de la fila (ej. 'Luz CGE')." },
              numero_cliente: { type: ["string", "null"], description: "Número de cliente impreso, tal cual." },
              valor: monto("Monto"),
              estado: { type: ["string", "null"], enum: ["Pagado", "Pendiente", null], description: "'Pagado' si hay P o check; 'Pendiente' si hay monto sin marca." },
              fecha_pago: { type: ["string", "null"], description: "Fecha al margen como YYYY-MM-DD." },
              dudoso: { type: "boolean" },
              nota: { type: ["string", "null"] },
            },
            required: ["seccion", "concepto", "numero_cliente", "valor", "estado", "fecha_pago", "dudoso"],
          },
        },
      },
      required: ["mes", "anio", "filas"],
    },
  },
  {
    name: "registrar_liquidaciones",
    description: "Úsala si el documento son liquidaciones de sueldo (una o varias).",
    input_schema: {
      type: "object",
      properties: {
        liquidaciones: {
          type: "array",
          items: {
            type: "object",
            properties: {
              paginas: { type: "array", items: { type: "integer" }, description: "Páginas (desde 1) que ocupa la liquidación." },
              nombre_trabajador: { type: "string" },
              rut_trabajador: { type: ["string", "null"], description: "Con puntos y guion, ej. 10.588.070-7." },
              empleador: { type: ["string", "null"], description: "Razón social del empleador." },
              rut_empleador: { type: ["string", "null"] },
              mes: { type: ["integer", "null"], description: "Mes de remuneraciones (1-12)." },
              anio: { type: ["integer", "null"] },
              total_imponible: monto("Total imponible"),
              total_haberes: monto("Total haberes"),
              descuentos_legales: monto("Total descuentos legales"),
              total_descuentos: monto("Total descuentos"),
              alcance_liquido: monto("Alcance líquido a pagar"),
              dudoso: { type: "boolean" },
              nota: { type: ["string", "null"] },
            },
            required: ["paginas", "nombre_trabajador", "rut_trabajador", "mes", "anio", "alcance_liquido", "dudoso"],
          },
        },
      },
      required: ["liquidaciones"],
    },
  },
  {
    name: "registrar_otro_documento",
    description: "Úsala para cualquier otro documento (póliza, boleta, factura, contrato, escritura, certificado, etc.).",
    input_schema: {
      type: "object",
      properties: {
        tipo_documento: { type: "string", description: "Qué es, en pocas palabras (ej. 'Póliza de seguro hogar')." },
        resumen: { type: "string", description: "Una o dos frases con lo relevante: emisor, fechas, montos." },
        nombre_sugerido: { type: "string", description: "Nombre de archivo descriptivo, sin extensión (ej. 'Póliza Zurich hogar 2026-2027')." },
        destino_tipo: { type: ["string", "null"], enum: ["sociedad", "propiedad", "trabajador", "auto", "persona", null] },
        destino_id: { type: ["string", "null"], description: "id del destino, tomado SOLO de la lista de destinos entregada." },
        carpeta_sugerida: { type: ["string", "null"], description: "Nombre de carpeta corta para agruparlo (ej. 'Seguros', 'Contratos')." },
        motivo: { type: ["string", "null"], description: "Por qué ese destino (ej. 'la póliza menciona Curamavida 699, Las Condes')." },
      },
      required: ["tipo_documento", "resumen", "nombre_sugerido", "destino_tipo", "destino_id"],
    },
  },
];

const INSTRUCCIONES = `Recibes un documento chileno (fotos o páginas de un PDF, en orden). Primero decide qué es y luego llama a UNA herramienta:
- registrar_planilla: planilla de "cuentas por pagar" con secciones por propiedad, número de cliente, valor a pagar y estado.
- registrar_liquidaciones: liquidaciones de sueldo.
- registrar_otro_documento: cualquier otra cosa.

Reglas para planillas:
- Una fila por cada fila impresa con monto escrito; omite filas sin monto o con solo "-".
- Montos chilenos: el punto separa miles ("81.054" = 81054).
- Monto tachado y corregido (o corregido al margen): usa el corregido y marca dudoso=true con nota.
- Llave "}" que agrupa filas con desglose al margen: asigna cada parte a su fila.
- Fechas "15/07/26" → "2026-07-15"; una llave con fecha aplica a todas sus filas.
- Usa las pistas de números de cliente solo para verificar la lectura de los impresos.

Reglas para liquidaciones:
- Una entrada por trabajador; "alcance_liquido" es el ALCANCE LÍQUIDO / LÍQUIDO A PAGAR. Si no cuadra con haberes menos descuentos, dudoso=true.

Reglas para otros documentos:
- Elige destino_tipo y destino_id SOLO de la lista de destinos entregada, según direcciones, nombres, patentes, RUT o razones sociales que aparezcan. Si no hay pista clara, usa destino_tipo "persona" con el id de Gestión familiar.

En todos los casos: no inventes datos, usa null si algo no se lee y marca dudoso cuando dudes. Responde SOLO con la llamada a la herramienta.`;

const TIPO_POR_HERRAMIENTA: Record<string, string> = {
  registrar_planilla: "planilla",
  registrar_liquidaciones: "liquidaciones",
  registrar_otro_documento: "otro",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return responder(405, { error: "metodo" });

  const secreto = Deno.env.get("ANTHROPIC_API_KEY");
  if (!secreto) return responder(503, { error: "sin_key", mensaje: "La lectura automática no está activada (falta la API key)." });
  const apiKey = secreto.match(/sk-ant-[A-Za-z0-9_-]+/)?.[0];
  if (!apiKey) return responder(503, { error: "key_invalida", mensaje: "La API key guardada no tiene el formato correcto." });

  let body: { imagenes?: string[]; media_type?: string; pistas_planilla?: unknown; destinos?: unknown };
  try {
    body = await req.json();
  } catch {
    return responder(400, { error: "cuerpo", mensaje: "Solicitud inválida." });
  }
  const imagenes = (body.imagenes ?? []).filter((x): x is string => typeof x === "string" && x.length > 0);
  if (imagenes.length === 0) return responder(400, { error: "sin_imagen", mensaje: "No llegó el documento." });
  if (imagenes.length > MAX_PAGINAS) return responder(413, { error: "muchas_paginas", mensaje: `Máximo ${MAX_PAGINAS} páginas.` });
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
        tools: HERRAMIENTAS,
        tool_choice: { type: "auto" },
        messages: [
          {
            role: "user",
            content: [
              ...imagenes.flatMap((data, i) => [
                { type: "text", text: `Página ${i + 1}:` },
                { type: "image", source: { type: "base64", media_type: body.media_type || "image/jpeg", data } },
              ]),
              {
                type: "text",
                text:
                  `Pistas de planilla (propiedades y números de cliente conocidos):\n${JSON.stringify(body.pistas_planilla ?? [])}\n\n` +
                  `Destinos posibles para otros documentos:\n${JSON.stringify(body.destinos ?? [])}`,
              },
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
  const bloques: Array<{ type: string; name?: string; input?: unknown; text?: string }> = json.content ?? [];
  const uso = bloques.find((c) => c.type === "tool_use" && c.name && TIPO_POR_HERRAMIENTA[c.name]);
  if (uso?.input) return responder(200, { tipo: TIPO_POR_HERRAMIENTA[uso.name!], datos: uso.input });

  console.error("Respuesta sin herramienta", json.stop_reason);
  return responder(502, { error: "ia", mensaje: "No se pudo reconocer el documento. Intenta de nuevo." });
});
