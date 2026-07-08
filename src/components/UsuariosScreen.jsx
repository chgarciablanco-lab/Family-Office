import React, { useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash2, ShieldCheck, User, Pencil } from "lucide-react";
import BottomNav from "./BottomNav";
import ConfirmDialog from "./ConfirmDialog";
import UsuarioForm from "./UsuarioForm";
import { fetchProfiles, eliminarUsuario } from "../lib/usuarios";
import { usePermisos } from "../context/PermisosContext";

export default function UsuariosScreen({ backTo, onNavigate }) {
  const { perfil } = usePermisos();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [error, setError] = useState("");

  const cargar = async () => {
    setLoading(true);
    setUsuarios(await fetchProfiles());
    setLoading(false);
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleDelete = async () => {
    const id = confirmDelete;
    setConfirmDelete(null);
    setError("");
    const { error } = await eliminarUsuario(id);
    if (error) {
      setError(error);
      return;
    }
    cargar();
  };

  return (
    <>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={() => onNavigate(backTo)} aria-label="Volver">
          <ArrowLeft className="w-6 h-6 text-blue-600" strokeWidth={2} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Usuarios</h1>
        <button
          onClick={() => setShowForm(true)}
          className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center"
          aria-label="Nuevo usuario"
        >
          <Plus className="w-4.5 h-4.5 text-white" strokeWidth={2.4} />
        </button>
      </div>

      <div className="px-5 flex flex-col gap-2.5 pb-4">
        {error && <p className="text-sm text-red-500">{error}</p>}
        {loading && <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>}

        {!loading && usuarios.map((u) => (
          <div key={u.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-3.5 py-3.5 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${u.rol === "admin" ? "bg-amber-100" : "bg-violet-100"}`}>
              {u.rol === "admin" ? (
                <ShieldCheck className="w-5 h-5 text-amber-600" strokeWidth={1.8} />
              ) : (
                <User className="w-5 h-5 text-violet-600" strokeWidth={1.8} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-slate-900 truncate">{u.nombre}</p>
              <p className="text-[11.5px] text-slate-500 mt-0.5 truncate">{u.email}</p>
              <span className={`inline-block mt-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${u.rol === "admin" ? "bg-amber-100 text-amber-700" : "bg-violet-100 text-violet-700"}`}>
                {u.rol === "admin" ? "Administrador" : "Ejecutivo"}
              </span>
            </div>
            <button onClick={() => setEditando(u)} aria-label="Editar permisos" className="shrink-0">
              <Pencil className="w-4 h-4 text-slate-400" />
            </button>
            {u.id !== perfil?.id && (
              <button onClick={() => setConfirmDelete(u.id)} aria-label="Eliminar usuario" className="shrink-0">
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex-1" />
      <BottomNav onNavigate={onNavigate} />

      {showForm && (
        <UsuarioForm
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); cargar(); }}
        />
      )}

      {editando && (
        <UsuarioForm
          usuario={editando}
          onClose={() => setEditando(null)}
          onSaved={() => { setEditando(null); cargar(); }}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="¿Eliminar este usuario?"
          message="Perderá el acceso a la app de inmediato. Esta acción no se puede deshacer."
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </>
  );
}
