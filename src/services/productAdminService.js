import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
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

export async function getCategoriesByProvider(providerId) {
  try {
    const q = query(
      collection(db, 'products'),
      where('providerId', '==', providerId)
    );

    const snapshot = await getDocs(q);

    const categoriesSet = new Set();

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const category = data.category?.trim();
      if (category) {
        categoriesSet.add(category);
      }
    });

    return Array.from(categoriesSet).sort((a, b) => a.localeCompare(b));
  } catch (error) {
    console.log('Error trayendo categorías del proveedor:', error);
    return [];
  }
}

export async function createProduct({
  providerId,
  name,
  category,
  active = true,
}) {
  const cleanName = String(name).trim();
  const cleanCategory = String(category).trim();

  if (!providerId || !cleanName || !cleanCategory) {
    throw new Error('MISSING_PRODUCT_FIELDS');
  }

  const productId = `${slugify(providerId)}-${slugify(cleanCategory)}-${slugify(cleanName)}`;

  await setDoc(doc(db, 'products', productId), {
    providerId,
    name: cleanName,
    category: cleanCategory,
    active,
  });

  return productId;
}

export async function deleteProduct(productId) {
  if (!productId) throw new Error('MISSING_PRODUCT_ID');
  await deleteDoc(doc(db, 'products', productId));
}