// Ubicación del autoservicio "El Viejo León" (MaxiKiosko), El Naranjero 80, San Luis.
export const STORE_LOCATION = {
  latitude: -32.324886,
  longitude: -65.014642,
  radiusMeters: 120,
};

// Tiempo mínimo dentro del radio para considerar a alguien "presente".
export const PRESENCE_THRESHOLD_MS = 0;

// Si no llega una actualización de ubicación en este tiempo, se considera
// que la persona salió (GPS apagado, app cerrada, etc.).
export const STALE_PRESENCE_MS = 15 * 60 * 1000;
