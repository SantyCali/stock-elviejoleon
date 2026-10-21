const admin = require('firebase-admin');
const { setGlobalOptions } = require('firebase-functions/v2');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentCreated, onDocumentWritten } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const logger = require('firebase-functions/logger');

admin.initializeApp();
setGlobalOptions({ region: 'us-central1', maxInstances: 10 });

const ALLOWED_SENDER_EMAIL = 'santipiedrabuena@gmail.com';
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const PUSH_CHUNK_SIZE = 100;
const ANDROID_CHANNEL_ID = 'pedidos';

exports.sendNotificationToAll = onCall(async (request) => {
  assertAllowedSender(request);

  const title = cleanText(request.data?.title, 'El Viejo Leon', 80);
  const body = cleanText(request.data?.body, '', 300);

  if (!body) {
    throw new HttpsError('invalid-argument', 'El mensaje no puede estar vacio.');
  }

  return sendBroadcast(title, body, { type: 'broadcast' });
});

exports.getPushTokenStats = onCall(async (request) => {
  assertAllowedSender(request);

  const snapshot = await admin.firestore().collection('users').get();
  const tokenCount = snapshot.docs.filter((doc) => isExpoPushToken(doc.data().pushToken)).length;

  return {
    users: snapshot.docs.length,
    tokenCount,
  };
});

exports.sendActivityNotification = onCall(async (request) => {
  const email = String(request.auth?.token?.email || '').toLowerCase();
  if (!email) {
    throw new HttpsError('unauthenticated', 'Tenes que iniciar sesion.');
  }

  const title = cleanText(request.data?.title, 'El Viejo Leon', 80);
  const body = cleanText(request.data?.body, '', 300);

  if (!body) {
    throw new HttpsError('invalid-argument', 'El mensaje no puede estar vacio.');
  }

  return sendBroadcast(title, body, { type: 'activity' });
});

exports.notifyProductCreated = onDocumentCreated('products/{productId}', async (event) => {
  const product = event.data?.data();
  if (!product?.name) return null;

  const title = 'Nuevo articulo';
  const body = `${product.name} ya esta cargado en el stock.`;

  return sendBroadcast(title, body, {
    type: 'new_product',
    productId: event.params.productId,
  });
});

// ── Recordatorios de pedidos pendientes ──────────────────────────────────────
//
// Antes los programaba el celular como notificaciones locales, con dos fallas:
// el texto quedaba congelado (si otro hacia los pedidos despues, seguia avisando
// de todos) y solo existian si alguien abria la app ese dia. Calcularlos aca, al
// momento de enviar, arregla las dos cosas.

const ARGENTINA_OFFSET_HOURS = -3;
const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const CYCLE_MIN_DAYS = { quincenal: 11, mensual: 24 };
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const REMINDER_START_MINUTES = 9 * 60 + 30; // 9:30
const REMINDER_END_MINUTES = 14 * 60; // 14:00

function getArgentinaDate(now = new Date()) {
  return new Date(now.getTime() + ARGENTINA_OFFSET_HOURS * 60 * 60000);
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function getTodayKeyAr(now = new Date()) {
  const t = getArgentinaDate(now);
  const month = String(t.getUTCMonth() + 1).padStart(2, '0');
  const day = String(t.getUTCDate()).padStart(2, '0');
  return `${t.getUTCFullYear()}-${month}-${day}`;
}

function getTodayStartAr(now = new Date()) {
  const t = getArgentinaDate(now);
  const utcMidnight = Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate());
  return new Date(utcMidnight - ARGENTINA_OFFSET_HOURS * 60 * 60000);
}

function isDueToday(provider, now) {
  const minDays = CYCLE_MIN_DAYS[normalizeText(provider.frequency)];
  if (!minDays) return true;

  const lastOrderedAt = provider.lastOrderedAt?.toDate?.();
  if (!lastOrderedAt) return true;

  // Igual que en la app: si el ultimo movimiento es de hoy se mira el anterior,
  // asi lo que pase hoy no altera si hoy correspondia pedirle.
  const sameDay =
    lastOrderedAt.getFullYear() === now.getFullYear() &&
    lastOrderedAt.getMonth() === now.getMonth() &&
    lastOrderedAt.getDate() === now.getDate();

  const reference = sameDay ? provider.previousOrderedAt?.toDate?.() : lastOrderedAt;
  if (!reference) return true;

  return Math.floor((now.getTime() - reference.getTime()) / MS_PER_DAY) >= minDays;
}

async function getPendingProviderNames(now = new Date()) {
  const todayName = DAY_NAMES[getArgentinaDate(now).getUTCDay()];
  const todayKey = getTodayKeyAr(now);
  const todayStart = getTodayStartAr(now);

  const [providersSnap, ordersSnap, manualSnap] = await Promise.all([
    admin.firestore().collection('providers').get(),
    admin.firestore().collection('orders').where('createdAt', '>=', todayStart).get(),
    admin.firestore().collection('manualOrderCompletions').where('dateKey', '==', todayKey).get(),
  ]);

  const done = new Set();
  ordersSnap.docs.forEach((d) => d.data().providerId && done.add(d.data().providerId));
  manualSnap.docs.forEach((d) => d.data().providerId && done.add(d.data().providerId));

  return providersSnap.docs
    .filter((d) => {
      const provider = d.data();
      const deliversToday = (provider.days || []).map(normalizeText).includes(todayName);
      return deliversToday && isDueToday(provider, now) && !done.has(d.id);
    })
    .map((d) => d.data().name || d.id);
}

