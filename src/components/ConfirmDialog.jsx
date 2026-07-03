import React from "react";

export default function ConfirmDialog({ title, message, confirmLabel = "Eliminar", onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] px-6">
      <div className="bg-white w-full max-w-xs rounded-2xl p-5 flex flex-col gap-4">
        <div>
          <p className="font-bold text-slate-900 text-base">{title}</p>
          <p className="text-sm text-slate-500 mt-1">{message}</p>
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full bg-red-500 text-white font-semibold text-sm rounded-xl py-2.5"
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full text-slate-500 font-semibold text-sm rounded-xl py-2.5"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
