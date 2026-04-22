import {
  collection,
  getDocs,
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