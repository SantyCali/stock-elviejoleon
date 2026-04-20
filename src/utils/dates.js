import { DAYS } from './constants';

export function getTodayName() {
  const today = new Date();
  return DAYS[today.getDay()];
}

export function getTodayLabel() {
  return new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function formatDate(dateString) {
  const date = new Date(dateString);

  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}