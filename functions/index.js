const admin = require('firebase-admin');
const { setGlobalOptions } = require('firebase-functions/v2');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
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
