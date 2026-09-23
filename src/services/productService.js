import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// El catálogo completo pesa ~65 KB (≈530 productos), así que conviene traerlo
// una sola vez y agruparlo en memoria: entrar a cualquier proveedor es instantáneo
// en vez de disparar una consulta nueva cada vez.

let allProducts = null;
let byProvider = new Map();
let unsubscribeAll = null;

const listeners = new Set();

function groupByProvider(products) {
  const map = new Map();
  products.forEach((product) => {
    if (!product.providerId) return;
    const current = map.get(product.providerId);
    if (current) {
      current.push(product);
    } else {
      map.set(product.providerId, [product]);
    }
  });
  return map;
}

function startListener() {
  if (unsubscribeAll) return;

  unsubscribeAll = onSnapshot(
    collection(db, 'products'),
    (snapshot) => {
      allProducts = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));
      byProvider = groupByProvider(allProducts);
      listeners.forEach((listener) => {
        listener.onData(byProvider.get(listener.providerId) || []);
      });
    },
    (error) => {
      console.log('Error escuchando productos:', error);
      // Se suelta el listener (ej. permisos al cerrar sesión) para que al
      // volver a suscribirse se reconecte en vez de quedar mudo.
      if (unsubscribeAll) unsubscribeAll();
      unsubscribeAll = null;
      allProducts = null;
      byProvider = new Map();
      listeners.forEach((listener) => {
        if (listener.onError) listener.onError(error);
      });
    }
  );
}

// null = todavía no se cargó nunca. [] = cargado y este proveedor no tiene productos.
export function getCachedProductsByProvider(providerId) {
  if (allProducts === null) return null;
  return byProvider.get(providerId) || [];
}

// Arranca la descarga del catálogo sin esperar a que se abra un proveedor.
export function warmProductsCache() {
  startListener();
}

export function subscribeProductsByProvider(providerId, onData, onError) {
  if (!providerId) {
    onData([]);
    return () => {};
  }

  startListener();

  const listener = { providerId, onData, onError };
  listeners.add(listener);

  const cached = getCachedProductsByProvider(providerId);
  if (cached !== null) onData(cached);

  return () => {
    listeners.delete(listener);
  };
}

export async function getProductsByProvider(providerId) {
  try {
    if (!providerId) {
      return [];
    }

    const cached = getCachedProductsByProvider(providerId);
    if (cached !== null) return cached;

    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('providerId', '==', providerId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.log('Error trayendo productos por proveedor:', error);
    return [];
  }
}
