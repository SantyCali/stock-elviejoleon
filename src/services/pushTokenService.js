import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

async function getExpoPushToken() {
  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const tokenData = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();

    return tokenData.data;
  } catch (error) {
    console.log('No se pudo obtener Expo push token:', error?.message);
    return null;
  }
}

export async function savePushToken(uid) {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    const token = await getExpoPushToken();
    if (!token) return;

    await setDoc(doc(db, 'users', uid), { pushToken: token }, { merge: true });
  } catch (error) {
    console.log('Error guardando push token:', error?.message);
  }
}

export async function getAllPushTokens() {
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs
      .map((d) => d.data().pushToken)
      .filter(Boolean);
  } catch (error) {
    console.log('Error obteniendo push tokens:', error?.message);
    return [];
  }
}

export async function sendBroadcastNotification(title, body) {
  const tokens = await getAllPushTokens();

  if (tokens.length === 0) {
    throw new Error('NO_TOKENS');
  }

  const messages = tokens.map((token) => ({
    to: token,
    title,
    body,
    sound: 'default',
    priority: 'high',
  }));

  const response = await fetch('https://exp.host/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    throw new Error('NETWORK_ERROR');
  }

  const result = await response.json();
  const data = Array.isArray(result.data) ? result.data : [];
  const errors = data.filter((r) => r.status === 'error');

  return { sent: tokens.length, errors: errors.length };
}
