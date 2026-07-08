import React, { useEffect, useState } from "react";
import { X, UserPlus } from "lucide-react";
import { Field, inputClass } from "./TramiteSection";
import { fetchUsuarios, crearUsuario, asignarTarea } from "../lib/tareas";

export default function AsignarTareaForm({ onClose, onSaved }) {
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioId, setUsuarioId] = useState("");
  const [nuevoUsuario, setNuevoUsuario] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoEmail, setNuevoEmail] = useState("");

  const [titulo, setTitulo] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUsuarios().then(setUsuarios);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    let usuario = usuarios.find((u) => u.id === usuarioId);

    if (nuevoUsuario) {
      const { data, error: errUsuario } = await crearUsuario({ nombre: nuevoNombre, email: nuevoEmail });
      if (errUsuario) {
        setSaving(false);
        setError(errUsuario.message);
        return;
      }
      usuario = data;
    }

    if (!usuario) {
      setSaving(false);
      setError("Selecciona a quién le asignarás la tarea.");
      return;
    }

    const { error: errTarea, emailError } = await asignarTarea({ usuario, titulo, fecha, hora, descripcion });
    setSaving(false);
    if (errTarea) {
      setError(errTarea.message);
      return;
    }
    if (emailError) {
      setError("La tarea quedó guardada, pero no se pudo enviar el correo.");
      setTimeout(() => onSaved(), 1200);
      return;
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Asignar tarea</h2>
          <button onClick={onClose} aria-label="Cerrar">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" className="p-5 flex flex-col gap-4">
          <Field label="Asignar a">
            {!nuevoUsuario ? (
              <select
                required
                className={inputClass}
                value={usuarioId}
                onChange={(e) => setUsuarioId(e.target.value)}
              >
                <option value="">Selecciona un usuario</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>{u.nombre} · {u.email}</option>
                ))}
              </select>
            ) : (
              <div className="flex flex-col gap-2">
                <input
                  autoComplete="off"
                  required
                  className={inputClass}
                  placeholder="Nombre"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                />
                <input
                  autoComplete="off"
                  required
                  type="email"
                  className={inputClass}
                  placeholder="Correo electrónico"
                  value={nuevoEmail}
                  onChange={(e) => setNuevoEmail(e.target.value)}
                />
              </div>
            )}
            <button
              type="button"
              onClick={() => setNuevoUsuario(!nuevoUsuario)}
              className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-violet-600"
            >
              <UserPlus className="w-3.5 h-3.5" strokeWidth={2} />
              {nuevoUsuario ? "Elegir un usuario existente" : "Agregar un nuevo usuario"}
            </button>
          </Field>

          <Field label="Título">
            <input
              autoComplete="off"
              required
              className={inputClass}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Revisar cotización, pagar cuenta..."
            />
          </Field>

          <Field label="Fecha">
            <input
              autoComplete="off"
              required
              type="date"
              className={inputClass}
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </Field>

          <Field label="Hora (opcional)">
            <input
              autoComplete="off"
              type="time"
              className={inputClass}
              value={hora}
              onChange={(e) => setHora(e.target.value)}
            />
          </Field>

          <Field label="Descripción (opcional)">
            <input
              autoComplete="off"
              className={inputClass}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detalle adicional"
            />
          </Field>

          <p className="text-[11px] text-slate-400 -mt-1">
            Se enviará un correo a la persona asignada y quedará guardada en el calendario como recordatorio.
          </p>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-violet-600 text-white font-semibold text-sm rounded-xl py-3 disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Asignar tarea"}
          </button>
        </form>
      </div>
    </div>
  );
}
