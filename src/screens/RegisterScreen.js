import React, { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { registerUser } from '../services/authService';
import { COLORS } from '../theme';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('empleado');
  const [loading, setLoading] = useState(false);

  const eyeScale = useRef(new Animated.Value(1)).current;

  function togglePassword() {
    Animated.sequence([
      Animated.timing(eyeScale, { toValue: 0.65, duration: 80, useNativeDriver: true }),
      Animated.spring(eyeScale, { toValue: 1, useNativeDriver: true, tension: 180, friction: 7 }),
    ]).start();
    setShowPassword((prev) => !prev);
  }

  async function handleRegister() {
    if (!name.trim() || !username.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Faltan datos', 'Completá nombre, usuario, email y contraseña.');
      return;
    }

    try {
      setLoading(true);
      await registerUser({ name, username, email, password, role });
      Alert.alert('Cuenta creada', 'La cuenta se creó correctamente.');
    } catch (error) {
      console.log(error);
      if (error.message === 'USERNAME_ALREADY_EXISTS') {
        Alert.alert('Error', 'Ese nombre de usuario ya existe.');
        return;
      }
      Alert.alert('Error', 'No se pudo crear la cuenta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.cardTopBar} />
          <View style={styles.cardContent}>
            <Text style={styles.title}>Crear cuenta</Text>
            <Text style={styles.subtitle}>Completá los datos para registrarte</Text>

            <Text style={styles.fieldLabel}>Nombre</Text>
            <TextInput
              placeholder="Tu nombre completo"
              placeholderTextColor={COLORS.textMuted}
              value={name}
              onChangeText={setName}
              style={styles.input}
            />

            <Text style={styles.fieldLabel}>Usuario</Text>
            <TextInput
              placeholder="Nombre de usuario"
              placeholderTextColor={COLORS.textMuted}
              value={username}
              onChangeText={setUsername}
              style={styles.input}
              autoCapitalize="none"
            />

            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              placeholder="tu@email.com"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.fieldLabel}>Contraseña</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={setPassword}
                style={[styles.input, styles.passwordInput]}
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={togglePassword} style={styles.eyeBtn} hitSlop={8}>
                <Animated.View style={{ transform: [{ scale: eyeScale }] }}>
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={21}
                    color={COLORS.textSecondary}
                  />
                </Animated.View>
              </Pressable>
            </View>

            <Text style={styles.fieldLabel}>Rol</Text>
            <View style={styles.roleRow}>
              <Pressable
                style={[styles.roleButton, role === 'empleado' && styles.roleButtonActive]}
                onPress={() => setRole('empleado')}
              >
                {role === 'empleado' && <View style={styles.roleCheck} />}
                <Text style={[styles.roleButtonText, role === 'empleado' && styles.roleButtonTextActive]}>
                  Empleado
                </Text>
              </Pressable>

              <Pressable
                style={[styles.roleButton, role === 'jefe' && styles.roleButtonActive]}
                onPress={() => setRole('jefe')}
              >
                {role === 'jefe' && <View style={styles.roleCheck} />}
                <Text style={[styles.roleButtonText, role === 'jefe' && styles.roleButtonTextActive]}>
                  Jefe
                </Text>
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                loading && styles.buttonDisabled,
                pressed && !loading && styles.buttonPressed,
              ]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Creando cuenta...' : '✅  Crear cuenta'}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTopBar: {
    height: 5,
    backgroundColor: COLORS.accent,
  },
  cardContent: {
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 14,
    backgroundColor: COLORS.cardAlt,
    color: COLORS.textPrimary,
    fontSize: 15,
  },

  // ── Contraseña con ojo ────────────────────────────────────────────────
  passwordContainer: {
    position: 'relative',
    justifyContent: 'center',
    marginBottom: 14,
  },
  passwordInput: {
    paddingRight: 46,
    marginBottom: 0,
  },
  eyeBtn: {
    position: 'absolute',
    right: 13,
    padding: 4,
  },

  roleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  roleButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.cardAlt,
  },
  roleButtonActive: {
    backgroundColor: COLORS.accentLight,
    borderColor: COLORS.accent,
  },
  roleCheck: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
  },
  roleButtonText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  roleButtonTextActive: {
    color: COLORS.accentDark,
    fontWeight: '700',
  },
  button: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: COLORS.accentDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
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
});