exports.remindPendingOrders = onSchedule(
  {
    schedule: '0,30 9-14 * * *',
    timeZone: 'America/Argentina/Buenos_Aires',
  },
  async () => {
    const now = new Date();
    const ar = getArgentinaDate(now);
    const minutes = ar.getUTCHours() * 60 + ar.getUTCMinutes();

    // El cron dispara 9:00 y 14:30 de mas; esos dos se descartan.
    if (minutes < REMINDER_START_MINUTES - 5 || minutes > REMINDER_END_MINUTES + 5) {
      logger.info('Fuera de la ventana de recordatorios', { minutes });
      return;
    }

    const pending = await getPendingProviderNames(now);

    if (pending.length === 0) {
      logger.info('Sin pedidos pendientes, no se envia nada');
      return;
    }

    const body =
      pending.length === 1
        ? `Falta el pedido de ${pending[0]}.`
        : `Faltan pedidos de: ${pending.join(', ')}.`;

    try {
      const result = await sendBroadcast('🦁 El Viejo León — Pedidos pendientes', body, {
        type: 'pending_orders',
      });
      logger.info('Recordatorio enviado', { pending: pending.length, ...result });
    } catch (error) {
      logger.error('No se pudo enviar el recordatorio', error);
    }
  }
);

// ── Aviso de llegada al negocio ──────────────────────────────────────────────
//
// Se dispara cuando el documento de presencia pasa a "presente". Como mira la
// transicion y no el valor, las escrituras repetidas de la ubicacion no generan
// avisos duplicados: solo salta cuando alguien que no estaba, llega.

const OWNER_EMAIL = 'santipiedrabuena@gmail.com';
const STALE_PRESENCE_MS = 8 * 60 * 60 * 1000; // igual que en la app
// Periodo sin repetir el aviso de la misma persona. Una hora corta de raiz las
// rafagas y el parpadeo del GPS en el borde del radio, pero sigue avisando si
// alguien se va y vuelve de verdad mas tarde.
const ARRIVAL_COOLDOWN_MS = 60 * 60 * 1000;

// Un "presente" viejo no significa que la persona estuviera: es un dato que
// quedo colgado (celular apagado, salida no detectada). Si no se descartara,
// la proxima llegada real no se veria como un cambio de estado y no avisaria.
function wasReallyPresent(before) {
  if (before?.status !== 'presente') return false;
  if (!before.lastSeen) return false;

  const lastSeen = new Date(before.lastSeen).getTime();
  if (Number.isNaN(lastSeen)) return false;

  return Date.now() - lastSeen <= STALE_PRESENCE_MS;
}

// Los nombres de usuario estan duplicados entre cuentas ("santi" vs
// "santi calivares", y dos cuentas con el mismo mail), asi que los
// destinatarios se resuelven por id de documento, que si es unico.
async function getArrivalRecipients(arrivedUid, arrivedRole) {
  const users = await admin.firestore().collection('users').get();

  const recipients = users.docs.filter((d) => {
    if (!isExpoPushToken(d.data().pushToken)) return false;

    // El duenio recibe todas las llegadas, incluida la suya propia.
    const isOwner = String(d.data().email || '').toLowerCase() === OWNER_EMAIL;
    if (isOwner) return true;

    // Los demas jefes no se avisan a si mismos ni se enteran de las llegadas
    // de otros jefes: solo de los empleados.
    if (d.id === arrivedUid) return false;
    return arrivedRole !== 'jefe' && d.data().role === 'jefe';
  });

  return recipients.map((d) => d.data().pushToken);
}

exports.notifyArrivalAtStore = onDocumentWritten('presence/{uid}', async (event) => {
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();

  if (!after) return null;
  if (after.status !== 'presente') return null;
  if (wasReallyPresent(before)) return null; // ya estaba, no es una llegada

  const name = after.name || after.username || 'Alguien';
  const role = after.role || 'empleado';

  // Mirar el estado anterior no alcanza: la ubicacion se escribe desde varios
  // lados (geocerca, monitoreo de respaldo, la pantalla al abrirse) y si caen
  // juntas, todas ven el mismo "antes" y todas avisan. Pasó: tres avisos del
  // mismo evento en dos segundos.
  //
  // Esto reserva el aviso de forma atomica: de varias ejecuciones simultaneas
  // una sola se lo lleva, y durante el periodo de espera no se repite aunque
  // el GPS haga entrar y salir a la persona del radio.
  const claimRef = admin.firestore().collection('arrivalNotifications').doc(event.params.uid);
  const claimed = await admin.firestore().runTransaction(async (tx) => {
    const snapshot = await tx.get(claimRef);
    const previous = snapshot.data()?.notifiedAt;
    const last = previous ? new Date(previous).getTime() : 0;

    if (Date.now() - last < ARRIVAL_COOLDOWN_MS) return false;

    tx.set(claimRef, { notifiedAt: new Date().toISOString(), name });
    return true;
  });

  if (!claimed) {
    logger.info('Aviso de llegada omitido: ya se aviso hace poco', { name });
    return null;
  }

  const tokens = await getArrivalRecipients(event.params.uid, role);
  if (tokens.length === 0) {
    logger.info('Llegada sin destinatarios', { uid: event.params.uid });
    return null;
  }

  const result = await sendToTokens(
    tokens,
    '🏪 Llegó al negocio',
    `${name} está en el negocio.`,
    { type: 'arrival', uid: event.params.uid }
  );

  logger.info('Aviso de llegada enviado', { name, role, ...result });
  return null;
});

