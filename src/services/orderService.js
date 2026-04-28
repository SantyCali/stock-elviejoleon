import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';

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