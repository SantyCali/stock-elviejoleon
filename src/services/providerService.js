//providerService.js

import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export async function getProviders() {
  const querySnapshot = await getDocs(collection(db, 'providers'));

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}