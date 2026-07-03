import React from "react";
import { Car, Home } from "lucide-react";

const tabs = [
  { key: "autos", label: "Autos", icon: Car },
  { key: "propiedades", label: "Propiedades", icon: Home },
];

export default function BottomNav({ active, onChange }) {
  return (
    <div className="fixed bottom-0 inset-x-0 flex justify-center bg-white border-t border-slate-100 z-40">
      <div className="w-full max-w-sm flex">
        {tabs.map(({ key, label, icon: Icon }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className="flex-1 flex flex-col items-center gap-1 py-2.5"
            >
              <Icon
                className={`w-5 h-5 ${isActive ? "text-violet-600" : "text-slate-400"}`}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              <span className={`text-xs font-semibold ${isActive ? "text-violet-600" : "text-slate-400"}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
