import React, { useEffect, useState } from "react";
import { X, RefreshCw } from "lucide-react";
import { Field, inputClass } from "./TramiteSection";
import { MODULOS, fetchPermisos, crearUsuario, actualizarPermisos } from "../lib/usuarios";

function generarPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function permisosVacios() {
  return MODULOS.reduce((acc, m) => {
    acc[m.key] = { puede_ver: false, puede_editar: false };
    return acc;
  }, {});
}

export default function UsuarioForm({ usuario, onClose, onSaved }) {
  const esEdicion = Boolean(usuario);

  const [nombre, setNombre] = useState(usuario?.nombre || "");
  const [email, setEmail] = useState(usuario?.email || "");
  const [password, setPassword] = useState(esEdicion ? "" : generarPassword());
  const [rol, setRol] = useState(usuario?.rol || "ejecutivo");
  const [permisos, setPermisos] = useState(permisosVacios());
  const [loadingPermisos, setLoadingPermisos] = useState(esEdicion);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!esEdicion) return;
    fetchPermisos(usuario.id).then((data) => {
      const mapa = permisosVacios();
      data.forEach((p) => {
        mapa[p.modulo] = { puede_ver: p.puede_ver, puede_editar: p.puede_editar };
      });
      setPermisos(mapa);
      setLoadingPermisos(false);
    });
  }, [esEdicion, usuario]);

  const togglePermiso = (modulo, campo) => {
    setPermisos((prev) => {
      const actual = prev[modulo];
      const siguiente = { ...actual, [campo]: !actual[campo] };
      if (campo === "puede_editar" && siguiente.puede_editar) siguiente.puede_ver = true;
      if (campo === "puede_ver" && !siguiente.puede_ver) siguiente.puede_editar = false;
      return { ...prev, [modulo]: siguiente };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const permisosArray = MODULOS.map((m) => ({ modulo: m.key, ...permisos[m.key] }));

    const resultado = esEdicion
      ? await actualizarPermisos({ profile_id: usuario.id, rol, permisos: permisosArray })
      : await crearUsuario({ nombre, email, password, rol, permisos: permisosArray });

    setSaving(false);
    if (resultado.error) {
      setError(resultado.error);
      return;
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">{esEdicion ? "Editar permisos" : "Nuevo usuario"}</h2>
          <button onClick={onClose} aria-label="Cerrar">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" className="p-5 flex flex-col gap-4">
          {!esEdicion && (
            <>
              <Field label="Nombre">
                <input
                  autoComplete="off"
                  required
                  className={inputClass}
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre completo"
                />
              </Field>
              <Field label="Correo electrónico">
                <input
                  autoComplete="off"
                  required
                  type="email"
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                />
              </Field>
              <Field label="Contraseña temporal">
                <div className="flex items-center gap-2">
                  <input
                    autoComplete="off"
                    required
                    className={inputClass}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setPassword(generarPassword())}
                    aria-label="Generar otra contraseña"
                    className="shrink-0 w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center"
                  >
                    <RefreshCw className="w-4 h-4 text-slate-500" strokeWidth={2} />
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">Se enviará por correo a la persona junto con su usuario.</p>
              </Field>
            </>
          )}

          {esEdicion && (
            <div className="bg-slate-50 rounded-xl px-3.5 py-3">
              <p className="text-sm font-bold text-slate-900">{usuario.nombre}</p>
              <p className="text-xs text-slate-500 mt-0.5">{usuario.email}</p>
            </div>
          )}

          <Field label="Rol">
            <select className={inputClass} value={rol} onChange={(e) => setRol(e.target.value)}>
              <option value="ejecutivo">Ejecutivo</option>
              <option value="admin">Administrador</option>
            </select>
          </Field>

          {rol === "ejecutivo" && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Permisos por sección</p>
              {loadingPermisos ? (
                <p className="text-sm text-slate-400">Cargando...</p>
              ) : (
                <div className="flex flex-col divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                  {MODULOS.map((m) => (
                    <div key={m.key} className="flex items-center justify-between px-3.5 py-2.5">
                      <p className="text-[13px] font-semibold text-slate-800">{m.label}</p>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <input
                            type="checkbox"
                            checked={permisos[m.key].puede_ver}
                            onChange={() => togglePermiso(m.key, "puede_ver")}
                          />
                          Ver
                        </label>
                        <label className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <input
                            type="checkbox"
                            checked={permisos[m.key].puede_editar}
                            onChange={() => togglePermiso(m.key, "puede_editar")}
                          />
                          Editar
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {rol === "admin" && (
            <p className="text-xs text-slate-400 -mt-1">Los administradores ven y editan todas las secciones.</p>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-violet-600 text-white font-semibold text-sm rounded-xl py-3 disabled:opacity-60"
          >
            {saving ? "Guardando..." : esEdicion ? "Guardar cambios" : "Crear usuario"}
          </button>
        </form>
      </div>
    </div>
  );
}
