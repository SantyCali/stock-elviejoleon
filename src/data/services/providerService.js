import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { PROVIDERS_SEED } from '../data/providersSeed';

export async function getProviders() {
  const querySnapshot = await getDocs(collection(db, 'providers'));

  return querySnapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data(),
  }));
}

export async function seedProvidersToFirebase() {
  for (const provider of PROVIDERS_SEED) {
    await setDoc(doc(db, 'providers', provider.id), provider);
  }

  return true;
}