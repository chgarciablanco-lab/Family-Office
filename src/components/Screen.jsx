import React from "react";

export default function Screen({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 flex justify-center">
      <div className="w-full max-w-sm bg-slate-50 min-h-screen flex flex-col">{children}</div>
    </div>
  );
}
