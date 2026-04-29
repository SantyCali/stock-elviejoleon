import { sendBroadcastNotification } from './pushTokenService';

function getActorName(profile, fallback = 'Alguien') {
  return String(profile?.name || profile?.username || fallback).trim() || fallback;
}

async function notifyActivity(title, body) {
  try {
    await sendBroadcastNotification(title, body);
  } catch (error) {
    console.log('No se pudo enviar la notificacion:', error);
  }
}

export function notifyStockLoaded({ profile, providerName }) {
  const actor = getActorName(profile);
  const cleanProviderName = String(providerName || 'un proveedor').trim();

  return notifyActivity(
    'Stock cargado',
    `${actor} ya cargo el stock de ${cleanProviderName} :D`
  );
}

export function notifyOrderFinished({ profile, providerName }) {
  const actor = getActorName(profile);
  const cleanProviderName = String(providerName || 'un proveedor').trim();

  return notifyActivity(
    'Pedido terminado',
    `${actor} ya termino el pedido de ${cleanProviderName} :D`
  );
}
