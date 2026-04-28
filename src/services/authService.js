import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export async function registerUser({
  email = '',
  password = '',
  name = '',
  username = '',
  role = 'empleado',
}) {
  const cleanEmail = String(email).trim().toLowerCase();
  const cleanUsername = String(username).trim().toLowerCase();
  const cleanName = String(name).trim();

  if (!cleanEmail || !password || !cleanName || !cleanUsername) {
    throw new Error('MISSING_REGISTER_FIELDS');
  }

  const usernameQuery = query(
    collection(db, 'users'),
    where('username', '==', cleanUsername)
  );

  const usernameSnapshot = await getDocs(usernameQuery);

  if (!usernameSnapshot.empty) {
    throw new Error('USERNAME_ALREADY_EXISTS');
  }

  const userCredential = await createUserWithEmailAndPassword(
    auth,
    cleanEmail,
    password
  );

  const user = userCredential.user;

  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email: cleanEmail,
    name: cleanName,
    username: cleanUsername,
    role,
    createdAt: new Date().toISOString(),
  });

  return user;
}

export async function signInUser(login = '', password = '') {
  const cleanLogin = String(login).trim().toLowerCase();

  if (!cleanLogin || !password) {
    throw new Error('MISSING_LOGIN_FIELDS');
  }

  let emailToUse = cleanLogin;

  const looksLikeEmail = cleanLogin.includes('@');

  if (!looksLikeEmail) {
    const userQuery = query(
      collection(db, 'users'),
      where('username', '==', cleanLogin)
    );

    const userSnapshot = await getDocs(userQuery);

    if (userSnapshot.empty) {
      throw new Error('USER_NOT_FOUND');
    }

    const userData = userSnapshot.docs[0].data();
    emailToUse = userData.email;
  }

  const userCredential = await signInWithEmailAndPassword(
    auth,
    emailToUse,
    password
  );

  return userCredential.user;
}

export async function signOutUser() {
  await signOut(auth);
}

export function observeAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function getUserProfile(uid) {
  const snapshot = await getDoc(doc(db, 'users', uid));

  if (!snapshot.exists()) return null;

  return snapshot.data();
}

export function getCurrentUser() {
  return auth.currentUser;
}

export async function resetPassword(email) {
  const cleanEmail = String(email).trim().toLowerCase();
  if (!cleanEmail) throw new Error('MISSING_EMAIL');
  await sendPasswordResetEmail(auth, cleanEmail);
}

export async function changePassword(currentPassword, newPassword) {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('NOT_AUTHENTICATED');
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}