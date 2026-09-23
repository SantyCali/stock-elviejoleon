import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
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
    const productsQuery = query(
      collection(db, 'products'),
      where('providerId', '==', providerId)
    );
    const standaloneQuery = query(
      collection(db, 'providerCategories'),
      where('providerId', '==', providerId)
    );

    const [productsSnapshot, standaloneSnapshot] = await Promise.all([
      getDocs(productsQuery),
      getDocs(standaloneQuery),
    ]);

    const categoriesSet = new Set();

    productsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const category = data.category?.trim();
      if (category) {
        categoriesSet.add(category);
      }
    });

    standaloneSnapshot.docs.forEach((doc) => {
      const category = doc.data().name?.trim();
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

// Son ~20 documentos en total: un solo listener compartido para toda la app.
let categoriesByProvider = null;
let unsubscribeCategories = null;
const categoryListeners = new Set();

function startCategoriesListener() {
  if (unsubscribeCategories) return;

  unsubscribeCategories = onSnapshot(
    collection(db, 'providerCategories'),
    (snapshot) => {
      const map = new Map();
      snapshot.docs.forEach((docItem) => {
        const { providerId, name } = docItem.data();
        if (!providerId || !name) return;
        const current = map.get(providerId);
        if (current) {
          current.push(name);
        } else {
          map.set(providerId, [name]);
        }
      });
      categoriesByProvider = map;
      categoryListeners.forEach((listener) => {
        listener.onData(categoriesByProvider.get(listener.providerId) || []);
      });
    },
    (error) => {
      console.log('Error escuchando categorias del proveedor:', error);
      if (unsubscribeCategories) unsubscribeCategories();
      unsubscribeCategories = null;
      categoriesByProvider = null;
      categoryListeners.forEach((listener) => {
        if (listener.onError) listener.onError(error);
      });
    }
  );
}

export function getCachedStandaloneCategories(providerId) {
  if (categoriesByProvider === null) return null;
  return categoriesByProvider.get(providerId) || [];
}

export function subscribeStandaloneCategories(providerId, onData, onError) {
  if (!providerId) {
    onData([]);
    return () => {};
  }

  startCategoriesListener();

  const listener = { providerId, onData, onError };
  categoryListeners.add(listener);

  const cached = getCachedStandaloneCategories(providerId);
  if (cached !== null) onData(cached);

  return () => {
    categoryListeners.delete(listener);
  };
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
  const productsQuery = query(
    collection(db, 'products'),
    where('providerId', '==', providerId),
    where('category', '==', oldCategory)
  );
  const productsSnapshot = await getDocs(productsQuery);
  const oldStandaloneRef = doc(db, 'providerCategories', `${slugify(providerId)}-${slugify(oldCategory)}`);
  const newStandaloneRef = doc(db, 'providerCategories', `${slugify(providerId)}-${slugify(cleanNew)}`);

  await Promise.all([
    ...productsSnapshot.docs.map((d) => updateDoc(d.ref, { category: cleanNew })),
    setDoc(newStandaloneRef, { providerId, name: cleanNew }, { merge: true }),
    deleteDoc(oldStandaloneRef).catch(() => {}),
  ]);

  return cleanNew;
}

export async function deleteCategoryByProvider(providerId, category) {
  const cleanCategory = String(category).trim();

  if (!providerId) throw new Error('MISSING_PROVIDER_ID');
  if (!cleanCategory) throw new Error('MISSING_CATEGORY_NAME');

  const productsQuery = query(
    collection(db, 'products'),
    where('providerId', '==', providerId),
    where('category', '==', cleanCategory)
  );
  const productsSnapshot = await getDocs(productsQuery);
  const standaloneRef = doc(db, 'providerCategories', `${slugify(providerId)}-${slugify(cleanCategory)}`);

  await Promise.all([
    ...productsSnapshot.docs.map((d) => deleteDoc(d.ref)),
    deleteDoc(standaloneRef).catch(() => {}),
  ]);

  return {
    deletedProducts: productsSnapshot.docs.length,
  };
}
