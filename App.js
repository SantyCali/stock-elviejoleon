import 'react-native-gesture-handler';
import { LogBox, Platform, Text, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import AppNavigator from './src/navigation/AppNavigator';

const MAX_FONT_SCALE = 1.2;

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.maxFontSizeMultiplier = MAX_FONT_SCALE;

TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.maxFontSizeMultiplier = MAX_FONT_SCALE;

LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  '`expo-notifications` functionality is not fully supported in Expo Go',
  'No "projectId" found',
]);

// Mostrar notificaciones aunque la app esté en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Crear el canal de notificaciones en Android (requerido desde Android 8+)
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('pedidos', {
    name: 'Pedidos',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#D97706',
  });
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
