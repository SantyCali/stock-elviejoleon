import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export async function createStockSnapshot(stockData) {
  const docRef = await addDoc(collection(db, 'stocks'), {
    ...stockData,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function getLatestStockByProvider(providerId) {
  const q = query(
    collection(db, 'stocks'),
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

export function subscribeAllStocks(callback) {
  const q = query(
    collection(db, 'stocks'),
    orderBy('createdAt', 'desc'),
    limit(100)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    },
    () => callback([])
  );
}

export async function updateStockSnapshot(stockId, items) {
  await updateDoc(doc(db, 'stocks', stockId), {
    items,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteStockSnapshot(stockId) {
  await deleteDoc(doc(db, 'stocks', stockId));
}

