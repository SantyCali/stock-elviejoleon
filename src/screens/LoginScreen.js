import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { signInUser } from '../services/authService';
import { COLORS } from '../theme';

export default function LoginScreen({ navigation }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!login.trim() || !password.trim()) {
      Alert.alert('Faltan datos', 'Completá usuario o email y contraseña.');
      return;
    }

    try {
      setLoading(true);
      await signInUser(login, password);
    } catch (error) {
      console.log(error);
      Alert.alert(
        'Error al ingresar',
        'Revisá el usuario/email y la contraseña.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.brandArea}>
        <Text style={styles.brandEmoji}>🦁</Text>
        <Text style={styles.brandName}>El Viejo León</Text>
        <Text style={styles.brandTagline}>Gestión de stock y pedidos</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ingresá a tu cuenta</Text>

        <TextInput
          placeholder="Nombre de usuario o email"
          placeholderTextColor={COLORS.textMuted}
          value={login}
          onChangeText={setLogin}
          style={styles.input}
          autoCapitalize="none"
        />

        <TextInput
          placeholder="Contraseña"
          placeholderTextColor={COLORS.textMuted}
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry
        />

        <Pressable
          style={({ pressed }) => [
            styles.button,
            loading && styles.buttonDisabled,
            pressed && !loading && styles.buttonPressed,
          ]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Ingresando...' : 'Entrar'}
          </Text>
        </Pressable>

        <Pressable
          style={styles.linkButton}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.linkText}>¿No tenés cuenta? Crear cuenta</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    padding: 20,
  },
  brandArea: {
    alignItems: 'center',
    marginBottom: 28,
  },
  brandEmoji: {
    fontSize: 52,
    marginBottom: 8,
  },
  brandName: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  brandTagline: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 18,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 12,
    backgroundColor: COLORS.cardAlt,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  button: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: COLORS.accentDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonPressed: {
    backgroundColor: COLORS.accentDark,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: COLORS.accent,
    fontWeight: '600',
    fontSize: 14,
  },
});
