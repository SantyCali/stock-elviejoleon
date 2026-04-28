import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const CHUNK_SIZE = 100;

async function getExpoPushToken() {
  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const tokenData = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();

    return tokenData.data;
  } catch {
    return null;
  }
}

export async function savePushToken(uid) {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return;

    const token = await getExpoPushToken();
    if (!token) return;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId ??
      null;

    await setDoc(
      doc(db, 'users', uid),
      {
        pushToken: token,
        pushTokenPlatform: Platform.OS,
        pushTokenProjectId: projectId,
        pushTokenUpdatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch {
    // silencioso — no disponible en Expo Go
  }
}

async function getAllPushTokens() {
  const snapshot = await getDocs(collection(db, 'users'));
  const tokens = snapshot.docs
    .map((d) => d.data().pushToken)
    .filter((t) => typeof t === 'string' && t.startsWith('ExponentPushToken['));
  return Array.from(new Set(tokens));
}

export async function getPushTokenStats() {
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    const allDocs = snapshot.docs;
    const tokenCount = allDocs.filter((d) => {
      const t = d.data().pushToken;
      return typeof t === 'string' && t.startsWith('ExponentPushToken[');
    }).length;
    return {
      users: allDocs.length,
      tokenCount,
      backendReady: true,
    };
  } catch {
    return { users: 0, tokenCount: 0, backendReady: true };
  }
}

export async function sendBroadcastNotification(title, body) {
  let tokens;
  try {
    tokens = await getAllPushTokens();
  } catch {
    throw new Error('NETWORK_ERROR');
  }

  if (tokens.length === 0) {
    throw new Error('NO_TOKENS');
  }

  const messages = tokens.map((token) => ({
    to: token,
    title,
    body,
    sound: 'default',
    priority: 'high',
    channelId: 'pedidos',
    data: { type: 'broadcast' },
  }));

  let sent = 0;
  let errors = 0;

  for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
    const chunk = messages.slice(i, i + CHUNK_SIZE);
    let response;
    try {
      response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk),
      });
    } catch {
      throw new Error('NETWORK_ERROR');
    }

    if (!response.ok) {
      throw new Error('PUSH_SERVICE_ERROR');
    }

    const result = await response.json().catch(() => null);
    const tickets = Array.isArray(result?.data) ? result.data : [];
    sent += tickets.length || chunk.length;
    errors += tickets.filter((t) => t.status === 'error').length;
  }

  return { sent, errors };
}
