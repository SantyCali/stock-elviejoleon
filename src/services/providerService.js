//providerService.js

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';

function slugify(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export async function getProviders() {
  const querySnapshot = await getDocs(collection(db, 'providers'));

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function createProvider({ name, days = [], frequency = 'semanal' }) {
  const cleanName = String(name).trim();
  const cleanDays = Array.isArray(days) ? days.filter(Boolean) : [];
  const cleanFrequency = String(frequency || 'semanal').trim() || 'semanal';

  if (!cleanName) throw new Error('MISSING_PROVIDER_NAME');

  const providerId = slugify(cleanName);
  if (!providerId) throw new Error('INVALID_PROVIDER_NAME');
  const providerRef = doc(db, 'providers', providerId);
  const existing = await getDoc(providerRef);

  if (existing.exists()) throw new Error('PROVIDER_ALREADY_EXISTS');

  const provider = {
    id: providerId,
    name: cleanName,
    days: cleanDays,
    frequency: cleanFrequency,
    alias: [],
    categories: [],
    isJoke: false,
  };

  await setDoc(providerRef, provider);

  return provider;
}

export async function updateProviderName(providerId, name) {
  const cleanName = String(name).trim();

  if (!providerId) throw new Error('MISSING_PROVIDER_ID');
  if (!cleanName) throw new Error('MISSING_PROVIDER_NAME');

  await updateDoc(doc(db, 'providers', providerId), {
    name: cleanName,
  });

  return cleanName;
}

export async function updateProviderDetails(providerId, { name, days = [], frequency = 'semanal' }) {
  const cleanName = String(name).trim();
  const cleanDays = Array.isArray(days) ? days.filter(Boolean) : [];
  const cleanFrequency = String(frequency || 'semanal').trim() || 'semanal';

  if (!providerId) throw new Error('MISSING_PROVIDER_ID');
  if (!cleanName) throw new Error('MISSING_PROVIDER_NAME');
  if (cleanDays.length === 0) throw new Error('MISSING_PROVIDER_DAYS');

  await updateDoc(doc(db, 'providers', providerId), {
    name: cleanName,
    days: cleanDays,
    frequency: cleanFrequency,
  });

  return {
    name: cleanName,
    days: cleanDays,
    frequency: cleanFrequency,
  };
}

export async function deleteProviderById(providerId) {
  if (!providerId) throw new Error('MISSING_PROVIDER_ID');

  const relatedQueries = [
    query(collection(db, 'products'), where('providerId', '==', providerId)),
    query(collection(db, 'providerCategories'), where('providerId', '==', providerId)),
    query(collection(db, 'orders'), where('providerId', '==', providerId)),
    query(collection(db, 'manualOrderCompletions'), where('providerId', '==', providerId)),
  ];

  const snapshots = await Promise.all(relatedQueries.map((q) => getDocs(q)));
  const relatedDeletes = snapshots.flatMap((snapshot) =>
    snapshot.docs.map((item) => deleteDoc(item.ref))
  );

  await Promise.all([
    ...relatedDeletes,
    deleteDoc(doc(db, 'providers', providerId)),
  ]);
}
