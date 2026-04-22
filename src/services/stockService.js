import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
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