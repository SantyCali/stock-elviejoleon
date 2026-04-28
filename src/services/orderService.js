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
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { getTodayKey } from '../utils/dates';

export async function createOrder(orderData) {
  const docRef = await addDoc(collection(db, 'orders'), {
    ...orderData,
    createdAt: serverTimestamp(),
  });

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

export async function hasOrderToday(providerId) {
  try {
    const lastOrder = await getLastOrderByProvider(providerId);
    if (!lastOrder || !lastOrder.createdAt) return false;

    const orderDate = lastOrder.createdAt?.toDate
      ? lastOrder.createdAt.toDate()
      : new Date(lastOrder.createdAt);

    const today = new Date();
    return (
      orderDate.getDate() === today.getDate() &&
      orderDate.getMonth() === today.getMonth() &&
      orderDate.getFullYear() === today.getFullYear()
    );
  } catch {
    return false;
  }
}

function getManualCompletionId(providerId, dateKey = getTodayKey()) {
  return `${dateKey}_${encodeURIComponent(providerId)}`;
}

export async function hasManualOrderCompletionToday(providerId) {
  try {
    const completionRef = doc(
      db,
      'manualOrderCompletions',
      getManualCompletionId(providerId)
    );
    const snapshot = await getDoc(completionRef);
    return snapshot.exists();
  } catch {
    return false;
  }
}

export async function hasOrderDoneToday(providerId) {
  const [hasRealOrder, hasManualCompletion] = await Promise.all([
    hasOrderToday(providerId),
    hasManualOrderCompletionToday(providerId),
  ]);

  return hasRealOrder || hasManualCompletion;
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
