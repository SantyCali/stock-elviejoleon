import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

export async function getProductsByProvider(providerId) {
  const q = query(
    collection(db, 'products'),
    where('providerId', '==', providerId)
  );

  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data(),
  }));
}