import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  PRESENCE_THRESHOLD_MS,
  STORE_LOCATION,
} from '../config/storeLocation';

const LOCATION_TASK_NAME = 'el-viejo-leon-presence-task';

const STORAGE_KEYS = {
  uid: 'presence_uid',
  name: 'presence_name',
  username: 'presence_username',
  role: 'presence_role',
  enteredAt: 'presence_enteredAt',
};

function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function writePresence(profile, coords, distanceMeters, enteredAtIso) {
  const now = new Date();
  const withinRadius = distanceMeters <= STORE_LOCATION.radiusMeters;

  let status = 'ausente';
  if (withinRadius && enteredAtIso) {
    const elapsed = now.getTime() - new Date(enteredAtIso).getTime();
    status = elapsed >= PRESENCE_THRESHOLD_MS ? 'presente' : 'llegando';
  }

  await setDoc(
    doc(db, 'presence', profile.uid),
    {
      uid: profile.uid,
      name: profile.name || profile.username || 'Sin nombre',
      username: profile.username || '',
      role: profile.role || 'empleado',
      status,
      since: withinRadius ? enteredAtIso : null,
      lastSeen: now.toISOString(),
      lastLat: coords.latitude,
      lastLng: coords.longitude,
      distanceMeters: Math.round(distanceMeters),
      updatedAt: now.toISOString(),
    },
    { merge: true }
  );
}

async function processLocation(coords) {
  const [uid, name, username, role, storedEnteredAt] = await Promise.all([
    AsyncStorage.getItem(STORAGE_KEYS.uid),
    AsyncStorage.getItem(STORAGE_KEYS.name),
    AsyncStorage.getItem(STORAGE_KEYS.username),
    AsyncStorage.getItem(STORAGE_KEYS.role),
    AsyncStorage.getItem(STORAGE_KEYS.enteredAt),
  ]);

  if (!uid) return;

  const distanceMeters = getDistanceMeters(
    coords.latitude,
    coords.longitude,
    STORE_LOCATION.latitude,
    STORE_LOCATION.longitude
  );

  const withinRadius = distanceMeters <= STORE_LOCATION.radiusMeters;
  let enteredAtIso = storedEnteredAt;

  if (withinRadius && !enteredAtIso) {
    enteredAtIso = new Date().toISOString();
    await AsyncStorage.setItem(STORAGE_KEYS.enteredAt, enteredAtIso);
  } else if (!withinRadius && enteredAtIso) {
    enteredAtIso = null;
    await AsyncStorage.removeItem(STORAGE_KEYS.enteredAt);
  }

  await writePresence(
    { uid, name, username, role },
    coords,
    distanceMeters,
    enteredAtIso
  );
}

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) return;
  const locations = data?.locations;
  const last = locations && locations[locations.length - 1];
  if (!last?.coords) return;

  try {
    await processLocation(last.coords);
  } catch {
    // silencioso — no bloquear el ciclo de ubicación en background
  }
});

export async function requestPresencePermissions() {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') return false;

  const bg = await Location.requestBackgroundPermissionsAsync();
  return bg.status === 'granted';
}

export async function getPresencePermissionStatus() {
  const fg = await Location.getForegroundPermissionsAsync();
  const bg = await Location.getBackgroundPermissionsAsync();
  return {
    foregroundGranted: fg.status === 'granted',
    backgroundGranted: bg.status === 'granted',
  };
}

export async function ensurePresenceTracking(profile) {
  if (!profile?.uid) return false;

  const { backgroundGranted } = await getPresencePermissionStatus();
  if (!backgroundGranted) {
    await requestPresencePermissions();
  }

  await startPresenceTracking(profile);
  const status = await getPresencePermissionStatus();
  return status.backgroundGranted;
}

export async function startPresenceTracking(profile) {
  if (!profile?.uid) return;

  await AsyncStorage.setItem(STORAGE_KEYS.uid, profile.uid);
  await AsyncStorage.setItem(STORAGE_KEYS.name, profile.name || '');
  await AsyncStorage.setItem(STORAGE_KEYS.username, profile.username || '');
  await AsyncStorage.setItem(STORAGE_KEYS.role, profile.role || 'empleado');

  const { backgroundGranted } = await getPresencePermissionStatus();
  if (!backgroundGranted) return;

  const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(
    LOCATION_TASK_NAME
  );
  if (alreadyStarted) return;

  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 2 * 60 * 1000,
    distanceInterval: 30,
    foregroundService: {
      notificationTitle: 'El Viejo León',
      notificationBody: 'Detectando si estás en el negocio.',
      notificationColor: '#D97706',
    },
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
  });
}

export async function stopPresenceTracking(uid) {
  const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(
    LOCATION_TASK_NAME
  );
  if (alreadyStarted) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  }

  await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));

  if (uid) {
    try {
      await setDoc(
        doc(db, 'presence', uid),
        {
          status: 'ausente',
          since: null,
          lastSeen: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch {
      // sin conexión al cerrar sesión — no es crítico
    }
  }
}

function withTimeout(promise, ms, timeoutError) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(timeoutError)), ms)),
  ]);
}

export async function refreshPresenceNow() {
  const { foregroundGranted } = await getPresencePermissionStatus();
  if (!foregroundGranted) throw new Error('PERMISSION_DENIED');

  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) throw new Error('LOCATION_SERVICES_DISABLED');

  const location = await withTimeout(
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
    15000,
    'LOCATION_TIMEOUT'
  );
  await processLocation(location.coords);
  return location.coords;
}

export function subscribePresence(callback) {
  const q = query(collection(db, 'presence'), orderBy('name', 'asc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => d.data()));
  });
}
