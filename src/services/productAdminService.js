import {
  collection,
  deleteDoc,
  doc,
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

export async function updateProductName(productId, newName) {
  if (!productId) throw new Error('MISSING_PRODUCT_ID');
  const cleanName = String(newName).trim();
  if (!cleanName) throw new Error('MISSING_PRODUCT_NAME');
  await updateDoc(doc(db, 'products', productId), { name: cleanName });
  return cleanName;
}

export async function getStandaloneCategories(providerId) {
  try {
    const q = query(
      collection(db, 'providerCategories'),
      where('providerId', '==', providerId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data().name).filter(Boolean);
  } catch {
    return [];
  }
}

export async function createStandaloneCategory(providerId, name) {
  const cleanName = String(name).trim();
  if (!cleanName) throw new Error('MISSING_CATEGORY_NAME');
  const id = `${slugify(providerId)}-${slugify(cleanName)}`;
  await setDoc(doc(db, 'providerCategories', id), { providerId, name: cleanName });
  return cleanName;
}

export async function moveProductToCategory(productId, newCategory) {
  if (!productId) throw new Error('MISSING_PRODUCT_ID');
  const cleanCat = String(newCategory).trim();
  if (!cleanCat) throw new Error('MISSING_CATEGORY_NAME');
  await updateDoc(doc(db, 'products', productId), { category: cleanCat });
  return cleanCat;
}

export async function renameCategory(providerId, oldCategory, newCategory) {
  const cleanNew = String(newCategory).trim();
  if (!cleanNew) throw new Error('MISSING_CATEGORY_NAME');
  const q = query(
    collection(db, 'products'),
    where('providerId', '==', providerId),
    where('category', '==', oldCategory)
  );
  const snapshot = await getDocs(q);
  await Promise.all(snapshot.docs.map((d) => updateDoc(d.ref, { category: cleanNew })));
  return cleanNew;
}