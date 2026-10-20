// Ubicación del autoservicio "El Viejo León" (MaxiKiosko), El Naranjero 80, San Luis.
export const STORE_LOCATION = {
  latitude: -32.324886,
  longitude: -65.014642,
  radiusMeters: 120,
};

// Tiempo mínimo dentro del radio para considerar a alguien "presente".
export const PRESENCE_THRESHOLD_MS = 0;

// Si no llega una actualización en este tiempo se asume que la persona salió
// (celular apagado, permisos revocados, etc.).
//
// Son 8 horas y no 15 minutos porque la geocerca avisa al entrar y al salir,
// no cada tantos minutos: entre esos dos eventos no se escribe nada. Con 15
// minutos, cualquiera figuraba ausente al rato de haber llegado aunque
// siguiera adentro. Lo que limpia el estado es el evento de salida; este
// plazo es solo la red de seguridad por si ese evento se pierde, y se
// resuelve solo de un día para el otro.
export const STALE_PRESENCE_MS = 8 * 60 * 60 * 1000;
