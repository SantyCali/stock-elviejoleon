import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, db } from '../config/firebase';

const functions = getFunctions(app, 'us-central1');

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

export async function getPushTokenStats() {
  try {
    const getStats = httpsCallable(functions, 'getPushTokenStats');
    const result = await getStats();
    const stats = result.data || {};

    return {
      users: Number(stats.users || 0),
      tokenCount: Number(stats.tokenCount || 0),
      backendReady: true,
    };
  } catch (error) {
    if (error?.code === 'functions/not-found') {
      return { users: 0, tokenCount: 0, backendReady: false };
    }

    return getLocalPushTokenStats();
  }
}

export async function sendBroadcastNotification(title, body) {
  try {
    const sendToAll = httpsCallable(functions, 'sendNotificationToAll');
    const result = await sendToAll({ title, body });
    const data = result.data || {};
    return {
      sent: Number(data.sent || 0),
      errors: Number(data.errors || 0),
    };
  } catch (error) {
    throw mapFunctionError(error);
  }
}

async function getLocalPushTokenStats() {
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

function mapFunctionError(error) {
  if (error?.code === 'functions/not-found') return new Error('FUNCTIONS_NOT_DEPLOYED');
  if (error?.code === 'functions/permission-denied') return new Error('PERMISSION_DENIED');
  if (error?.code === 'functions/unauthenticated') return new Error('UNAUTHENTICATED');
  if (error?.code === 'functions/failed-precondition') return new Error('NO_TOKENS');
  if (error?.code === 'functions/unavailable') return new Error('NETWORK_ERROR');
  if (error?.code === 'functions/internal') return new Error('PUSH_SERVICE_ERROR');
  return new Error('PUSH_SERVICE_ERROR');
}
