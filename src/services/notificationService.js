import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// 9:30 AM → 14:00 cada 30 minutos (hora Argentina)
const REMINDER_TIMES = [
  { hour: 9, minute: 30 },
  { hour: 10, minute: 0 },
  { hour: 10, minute: 30 },
  { hour: 11, minute: 0 },
  { hour: 11, minute: 30 },
  { hour: 12, minute: 0 },
  { hour: 12, minute: 30 },
  { hour: 13, minute: 0 },
  { hour: 13, minute: 30 },
  { hour: 14, minute: 0 },
];

export async function requestNotificationPermissions() {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('pedidos', {
        name: 'Recordatorios de pedidos',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#D97706',
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.log('Error pidiendo permisos de notificaciones:', error);
    return false;
  }
}

export async function scheduleOrderReminders(pendingNames = []) {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (pendingNames.length === 0) return;

    const count = pendingNames.length;
    const body =
      count === 1
        ? `Falta el pedido de ${pendingNames[0]}.`
        : `Faltan pedidos de: ${pendingNames.join(', ')}.`;

    const now = new Date();

    for (const { hour, minute } of REMINDER_TIMES) {
      const trigger = new Date();
      trigger.setHours(hour, minute, 0, 0);

      if (trigger > now) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🦁 El Viejo León — Pedidos pendientes',
            body,
            sound: true,
          },
          trigger: {
            type: SchedulableTriggerInputTypes.DATE,
            date: trigger,
          },
        });
      }
    }
  } catch (error) {
    console.log('Error programando recordatorios:', error);
  }
}

export async function cancelAllReminders() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.log('Error cancelando recordatorios:', error);
  }
}
