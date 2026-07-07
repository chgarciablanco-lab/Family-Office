export function medidoresDe(row) {
  if (Array.isArray(row.medidores) && row.medidores.length > 0) return row.medidores;
  return [
    {
      numero_cliente: row.numero_cliente,
      compania: row.compania,
      valor: row.valor,
      vencimiento: row.vencimiento,
      fecha_pago: row.fecha_pago,
      estado: row.estado,
    },
  ];
}

export function esMultiMedidor(row) {
  return Array.isArray(row.medidores) && row.medidores.length > 0;
}

export function valorTotal(row) {
  const items = medidoresDe(row);
  if (items.every((m) => m.valor === null || m.valor === undefined || m.valor === "")) return null;
  return items.reduce((sum, m) => sum + (Number(m.valor) || 0), 0);
}

export function vencimientoProximo(row) {
  const fechas = medidoresDe(row)
    .map((m) => m.vencimiento)
    .filter(Boolean)
    .sort();
  return fechas[0] || null;
}

export function estadoResumen(row) {
  const estados = medidoresDe(row).map((m) => m.estado);
  if (estados.includes("Vencido")) return "Vencido";
  if (estados.includes("Pendiente")) return "Pendiente";
  if (estados.includes("Por vencer")) return "Por vencer";
  if (estados.length > 0 && estados.every((e) => e === "Pagado")) return "Pagado";
  return estados[0] || "Pendiente";
}
