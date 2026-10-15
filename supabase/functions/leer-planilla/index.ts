// Lee la foto de una planilla manuscrita de cuentas por pagar y devuelve sus filas
// estructuradas. Usa la API de Anthropic (secreto ANTHROPIC_API_KEY).
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MODELO = "claude-sonnet-5-5";

const responder = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const HERRAMIENTA = {
  name: "registrar_planilla",
  description: "Registra el contenido leído de la planilla de cuentas por pagar.",
  input_schema: {
    type: "object",
    properties: {
      mes: { type: ["integer", "null"], description: "Mes de la planilla (1-12), del encabezado 'Mes:'." },
      anio: { type: ["integer", "null"], description: "Año de la planilla, del encabezado 'Año:'." },
      filas: {
        type: "array",
        items: {
          type: "object",
          properties: {
            seccion: { type: "string", description: "Nombre de la propiedad/sección tal como aparece impreso (ej. 'Casa Talca')." },
            concepto: { type: "string", description: "Concepto impreso de la fila (ej. 'Luz CGE', 'Gastos Comunes')." },
            numero_cliente: { type: ["string", "null"], description: "Número de cliente impreso, tal cual (con guion si lo tiene)." },
            valor: { type: ["integer", "null"], description: "Monto en pesos chilenos como entero, sin puntos. null si no hay monto." },
            estado: { type: ["string", "null"], enum: ["Pagado", "Pendiente", null], description: "'Pagado' si hay una P o check en Estado; 'Pendiente' si está vacío pero hay monto." },
            fecha_pago: { type: ["string", "null"], description: "Fecha de pago escrita al margen en formato YYYY-MM-DD, o null." },
            dudoso: { type: "boolean", description: "true si algún dato de la fila es difícil de leer o ambiguo." },
            nota: { type: ["string", "null"], description: "Explicación breve de la duda, si la hay." },
          },
          required: ["seccion", "concepto", "numero_cliente", "valor", "estado", "fecha_pago", "dudoso"],
        },
      },
    },
    required: ["mes", "anio", "filas"],
  },
};

const INSTRUCCIONES = `Eres un asistente que transcribe planillas manuscritas chilenas de "cuentas personales por pagar".

La planilla tiene secciones por propiedad (filas grises con el nombre, ej. "Casa Talca"), y debajo filas con: Concepto impreso | Número Cliente impreso | Valor a Pagar (manuscrito) | Estado (manuscrito, normalmente "P" = pagado, con check). A la derecha, al margen, suele estar la fecha de pago (dd/mm/aa) y a veces correcciones del monto.

Reglas:
- Devuelve UNA fila por cada fila impresa que tenga un monto escrito. Omite filas sin monto, con solo un guion "-", o con solo un check sin número.
- Montos: formato chileno, el punto separa miles ("81.054" = 81054). Devuélvelos como entero.
- Si un monto está tachado y reescrito, o corregido al margen (ej. "$81.054" al lado), usa el valor corregido y marca dudoso=true con una nota.
- Si una llave "}" agrupa varias filas con un solo monto pero al margen hay un desglose (ej. 207.377 y 24.776 = 232.153), asigna cada parte del desglose a su fila. Si no hay desglose, pon el monto total en la primera fila y explica en nota.
- Fechas al margen "15/07/26" → "2026-07-15". Una llave con una fecha aplica a todas las filas que abarca.
- Números de cliente: transcríbelos exactamente como están impresos.
- Marca dudoso=true cuando dudes de cualquier dígito; no inventes datos: usa null si no se puede leer.
- Usa las pistas de números de cliente conocidos para verificar tu lectura de los números impresos, pero los montos siempre vienen solo de la foto.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return responder(405, { error: "metodo" });

  // Toma solo la key (sk-ant-...) aunque el secreto se haya pegado con texto extra alrededor.
  const apiKey = (Deno.env.get("ANTHROPIC_API_KEY") ?? "").match(/sk-ant-[A-Za-z0-9_-]+/)?.[0];
  if (!Deno.env.get("ANTHROPIC_API_KEY")) {
    return responder(503, {
      error: "sin_key",
      mensaje: "La lectura automática aún no está activada (falta la API key de Anthropic).",
    });
  }
  if (!apiKey) {
    return responder(503, {
      error: "key_invalida",
      mensaje: "La API key guardada no tiene el formato correcto (debe empezar con sk-ant-).",
    });
  }

  let body: { imagen?: string; imagenes?: string[]; media_type?: string; pistas?: unknown };
  try {
    body = await req.json();
  } catch {
    return responder(400, { error: "cuerpo", mensaje: "Solicitud inválida." });
  }
  // Una foto, o varias páginas (un PDF convertido a imágenes en el teléfono).
  const imagenes = (Array.isArray(body.imagenes) ? body.imagenes : [body.imagen]).filter(
    (x): x is string => typeof x === "string" && x.length > 0,
  );
  if (imagenes.length === 0) return responder(400, { error: "sin_imagen", mensaje: "No llegó la imagen." });
  if (imagenes.length > 4) return responder(413, { error: "muchas_paginas", mensaje: "Máximo 4 páginas por planilla." });
  if (imagenes.reduce((s, x) => s + x.length, 0) > 20_000_000) {
    return responder(413, { error: "imagen_grande", mensaje: "El archivo es demasiado grande." });
  }

  let respuesta: Response;
  try {
    respuesta = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODELO,
      max_tokens: 8000,
      system: INSTRUCCIONES,
      tools: [HERRAMIENTA],
      tool_choice: { type: "tool", name: HERRAMIENTA.name },
      messages: [
        {
          role: "user",
          content: [
            ...imagenes.map((data) => ({
              type: "image",
              source: { type: "base64", media_type: body.media_type || "image/jpeg", data },
            })),
            {
              type: "text",
              text: `Transcribe esta planilla${imagenes.length > 1 ? ` (son ${imagenes.length} páginas, en orden; devuelve las filas de todas)` : ""}. Pistas (propiedades y números de cliente conocidos en la app):\n${JSON.stringify(body.pistas ?? [])}`,
            },
          ],
        },
      ],
    }),
    });
  } catch (e) {
    // Nunca registrar el mensaje original: podría incluir los encabezados con la key.
    console.error("Fallo al llamar a Anthropic:", e instanceof Error ? e.name : "error");
    return responder(502, { error: "ia", mensaje: "No se pudo conectar con el servicio de lectura." });
  }

  if (!respuesta.ok) {
    const detalle = await respuesta.text();
    console.error("Anthropic error", respuesta.status, detalle.slice(0, 500));
    const sinCredito = respuesta.status === 401 || respuesta.status === 403;
    return responder(502, {
      error: sinCredito ? "key_invalida" : "ia",
      mensaje: sinCredito ? "La API key no es válida o no tiene crédito." : "No se pudo leer la planilla. Intenta de nuevo.",
    });
  }

  const json = await respuesta.json();
  const uso = json.content?.find((c: { type: string }) => c.type === "tool_use");
  if (!uso?.input) return responder(502, { error: "ia", mensaje: "La lectura no devolvió datos." });
  return responder(200, uso.input);
});
