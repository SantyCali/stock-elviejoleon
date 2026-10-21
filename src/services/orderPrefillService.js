import { getLastOrderByProvider } from './orderService';
import { getLatestStockByProvider } from './stockService';

// Las columnas "HAY" y "último pedido" salen de dos consultas que tardan lo
// suyo. Traerlas para todos los proveedores al abrir la app serían ~490 KB, así
// que en vez de eso se precargan las del proveedor que se está mirando: cuando
// se toca "Hacer pedido" ya están en memoria.

const cache = new Map();
const inFlight = new Map();

function buildPrefill(latestStock, lastOrder) {
  const stockMap = {};
  const lastOrderMap = {};

  if (latestStock?.items?.length) {
    latestStock.items.forEach((item) => {
      stockMap[item.productId] = item.hay;
    });
  }

  if (lastOrder?.items?.length) {
    lastOrder.items.forEach((item) => {
      lastOrderMap[item.productId] = item.pedir;
    });
  }

  return {
    stockMap,
    lastOrderMap,
    stockLoadedBy:
      latestStock?.createdByName || latestStock?.createdByUsername || null,
  };
}

export function getCachedOrderPrefill(providerId) {
  return cache.get(providerId) || null;
}

export function prefetchOrderPrefill(providerId) {
  if (!providerId) return Promise.resolve(null);

  const cached = cache.get(providerId);
  if (cached) return Promise.resolve(cached);

  const pending = inFlight.get(providerId);
  if (pending) return pending;

  const promise = Promise.all([
    getLatestStockByProvider(providerId),
    getLastOrderByProvider(providerId),
  ])
    .then(([latestStock, lastOrder]) => {
      const prefill = buildPrefill(latestStock, lastOrder);
      cache.set(providerId, prefill);
      return prefill;
    })
    .catch((error) => {
      console.log('No se pudo precargar los datos del pedido:', error);
      return null;
    })
    .finally(() => {
      inFlight.delete(providerId);
    });

  inFlight.set(providerId, promise);
  return promise;
}

// Al guardar stock o cerrar un pedido lo cacheado queda viejo.
export function invalidateOrderPrefill(providerId) {
  if (!providerId) return;
  cache.delete(providerId);
  inFlight.delete(providerId);
}
