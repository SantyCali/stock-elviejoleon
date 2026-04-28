import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { httpsCallable } from 'firebase/functions';
import { doc, setDoc } from 'firebase/firestore';
import { db, functions } from '../config/firebase';

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
    // En Expo Go SDK 53+ los push tokens remotos no están disponibles — solo funciona en builds
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

export async function getPushTokenStats() {
  try {
    const getStats = httpsCallable(functions, 'getPushTokenStats');
    return (await getStats()).data;
  } catch (error) {
    const code = String(error?.code || '');
    if (code.includes('not-found') || code.includes('internal')) {
      return {
        users: 0,
        tokenCount: 0,
        backendReady: false,
      };
    }

    return {
      users: 0,
      tokenCount: 0,
      backendReady: true,
    };
  }
}

export async function sendBroadcastNotification(title, body) {
  try {
    const sendNotificationToAll = httpsCallable(functions, 'sendNotificationToAll');
    const result = await sendNotificationToAll({
      title,
      body,
    });

    return result.data;
  } catch (error) {
    const code = String(error?.code || '');
    if (code.includes('not-found')) throw new Error('FUNCTIONS_NOT_DEPLOYED');
    if (code.includes('failed-precondition')) throw new Error('NO_TOKENS');
    if (code.includes('unavailable')) throw new Error('NETWORK_ERROR');
    if (code.includes('permission-denied')) throw new Error('PERMISSION_DENIED');
    if (code.includes('unauthenticated')) throw new Error('UNAUTHENTICATED');
    throw new Error('PUSH_SERVICE_ERROR');
  }
}