// La geocerca solo escribe al entrar y al salir. Si el aviso de salida se
// pierde (celular apagado, app cerrada por el sistema) la persona queda
// clavada en "presente" sin nada que la destrabe. Esto limpia de madrugada,
// cuando con seguridad el local esta cerrado, para que el dia arranque limpio.
exports.resetPresenceOvernight = onSchedule(
  {
    schedule: '0 3 * * *',
    timeZone: 'America/Argentina/Buenos_Aires',
  },
  async () => {
    const snapshot = await admin.firestore().collection('presence').get();
    const now = new Date().toISOString();

    const stuck = snapshot.docs.filter((d) => d.data().status !== 'ausente');
    if (stuck.length === 0) {
      logger.info('Presencia ya estaba limpia');
      return;
    }

    const batch = admin.firestore().batch();
    stuck.forEach((d) => {
      batch.set(d.ref, { status: 'ausente', since: null, updatedAt: now }, { merge: true });
    });
    await batch.commit();

    logger.info('Presencia reiniciada', {
      limpiados: stuck.map((d) => d.data().name || d.id),
    });
  }
);

async function sendBroadcast(title, body, data = {}) {
  const tokens = await getExpoPushTokens();

  if (tokens.length === 0) {
    throw new HttpsError('failed-precondition', 'No hay dispositivos registrados.');
  }

  const messages = tokens.map((token) => ({
    to: token,
    title,
    body,
    sound: 'default',
    priority: 'high',
    channelId: ANDROID_CHANNEL_ID,
    data,
  }));

  let sent = 0;
  let errors = 0;

  for (let i = 0; i < messages.length; i += PUSH_CHUNK_SIZE) {
    const result = await sendPushChunk(messages.slice(i, i + PUSH_CHUNK_SIZE));
    sent += result.sent;
    errors += result.errors;
  }

  logger.info('Push broadcast finished', { sent, errors });
  return { sent, errors };
}

async function getExpoPushTokens() {
  const snapshot = await admin.firestore().collection('users').get();
  const tokens = snapshot.docs
    .map((doc) => doc.data().pushToken)
    .filter(isExpoPushToken);

  return Array.from(new Set(tokens));
}

async function sendToTokens(tokens, title, body, data = {}) {
  const unique = Array.from(new Set(tokens.filter(isExpoPushToken)));
  if (unique.length === 0) return { sent: 0, errors: 0 };

  const messages = unique.map((token) => ({
    to: token,
    title,
    body,
    sound: 'default',
    priority: 'high',
    channelId: ANDROID_CHANNEL_ID,
    data,
  }));

  let sent = 0;
  let errors = 0;

  for (let i = 0; i < messages.length; i += PUSH_CHUNK_SIZE) {
    const result = await sendPushChunk(messages.slice(i, i + PUSH_CHUNK_SIZE));
    sent += result.sent;
    errors += result.errors;
  }

  return { sent, errors };
}

async function sendPushChunk(messages) {
  let response;

  try {
    response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });
  } catch (error) {
    logger.error('Expo push network error', error);
    throw new HttpsError('unavailable', 'No se pudo contactar Expo Push.');
  }

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    logger.error('Expo push service error', result);
    throw new HttpsError('internal', 'Expo no acepto el envio.');
  }

  const tickets = Array.isArray(result?.data) ? result.data : [];
  return {
    sent: tickets.length || messages.length,
    errors: tickets.filter((ticket) => ticket.status === 'error').length,
  };
}

function cleanText(value, fallback, maxLength) {
  const text = String(value || fallback).trim();
  return text.slice(0, maxLength);
}

function assertAllowedSender(request) {
  const email = String(request.auth?.token?.email || '').toLowerCase();

  if (!email) {
    throw new HttpsError('unauthenticated', 'Tenes que iniciar sesion.');
  }

  if (email !== ALLOWED_SENDER_EMAIL) {
    throw new HttpsError('permission-denied', 'No tenes permiso para enviar notificaciones.');
  }
}

function isExpoPushToken(token) {
  return typeof token === 'string' && token.startsWith('ExponentPushToken[');
}
