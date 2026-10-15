import React, { useEffect, useState } from "react";
import { HardDrive, Loader2, RefreshCw } from "lucide-react";
import { estadoDrive, urlAutorizacionDrive, sincronizarDrive, desconectarDrive } from "../lib/googleDrive";

const MENSAJES_RETORNO = {
  conectado: { tipo: "ok", texto: "Google Drive quedó conectado. El primer respaldo ya comenzó." },
  cancelado: { tipo: "error", texto: "Se canceló la autorización de Google." },
  error: { tipo: "error", texto: "No se pudo conectar Google Drive" },
};

function haceCuanto(fecha) {
  if (!fecha) return "nunca";
  const min = Math.round((Date.now() - new Date(fecha).getTime()) / 60000);
  if (min < 1) return "recién";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  return new Date(fecha).toLocaleDateString("es-CL", { day: "numeric", month: "short" });
}

// Tarjeta del Perfil (solo administradores) para conectar Drive y ver el estado del respaldo.
export default function GoogleDriveCard() {
  const [estado, setEstado] = useState(null);
  const [ocupado, setOcupado] = useState("");
  const [aviso, setAviso] = useState(null);
  const [confirmarDesconexion, setConfirmarDesconexion] = useState(false);

  const cargar = () => estadoDrive().then(setEstado);

  useEffect(() => {
    // Volviendo desde la autorización de Google: ?drive=conectado|cancelado|error&motivo=...
    const params = new URLSearchParams(window.location.search);
    const retorno = params.get("drive");
    if (retorno && MENSAJES_RETORNO[retorno]) {
      const m = MENSAJES_RETORNO[retorno];
      setAviso({ tipo: m.tipo, texto: params.get("motivo") ? `${m.texto}: ${params.get("motivo")}.` : m.texto });
      window.history.replaceState(null, "", window.location.pathname);
    }
    cargar();
  }, []);

  if (estado === null || estado?.error) return null; // no es admin o no hay tablas aún

  const conectar = async () => {
    setOcupado("conectar");
    setAviso(null);
    const r = await urlAutorizacionDrive();
    if (r?.url) {
      window.location.href = r.url;
      return;
    }
    setOcupado("");
    setAviso({ tipo: "error", texto: r?.mensaje || "No se pudo iniciar la conexión." });
  };

  const respaldarAhora = async () => {
    setOcupado("sincronizar");
    setAviso(null);
    const r = await sincronizarDrive();
    setOcupado("");
    if (r?.error || r?.ok === false) {
      setAviso({ tipo: "error", texto: r?.mensaje || "No se pudo respaldar." });
    } else {
      const partes = [];
      if (r.subidos) partes.push(`${r.subidos} subido${r.subidos === 1 ? "" : "s"}`);
      if (r.movidos) partes.push(`${r.movidos} actualizado${r.movidos === 1 ? "" : "s"}`);
      if (r.eliminados) partes.push(`${r.eliminados} a la papelera`);
      if (r.pendientes) partes.push(`${r.pendientes} quedan para la próxima pasada`);
      setAviso({
        tipo: r.errores?.length ? "error" : "ok",
        texto: `${partes.length ? partes.join(" · ") : "Todo estaba al día"}.${r.errores?.length ? ` Con ${r.errores.length} error(es).` : ""}`,
      });
    }
    cargar();
  };

  const desconectar = async () => {
    setConfirmarDesconexion(false);
    setOcupado("desconectar");
    await desconectarDrive();
    setOcupado("");
    setAviso({ tipo: "ok", texto: "Drive desconectado. Los archivos ya respaldados siguen en tu Drive." });
    cargar();
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
          <HardDrive className="w-5 h-5 text-emerald-600" strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 text-sm">Google Drive</p>
          <p className="text-xs text-slate-500 mt-0.5 truncate">
            {estado.conectado
              ? `Conectado · ${estado.email || "cuenta de Google"}`
              : "Respaldo automático de documentos e importación desde Drive"}
          </p>
        </div>
      </div>

      {estado.conectado && (
        <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center">
          <div className="bg-slate-50 rounded-lg py-2">
            <p className="text-[10px] text-slate-400">Respaldados</p>
            <p className="text-sm font-bold text-slate-800">{estado.respaldados} de {estado.total}</p>
          </div>
          <div className="bg-slate-50 rounded-lg py-2">
            <p className="text-[10px] text-slate-400">Último respaldo</p>
            <p className="text-sm font-bold text-slate-800">{haceCuanto(estado.ultimo_respaldo_at)}</p>
          </div>
        </div>
      )}
      {estado.conectado && estado.ultimo_error && (
        <p className="text-[11px] text-amber-700 mt-2">{estado.ultimo_error}</p>
      )}
      {aviso && (
        <p className={`text-xs mt-2 ${aviso.tipo === "ok" ? "text-emerald-600" : "text-red-500"}`}>{aviso.texto}</p>
      )}

      <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
        {!estado.conectado ? (
          <button
            onClick={conectar}
            disabled={!!ocupado}
            className="flex-1 bg-emerald-600 text-white font-semibold text-xs rounded-xl py-2.5 flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {ocupado === "conectar" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Conectar con Google Drive
          </button>
        ) : (
          <>
            <button
              onClick={respaldarAhora}
              disabled={!!ocupado}
              className="flex-1 bg-emerald-600 text-white font-semibold text-xs rounded-xl py-2.5 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {ocupado === "sincronizar" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Respaldar ahora
            </button>
            {confirmarDesconexion ? (
              <button
                onClick={desconectar}
                disabled={!!ocupado}
                className="flex-1 bg-red-50 text-red-600 font-semibold text-xs rounded-xl py-2.5 disabled:opacity-50"
              >
                ¿Seguro? Desconectar
              </button>
            ) : (
              <button
                onClick={() => setConfirmarDesconexion(true)}
                disabled={!!ocupado}
                className="flex-1 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl py-2.5 disabled:opacity-50"
              >
                Desconectar
              </button>
            )}
          </>
        )}
      </div>
      {estado.conectado && (
        <p className="text-[10.5px] text-slate-400 mt-2">
          Se respalda solo cada 10 minutos en la carpeta "GB Gestión" de tu Drive. Los documentos privados de cada
          usuario no se respaldan.
        </p>
      )}
    </div>
  );
}
