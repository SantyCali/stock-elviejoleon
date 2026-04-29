import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export async function getProductsByProvider(providerId) {
  try {
    if (!providerId) {
      return [];
    }

    const productsRef = collection(db, 'products');
    const q = query(
      productsRef,
      where('providerId', '==', providerId)
    );

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

export function subscribeProductsByProvider(providerId, onData, onError) {
  if (!providerId) {
    onData([]);
    return () => {};
  }

  const productsRef = collection(db, 'products');
  const q = query(
    productsRef,
    where('providerId', '==', providerId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })));
    },
    (error) => {
      console.log('Error escuchando productos por proveedor:', error);
      if (onError) onError(error);
    }
  );
}
