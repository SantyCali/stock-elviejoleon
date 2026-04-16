import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'PONER_API_KEY',
  authDomain: 'PONER_AUTH_DOMAIN',
  projectId: 'PONER_PROJECT_ID',
  storageBucket: 'PONER_STORAGE_BUCKET',
  messagingSenderId: 'PONER_MESSAGING_SENDER_ID',
  appId: 'PONER_APP_ID',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };