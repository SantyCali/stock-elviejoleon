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
  // SANCOR
  { id: 'sancor-papas', name: 'Papas', providerId: 'sancor', category: 'Snack', active: true },
  { id: 'sancor-palitos', name: 'Palitos', providerId: 'sancor', category: 'Snack', active: true },
  { id: 'sancor-chizitos', name: 'Chizitos', providerId: 'sancor', category: 'Snack', active: true },
  { id: 'sancor-aritos-cebolla', name: 'Aritos cebolla', providerId: 'sancor', category: 'Snack', active: true },
  { id: 'sancor-puflitos', name: 'Puflitos', providerId: 'sancor', category: 'Snack', active: true },
  { id: 'sancor-tutucas', name: 'Tutucas', providerId: 'sancor', category: 'Snack', active: true },
  { id: 'sancor-cascarones', name: 'Cascarones', providerId: 'sancor', category: 'Snack', active: true },
  { id: 'sancor-mani', name: 'Maní', providerId: 'sancor', category: 'Snack', active: true },
  { id: 'sancor-picadillo', name: 'Picadillo', providerId: 'sancor', category: 'Otros', active: true },
  { id: 'sancor-pate', name: 'Paté', providerId: 'sancor', category: 'Otros', active: true },
  { id: 'sancor-queso-regianito', name: 'Queso regianito', providerId: 'sancor', category: 'Otros', active: true },

  // VENECIANA
  { id: 'veneciana-pan-lactal-400', name: 'Pan lactal 400g', providerId: 'veneciana', category: 'Panificados', active: true },
  { id: 'veneciana-pan-lactal-600', name: 'Pan lactal 600g', providerId: 'veneciana', category: 'Panificados', active: true },
  { id: 'veneciana-multicereal', name: 'Multicereal', providerId: 'veneciana', category: 'Panificados', active: true },
  { id: 'veneciana-integral', name: 'Integral', providerId: 'veneciana', category: 'Panificados', active: true },
  { id: 'veneciana-pan-panchos', name: 'Pan de panchos', providerId: 'veneciana', category: 'Panificados', active: true },
  { id: 'veneciana-pan-hamburguesas', name: 'Pan de hamburguesas', providerId: 'veneciana', category: 'Panificados', active: true },
  { id: 'veneciana-practiricas', name: 'Práctiricas', providerId: 'veneciana', category: 'Panificados', active: true },
  { id: 'veneciana-papas-tradicionales-105', name: 'Papas tradicionales 105g', providerId: 'veneciana', category: 'Papas y snacks', active: true },
  { id: 'veneciana-papas-americanos-105', name: 'Papas americanos 105g', providerId: 'veneciana', category: 'Papas y snacks', active: true },
  { id: 'veneciana-papas-tradicionales-50', name: 'Papas tradicionales 50g', providerId: 'veneciana', category: 'Papas y snacks', active: true },
  { id: 'veneciana-papas-americanos-50', name: 'Papas americanos 50g', providerId: 'veneciana', category: 'Papas y snacks', active: true },
  { id: 'veneciana-papas-cebolla-55', name: 'Papas sabor cebolla 55g', providerId: 'veneciana', category: 'Papas y snacks', active: true },
  { id: 'veneciana-papas-jamon-55', name: 'Papas sabor jamón 55g', providerId: 'veneciana', category: 'Papas y snacks', active: true },
  { id: 'veneciana-papas-salame-55', name: 'Papas sabor salame 55g', providerId: 'veneciana', category: 'Papas y snacks', active: true },
  { id: 'veneciana-papas-ketchup-55', name: 'Papas sabor ketchup 55g', providerId: 'veneciana', category: 'Papas y snacks', active: true },
  { id: 'veneciana-papas-cheddar-55', name: 'Papas sabor cheddar 55g', providerId: 'veneciana', category: 'Papas y snacks', active: true },
  { id: 'veneciana-conos', name: 'Conos', providerId: 'veneciana', category: 'Papas y snacks', active: true },
  { id: 'veneciana-papas-pays', name: 'Papas pays', providerId: 'veneciana', category: 'Papas y snacks', active: true },
  { id: 'veneciana-grisines-trisalvados', name: 'Grisines trisalvados', providerId: 'veneciana', category: 'Grisines', active: true },
  { id: 'veneciana-grisines-salvado', name: 'Grisines con salvado', providerId: 'veneciana', category: 'Grisines', active: true },
  { id: 'veneciana-grisines-multicereal', name: 'Grisines multicereal', providerId: 'veneciana', category: 'Grisines', active: true },
  { id: 'veneciana-grisines-clasicos', name: 'Grisines clásicos', providerId: 'veneciana', category: 'Grisines', active: true },
  { id: 'veneciana-zigrinatos', name: 'Zigrinatos', providerId: 'veneciana', category: 'Grisines', active: true },
  { id: 'veneciana-alfajores-cachafaz', name: 'Alfajores Cachafaz', providerId: 'veneciana', category: 'Otros', active: true },

  // COCA COLA
  { id: 'coca-cola-coca', name: 'Coca', providerId: 'coca-cola', category: 'Retornable', active: true },
  { id: 'coca-cola-coca-zero', name: 'Coca Zero', providerId: 'coca-cola', category: 'Retornable', active: true },
  { id: 'coca-cola-sprite', name: 'Sprite', providerId: 'coca-cola', category: 'Retornable', active: true },
  { id: 'coca-cola-fanta-naranja', name: 'Fanta naranja', providerId: 'coca-cola', category: 'Retornable', active: true },
  { id: 'coca-cola-fanta-pomelo', name: 'Fanta pomelo', providerId: 'coca-cola', category: 'Retornable', active: true },
  { id: 'coca-cola-fanta-limon', name: 'Fanta limón', providerId: 'coca-cola', category: 'Retornable', active: true },
  { id: 'coca-cola-schweppes', name: 'Schweppes', providerId: 'coca-cola', category: 'Retornable', active: true },
  { id: 'coca-cola-cepita-durazno', name: 'Cepita Durazno', providerId: 'coca-cola', category: 'Cepita', active: true },
  { id: 'coca-cola-cepita-naranja', name: 'Cepita Naranja', providerId: 'coca-cola', category: 'Cepita', active: true },
  { id: 'coca-cola-cepita-multifruta', name: 'Cepita Multifruta', providerId: 'coca-cola', category: 'Cepita', active: true },
  { id: 'coca-cola-cepita-manzana', name: 'Cepita Manzana', providerId: 'coca-cola', category: 'Cepita', active: true },
  { id: 'coca-cola-ades-naranja', name: 'Ades Naranja', providerId: 'coca-cola', category: 'Ades', active: true },
  { id: 'coca-cola-ades-manzana', name: 'Ades Manzana', providerId: 'coca-cola', category: 'Ades', active: true },
  { id: 'coca-cola-ades-durazno', name: 'Ades Durazno', providerId: 'coca-cola', category: 'Ades', active: true },
  { id: 'coca-cola-ades-mifrutal', name: 'Ades Mifrutal', providerId: 'coca-cola', category: 'Ades', active: true },
  { id: 'coca-cola-bonaqua-500cc', name: 'Bonaqua 500cc', providerId: 'coca-cola', category: 'Agua Bonaqua', active: true },
  { id: 'coca-cola-bonaqua-gasificada', name: 'Bonaqua gasificada', providerId: 'coca-cola', category: 'Agua Bonaqua', active: true },
  { id: 'coca-cola-bonaqua-litro-y-medio', name: 'Bonaqua litro y 1/2', providerId: 'coca-cola', category: 'Agua Bonaqua', active: true },
  { id: 'coca-cola-bonaqua-2-litros', name: 'Bonaqua 2 litros', providerId: 'coca-cola', category: 'Agua Bonaqua', active: true },

  // QUILMES
  { id: 'quilmes-1-litro', name: 'Quilmes 1 litro', providerId: 'quilmes', category: 'Botellas', active: true },
  { id: 'quilmes-brahama', name: 'Brahama', providerId: 'quilmes', category: 'Botellas', active: true },
  { id: 'quilmes-stella-rubia', name: 'Stella rubia', providerId: 'quilmes', category: 'Botellas', active: true },
  { id: 'quilmes-stella-negra', name: 'Stella negra', providerId: 'quilmes', category: 'Botellas', active: true },
  { id: 'quilmes-andes-tradicional', name: 'Andes tradicional', providerId: 'quilmes', category: 'Botellas', active: true },
  { id: 'quilmes-corona-grande', name: 'Corona grande', providerId: 'quilmes', category: 'Botellas', active: true },
  { id: 'quilmes-corona-chica', name: 'Corona chica', providerId: 'quilmes', category: 'Botellas', active: true },
  { id: 'quilmes-pepsi-225', name: 'Pepsi x2.25L', providerId: 'quilmes', category: 'Gaseosas', active: true },
  { id: 'quilmes-seven-up-225', name: 'Seven Up x2.250L', providerId: 'quilmes', category: 'Gaseosas', active: true },
  { id: 'quilmes-paso-tonica', name: 'Paso de los Toros tónica', providerId: 'quilmes', category: 'Gaseosas', active: true },
  { id: 'quilmes-paso-pomelo', name: 'Paso de los Toros pomelo', providerId: 'quilmes', category: 'Gaseosas', active: true },
];

// sigue...
async function seedCollection(collectionName, items) {
  for (const item of items) {
    const { id, ...data } = item;
    await setDoc(doc(db, collectionName, id), data);
    console.log(`✅ ${collectionName}/${id}`);
  }
}

async function run() {
  try {
    console.log('🚀 Subiendo products...');
    await seedCollection('products', products);
    console.log('🎉 Products completado.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error subiendo datos:', error);
    process.exit(1);
  }
}

run();