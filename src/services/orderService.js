import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { getTodayKey } from '../utils/dates';

// Deja la fecha del último pedido en el proveedor: así la pantalla de inicio
// puede saber si a un quincenal/mensual le toca hoy sin consultar el historial.
async function touchProviderLastOrdered(providerId) {
  if (!providerId) return;

  try {
    const providerRef = doc(db, 'providers', providerId);
    const snapshot = await getDoc(providerRef);
    const current = snapshot.data()?.lastOrderedAt;
    const currentDate = current?.toDate ? current.toDate() : null;

    // Se guarda el anterior para poder decidir si hoy tocaba sin que el
    // movimiento de hoy altere esa cuenta. Si ya hubo uno hoy no se pisa,
    // porque si no el segundo pedido del dia borraria el historial real.
    const now = new Date();
    const alreadyToday =
      currentDate &&
      currentDate.getFullYear() === now.getFullYear() &&
      currentDate.getMonth() === now.getMonth() &&
      currentDate.getDate() === now.getDate();

    await updateDoc(providerRef, {
      ...(alreadyToday ? {} : { previousOrderedAt: current ?? null }),
      lastOrderedAt: serverTimestamp(),
    });
  } catch (error) {
    // Que falle esto no debe tumbar el pedido, que ya se guardó.
    console.log('No se pudo actualizar lastOrderedAt del proveedor:', error);
  }
}

export async function createOrder(orderData) {
  const docRef = await addDoc(collection(db, 'orders'), {
    ...orderData,
    createdAt: serverTimestamp(),
  });

  await touchProviderLastOrdered(orderData.providerId);
  await keepOnlyLastFiveOrdersByProvider(orderData.providerId);

  return docRef.id;
}

export async function getLastOrderByProvider(providerId) {
  const q = query(
    collection(db, 'orders'),
    where('providerId', '==', providerId),
    orderBy('createdAt', 'desc'),
    limit(1)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  return {
    id: snapshot.docs[0].id,
    ...snapshot.docs[0].data(),
  };
}

export async function getRecentOrders(limitCount = 5) {
  const q = query(
    collection(db, 'orders'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data(),
  }));
}

export async function getRecentOrdersByProvider(providerId, limitCount = 5) {
  const q = query(
    collection(db, 'orders'),
    where('providerId', '==', providerId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data(),
  }));
}

function getManualCompletionId(providerId, dateKey = getTodayKey()) {
  return `${dateKey}_${encodeURIComponent(providerId)}`;
}

export async function markOrderDoneToday(provider) {
  const dateKey = getTodayKey();
  const completionRef = doc(
    db,
    'manualOrderCompletions',
    getManualCompletionId(provider.id, dateKey)
  );

  await setDoc(completionRef, {
    providerId: provider.id,
    providerName: provider.name,
    dateKey,
    markedAt: serverTimestamp(),
    type: 'manual',
  });

  // Marcarlo a mano también cierra el ciclo de un quincenal/mensual.
  await touchProviderLastOrdered(provider.id);
}

export async function deleteOrder(orderId) {
  await deleteDoc(doc(db, 'orders', orderId));
}

async function keepOnlyLastFiveOrdersByProvider(providerId) {
  const q = query(
    collection(db, 'orders'),
    where('providerId', '==', providerId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);

  if (snapshot.docs.length <= 5) return;

  const docsToDelete = snapshot.docs.slice(5);

  for (const docItem of docsToDelete) {
    await deleteDoc(doc(db, 'orders', docItem.id));
  }
}
