import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getTodayKey, getTodayStart } from '../utils/dates';

// Estado de hoy por proveedor (pedido hecho / stock cargado) para toda la app.
// Tres listeners fijos en vez de 3 consultas por proveedor, y el resultado queda
// cacheado en memoria para que al volver a una pantalla pinte al instante.

let dateKey = null;
let ordered = new Set();
let stocked = new Set();
let ready = false;
let failed = false;
let unsubscribes = [];

const listeners = new Set();

function buildSnapshot() {
  return { ordered, stocked, ready };
}

function notify() {
  const snapshot = buildSnapshot();
  listeners.forEach((listener) => listener(snapshot));
}

function collectProviderIds(docs) {
  const ids = new Set();
  docs.forEach((docItem) => {
    const providerId = docItem.data().providerId;
    if (providerId) ids.add(providerId);
  });
  return ids;
}

function stop() {
  unsubscribes.forEach((unsubscribe) => unsubscribe());
  unsubscribes = [];
}

function start() {
  const todayKey = getTodayKey();
  const todayStart = getTodayStart();

  dateKey = todayKey;
  ready = false;
  failed = false;
  // Día nuevo: el estado anterior ya no aplica.
  ordered = new Set();
  stocked = new Set();

  let realOrders = new Set();
  let manualOrders = new Set();
  let ordersReady = false;
  let manualReady = false;
  let stocksReady = false;

  function refreshOrdered() {
    ordered = new Set([...realOrders, ...manualOrders]);
    if (ordersReady && manualReady && stocksReady) ready = true;
    notify();
  }

  function handleError(error) {
    console.log('Error escuchando el estado de hoy:', error);
    failed = true;
  }

  unsubscribes = [
    onSnapshot(
      query(collection(db, 'orders'), where('createdAt', '>=', todayStart)),
      (snapshot) => {
        realOrders = collectProviderIds(snapshot.docs);
        ordersReady = true;
        refreshOrdered();
      },
      (error) => {
        handleError(error);
        ordersReady = true;
        refreshOrdered();
      }
    ),
    onSnapshot(
      query(collection(db, 'manualOrderCompletions'), where('dateKey', '==', todayKey)),
      (snapshot) => {
        manualOrders = collectProviderIds(snapshot.docs);
        manualReady = true;
        refreshOrdered();
      },
      (error) => {
        handleError(error);
        manualReady = true;
        refreshOrdered();
      }
    ),
    onSnapshot(
      query(collection(db, 'stocks'), where('createdAt', '>=', todayStart)),
      (snapshot) => {
        stocked = collectProviderIds(snapshot.docs);
        stocksReady = true;
        refreshOrdered();
      },
      (error) => {
        handleError(error);
        stocksReady = true;
        refreshOrdered();
      }
    ),
  ];
}

function ensureFresh() {
  // Se rearma si nunca arrancó, si falló (ej. permisos al cerrar sesión)
  // o si cambió el día con la app abierta pasada la medianoche.
  if (unsubscribes.length === 0 || failed || dateKey !== getTodayKey()) {
    stop();
    start();
  }
}

export function getTodayStatus() {
  ensureFresh();
  return buildSnapshot();
}

export function subscribeTodayStatus(onChange) {
  ensureFresh();
  listeners.add(onChange);
  onChange(buildSnapshot());

  return () => {
    listeners.delete(onChange);
  };
}

// Actualizaciones optimistas: pintan el color al instante, sin esperar a Firestore.
export function markOrderedLocally(providerId) {
  if (!providerId || ordered.has(providerId)) return;
  ordered = new Set(ordered).add(providerId);
  notify();
}

export function markStockedLocally(providerId) {
  if (!providerId || stocked.has(providerId)) return;
  stocked = new Set(stocked).add(providerId);
  notify();
}
