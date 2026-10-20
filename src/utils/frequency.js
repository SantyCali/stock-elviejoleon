// Decide si a un proveedor no semanal le toca pedido hoy.
//
// El umbral no es el largo del ciclo sino el punto medio entre una vuelta y la
// siguiente, porque los pedidos se corren de día: Golymen es quincenal de
// martes y su pedido del 29-sep cayó martes pero el del 14-oct cayó miércoles.
// Con un umbral de 14 días exactos, el martes siguiente (13 días después)
// quedaría oculto y el proveedor se saltearía dos semanas enteras.
const CYCLE_MIN_DAYS = {
  quincenal: 11, // entre 7 (la semana pasada) y 14 (le toca)
  mensual: 24, // entre 21 (hace 3 semanas) y 28 (le toca)
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function normalizeFrequency(frequency) {
  return String(frequency || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function getCycleMinDays(frequency) {
  return CYCLE_MIN_DAYS[normalizeFrequency(frequency)] ?? null;
}

function toDate(value) {
  if (!value) return null;
  const date = value?.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// true = mostrarlo hoy. Semanales y cualquier frecuencia desconocida
// (por ejemplo "humor") se muestran siempre, igual que antes.
export function isProviderDueToday(provider, now = new Date()) {
  const minDays = getCycleMinDays(provider?.frequency);
  if (!minDays) return true;

  const lastOrderedAt = toDate(provider?.lastOrderedAt);
  if (!lastOrderedAt) return true; // sin historial no se puede inferir el ciclo

  const daysSince = Math.floor((now.getTime() - lastOrderedAt.getTime()) / MS_PER_DAY);
  return daysSince >= minDays;
}
