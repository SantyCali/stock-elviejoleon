const DAY_NAMES = [
  'domingo',
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
];

const DAY_LABELS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

const MONTH_LABELS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

// Argentina UTC-3
const ARGENTINA_OFFSET_HOURS = -3;

function getArgentinaDate() {
  const now = new Date();

  // getTime() ya está en milisegundos absolutos UTC.
  // Solo hay que moverlo a UTC-3, sin sumar timezoneOffset.
  const argentinaMs = now.getTime() + ARGENTINA_OFFSET_HOURS * 60 * 60000;

  return new Date(argentinaMs);
}

export function getTodayName() {
  const today = getArgentinaDate();
  return DAY_NAMES[today.getUTCDay()];
}

export function getTodayLabel() {
  const today = getArgentinaDate();
  const dayName = DAY_LABELS[today.getUTCDay()];
  const dayNumber = today.getUTCDate();
  const monthName = MONTH_LABELS[today.getUTCMonth()];

  return `${dayName}, ${dayNumber} de ${monthName}`;
}