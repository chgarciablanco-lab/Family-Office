import { useEffect, useRef, useState } from "react";

// Reordena una lista arrastrando con el dedo. `origen` es la lista "real" (la que viene del
// servidor); mientras no se esté arrastrando, el estado visual se mantiene sincronizado con
// ella. `altoFila` es la altura aproximada en px de cada fila, usada para calcular a cuántas
// posiciones se movió el dedo.
export function useArrastreOrden(origen, altoFila = 60) {
  const [items, setItems] = useState(origen);
  const [arrastrandoId, setArrastrandoId] = useState(null);
  const startYRef = useRef(0);
  const startIndexRef = useRef(0);
  const baseRef = useRef([]);

  useEffect(() => {
    if (arrastrandoId == null) setItems(origen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origen]);

  const iniciar = (id, index) => (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    e.preventDefault();
    setArrastrandoId(id);
    startYRef.current = e.clientY;
    startIndexRef.current = index;
    baseRef.current = items;
  };

  const mover = (e) => {
    if (arrastrandoId == null) return;
    e.preventDefault();
    const dy = e.clientY - startYRef.current;
    const delta = Math.round(dy / altoFila);
    const base = baseRef.current;
    const n = base.length;
    const nuevoIndex = Math.min(n - 1, Math.max(0, startIndexRef.current + delta));
    const actualIndex = base.findIndex((it) => it.id === arrastrandoId);
    if (nuevoIndex === actualIndex) return;
    const copia = [...base];
    const [item] = copia.splice(actualIndex, 1);
    copia.splice(nuevoIndex, 0, item);
    setItems(copia);
  };

  // Devuelve el orden final (array de ids) si hubo un arrastre en curso, o null si no.
  const soltar = () => {
    if (arrastrandoId == null) return null;
    setArrastrandoId(null);
    return items.map((it) => it.id);
  };

  return { items, arrastrandoId, iniciar, mover, soltar };
}
