export const colorClasses = {
  violet: { bg: "bg-violet-100", fg: "text-violet-600" },
  blue: { bg: "bg-blue-100", fg: "text-blue-600" },
  orange: { bg: "bg-orange-100", fg: "text-orange-500" },
  teal: { bg: "bg-teal-100", fg: "text-teal-600" },
  pink: { bg: "bg-pink-100", fg: "text-pink-600" },
  emerald: { bg: "bg-emerald-100", fg: "text-emerald-600" },
};

export function estadoPillClasses(estado) {
  if (estado === "Al día" || estado === "Pagado") return { bg: "bg-emerald-100", text: "text-emerald-700" };
  if (estado === "Por vencer") return { bg: "bg-amber-100", text: "text-amber-700" };
  return { bg: "bg-red-100", text: "text-red-700" };
}

export function formatCLP(valor) {
  if (valor === null || valor === undefined || valor === "") return "-";
  return "$" + Number(valor).toLocaleString("es-CL");
}

export function formatMes(fecha) {
  if (!fecha) return "-";
  const d = new Date(fecha + "T00:00:00");
  const texto = d.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function formatDia(dia) {
  if (!dia) return "-";
  return `Día ${dia} de cada mes`;
}
