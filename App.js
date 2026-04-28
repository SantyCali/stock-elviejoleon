import 'react-native-gesture-handler';
import { LogBox, Text, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

const MAX_FONT_SCALE = 1.2;

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.maxFontSizeMultiplier = MAX_FONT_SCALE;

TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.maxFontSizeMultiplier = MAX_FONT_SCALE;

// expo-notifications push remoto no está disponible en Expo Go (SDK 53+).
// Las notificaciones locales funcionan igual. Suprimimos el warning conocido.
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  '`expo-notifications` functionality is not fully supported in Expo Go',
  'No "projectId" found',
]);

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
