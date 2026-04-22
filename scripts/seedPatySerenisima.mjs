import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCTu0d-iuKL-21Hk9n0_Giq9KKcB5zS1Rk',
  authDomain: 'stock-el-viejo-leon.firebaseapp.com',
  projectId: 'stock-el-viejo-leon',
  storageBucket: 'stock-el-viejo-leon.firebasestorage.app',
  messagingSenderId: '991613535410',
  appId: '1:991613535410:web:500707837c00b0374735ab',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const products = [
  // PATY
  { id: 'paty-paty-finitas', name: 'Paty finitas', providerId: 'paty', category: 'Paty', active: true },
  { id: 'paty-paty-express', name: 'Paty express', providerId: 'paty', category: 'Paty', active: true },
  { id: 'paty-pack-barfy-x4', name: 'Pack Barfy x4', providerId: 'paty', category: 'Paty', active: true },
  { id: 'paty-caja-paty-72g', name: 'Caja Paty 72 g', providerId: 'paty', category: 'Paty', active: true },
  { id: 'paty-vienisima-x6', name: 'Vienisima x6', providerId: 'paty', category: 'Paty', active: true },
  { id: 'paty-ketchup-danica', name: 'Ketchup Danica', providerId: 'paty', category: 'Paty', active: true },
  { id: 'paty-mostaza-danica', name: 'Mostaza Danica', providerId: 'paty', category: 'Paty', active: true },
  { id: 'paty-mortadela-bocha-calchaqui', name: 'Mortadela bocha Calchaquí', providerId: 'paty', category: 'Paty', active: true },

  // SERENISIMA
  { id: 'serenisima-leche-entera', name: 'Leche entera', providerId: 'serenisima', category: 'Serenísima', active: true },
  { id: 'serenisima-leche-descremada', name: 'Leche descremada', providerId: 'serenisima', category: 'Serenísima', active: true },
  { id: 'serenisima-yogurt-firme', name: 'Yogurt firme', providerId: 'serenisima', category: 'Serenísima', active: true },
  { id: 'serenisima-yogurt-con-cereal', name: 'Yogurt con cereal', providerId: 'serenisima', category: 'Serenísima', active: true },
  { id: 'serenisima-casamcrem-rojo', name: 'Casamcrem rojo', providerId: 'serenisima', category: 'Serenísima', active: true },
  { id: 'serenisima-casamcrem-verde', name: 'Casamcrem verde', providerId: 'serenisima', category: 'Serenísima', active: true },
  { id: 'serenisima-danete-dulce-de-leche', name: 'Danete dulce de leche', providerId: 'serenisima', category: 'Serenísima', active: true },
  { id: 'serenisima-danete-chocolate', name: 'Danete chocolate', providerId: 'serenisima', category: 'Serenísima', active: true },
  { id: 'serenisima-danete-flan', name: 'Danete flan', providerId: 'serenisima', category: 'Serenísima', active: true },
  { id: 'serenisima-leche-polvo-entera', name: 'Leche polvo entera', providerId: 'serenisima', category: 'Serenísima', active: true },
  { id: 'serenisima-leche-polvo-descremada', name: 'Leche polvo descrem.', providerId: 'serenisima', category: 'Serenísima', active: true },
  { id: 'serenisima-dulce-de-leche-200', name: 'Dulce de leche 200', providerId: 'serenisima', category: 'Serenísima', active: true },
  { id: 'serenisima-dulce-de-leche-400', name: 'Dulce de leche 400', providerId: 'serenisima', category: 'Serenísima', active: true },
  { id: 'serenisima-levadura-caja-cubo', name: 'Levadura caja cubo', providerId: 'serenisima', category: 'Serenísima', active: true },
  { id: 'serenisima-queso-cremoso-rojo', name: 'Queso cremoso rojo', providerId: 'serenisima', category: 'Serenísima', active: true },
  { id: 'serenisima-queso-cremoso-verde', name: 'Queso cremoso verde', providerId: 'serenisima', category: 'Serenísima', active: true },
];

async function run() {
  try {
    for (const item of products) {
      const { id, ...data } = item;
      await setDoc(doc(db, 'products', id), data);
      console.log(`✅ products/${id}`);
    }

    console.log('🎉 Paty y Serenísima subidos.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error subiendo Paty y Serenísima:', error);
    process.exit(1);
  }
}

run();