import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCTu0d-iuKL-21Hk9n0_Giq9KKcB5zS1Rk',
  authDomain: 'stock-el-viejo-leon.firebaseapp.com',
  projectId: 'stock-el-viejo-leon',
  storageBucket: 'stock-el-viejo-leon.firebasestorage.app',
  messagingSenderId: '991613535410',
  appId: '1:991613535410:web:500707837c00b0374735ab',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };