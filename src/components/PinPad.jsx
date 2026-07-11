import React from "react";
import { Delete } from "lucide-react";

export default function PinPad({ onDigit, onBorrar }) {
  return (
    <div className="grid grid-cols-3 gap-4 max-w-[260px] w-full">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
        <button
          key={n}
          onClick={() => onDigit(String(n))}
          className="aspect-square rounded-full bg-white border border-slate-200 text-lg font-semibold text-slate-900 active:bg-slate-100"
        >
          {n}
        </button>
      ))}
      <div />
      <button
        onClick={() => onDigit("0")}
        className="aspect-square rounded-full bg-white border border-slate-200 text-lg font-semibold text-slate-900 active:bg-slate-100"
      >
        0
      </button>
      <button onClick={onBorrar} aria-label="Borrar" className="aspect-square rounded-full flex items-center justify-center active:bg-slate-100">
        <Delete className="w-5 h-5 text-slate-500" strokeWidth={1.8} />
      </button>
    </div>
  );
}
