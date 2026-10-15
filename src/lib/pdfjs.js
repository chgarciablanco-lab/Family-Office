// Carga pdf.js eligiendo la versión según el navegador.
// La versión normal de pdfjs-dist 6 usa Map.prototype.getOrInsertComputed, que Safari/iOS
// recientes ya tienen pero algunos navegadores todavía no; para esos existe la versión
// "legacy", que la trae incluida. Si una versión falla al abrir un PDF, se prueba la otra.
const cache = {};

function cargarVariante(variante) {
  if (!cache[variante]) {
    cache[variante] = (
      variante === "moderno"
        ? Promise.all([
            import("pdfjs-dist/build/pdf.mjs"),
            import("pdfjs-dist/build/pdf.worker.min.mjs?url").then((m) => m.default),
          ])
        : Promise.all([
            import("pdfjs-dist/legacy/build/pdf.mjs"),
            import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url").then((m) => m.default),
          ])
    )
      .then(([pdfjs, workerUrl]) => {
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
        return pdfjs;
      })
      .catch((e) => {
        delete cache[variante];
        throw e;
      });
  }
  return cache[variante];
}

let varianteQueFunciona = null;

// Abre un PDF (URL o { data }) probando primero la versión que corresponde al navegador.
export async function abrirPdf(fuente) {
  const preferida = typeof Map.prototype.getOrInsertComputed === "function" ? "moderno" : "legacy";
  const orden = varianteQueFunciona
    ? [varianteQueFunciona, varianteQueFunciona === "moderno" ? "legacy" : "moderno"]
    : [preferida, preferida === "moderno" ? "legacy" : "moderno"];

  let ultimoError;
  for (const variante of orden) {
    try {
      const pdfjs = await cargarVariante(variante);
      // getDocument consume el buffer: se pasa una copia por si hay que reintentar.
      // pdfjs-dist 6 ya no acepta la URL como texto suelto: hay que pasar { url }.
      const param = typeof fuente === "string" ? { url: fuente } : fuente?.data ? { data: fuente.data.slice(0) } : fuente;
      const pdf = await pdfjs.getDocument(param).promise;
      await pdf.getPage(1); // fuerza el primer uso real de la librería
      varianteQueFunciona = variante;
      return pdf;
    } catch (e) {
      ultimoError = e;
    }
  }
  throw ultimoError;
}
