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

const providers = [
  {
    id: 'serenisima',
    name: 'Serenísima',
    days: ['lunes'],
    frequency: 'semanal',
    alias: [],
    categories: [],
    isJoke: false,
  },
  {
    id: 'veneciana',
    name: 'Veneciana',
    days: ['lunes', 'viernes'],
    frequency: 'semanal',
    alias: ['Kaleo'],
    categories: [],
    isJoke: false,
  },
  {
    id: 'mariano-secco',
    name: 'Mariano Secco',
    days: ['lunes'],
    frequency: 'semanal',
    alias: [],
    categories: [],
    isJoke: false,
  },
  {
    id: 'lucas',
    name: 'Lucas',
    days: ['martes'],
    frequency: 'semanal',
    alias: ['Lucas Makenzi'],
    categories: [],
    isJoke: false,
  },
  {
    id: 'sancor',
    name: 'Sancor',
    days: ['martes'],
    frequency: 'semanal',
    alias: [],
    categories: [],
    isJoke: false,
  },
  {
    id: 'paty',
    name: 'Paty',
    days: ['martes'],
    frequency: 'semanal',
    alias: [],
    categories: [],
    isJoke: false,
  },
  {
    id: 'mym',
    name: 'M y M',
    days: ['martes', 'viernes'],
    frequency: 'semanal',
    alias: [],
    categories: [],
    isJoke: false,
  },
  {
    id: 'golymen',
    name: 'Golymen',
    days: ['martes'],
    frequency: 'quincenal',
    alias: [],
    categories: [],
    isJoke: false,
  },
  {
    id: 'agustin-el-molino',
    name: 'Agustín (El Molino)',
    days: ['martes'],
    frequency: 'semanal',
    alias: [],
    categories: [],
    isJoke: false,
  },
  {
    id: 'coca-cola',
    name: 'Coca Cola',
    days: ['miércoles', 'sábado'],
    frequency: 'semanal',
    alias: [],
    categories: [],
    isJoke: false,
  },
  {
    id: 'lays',
    name: 'Lays',
    days: ['miércoles'],
    frequency: 'semanal',
    alias: [],
    categories: [],
    isJoke: false,
  },
  {
    id: 'magoya',
    name: 'Magoya',
    days: ['jueves'],
    frequency: 'humor',
    alias: [],
    categories: [],
    isJoke: true,
  },
  {
    id: 'quilmes',
    name: 'Quilmes',
    days: ['sábado'],
    frequency: 'semanal',
    alias: [],
    categories: [],
    isJoke: false,
  },
];

const products = [
  { id: 'sancor-papas', name: 'Papas', providerId: 'sancor', category: 'Snack', active: true },
  { id: 'sancor-palitos', name: 'Palitos', providerId: 'sancor', category: 'Snack', active: true },
  { id: 'sancor-chizitos', name: 'Chizitos', providerId: 'sancor', category: 'Snack', active: true },
  { id: 'sancor-aritos-cebolla', name: 'Aritos cebolla', providerId: 'sancor', category: 'Snack', active: true },
  { id: 'sancor-puflitos', name: 'Puflitos', providerId: 'sancor', category: 'Snack', active: true },
  { id: 'sancor-tutucas', name: 'Tutucas', providerId: 'sancor', category: 'Snack', active: true },
  { id: 'sancor-cascarones', name: 'Cascarones', providerId: 'sancor', category: 'Snack', active: true },
  { id: 'sancor-mani', name: 'Maní', providerId: 'sancor', category: 'Snack', active: true },

  { id: 'veneciana-pan-lactal-400', name: 'Pan lactal 400g', providerId: 'veneciana', category: 'Panificados', active: true },
  { id: 'veneciana-pan-lactal-600', name: 'Pan lactal 600g', providerId: 'veneciana', category: 'Panificados', active: true },
  { id: 'veneciana-multicereal', name: 'Multicereal', providerId: 'veneciana', category: 'Panificados', active: true },
  { id: 'veneciana-integral', name: 'Integral', providerId: 'veneciana', category: 'Panificados', active: true },
  { id: 'veneciana-pan-panchos', name: 'Pan de panchos', providerId: 'veneciana', category: 'Panificados', active: true },
  { id: 'veneciana-pan-hamburguesas', name: 'Pan de hamburguesas', providerId: 'veneciana', category: 'Panificados', active: true },
  { id: 'veneciana-practiricas', name: 'Práctiricas', providerId: 'veneciana', category: 'Panificados', active: true },

  { id: 'coca-coca', name: 'Coca', providerId: 'coca-cola', category: 'Retornable', active: true },
  { id: 'coca-coca-zero', name: 'Coca Zero', providerId: 'coca-cola', category: 'Retornable', active: true },
  { id: 'coca-sprite', name: 'Sprite', providerId: 'coca-cola', category: 'Retornable', active: true },
  { id: 'coca-fanta-naranja', name: 'Fanta naranja', providerId: 'coca-cola', category: 'Retornable', active: true },

  { id: 'quilmes-quilmes-1-litro', name: 'Quilmes 1 litro', providerId: 'quilmes', category: 'Botellas', active: true },
  { id: 'quilmes-brahama', name: 'Brahama', providerId: 'quilmes', category: 'Botellas', active: true },
  { id: 'quilmes-stella-rubia', name: 'Stella rubia', providerId: 'quilmes', category: 'Botellas', active: true },
  { id: 'quilmes-stella-negra', name: 'Stella negra', providerId: 'quilmes', category: 'Botellas', active: true },
];

async function seedCollection(collectionName, items) {
  for (const item of items) {
    const { id, ...data } = item;
    await setDoc(doc(db, collectionName, id), data);
    console.log(`✅ ${collectionName}/${id}`);
  }
}

async function run() {
  try {
    console.log('🚀 Subiendo providers...');
    await seedCollection('providers', providers);

    console.log('🚀 Subiendo products...');
    await seedCollection('products', products);

    console.log('🎉 Seed completado.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error subiendo datos:', error);
    process.exit(1);
  }
}

run();