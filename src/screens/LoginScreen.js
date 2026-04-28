import React, { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { resetPassword, signInUser } from '../services/authService';
import { COLORS } from '../theme';

export default function LoginScreen({ navigation }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot password modal
  const [forgotVisible, setForgotVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Eye icon bounce animation
  const eyeScale = useRef(new Animated.Value(1)).current;

  function togglePassword() {
    Animated.sequence([
      Animated.timing(eyeScale, { toValue: 0.65, duration: 80, useNativeDriver: true }),
      Animated.spring(eyeScale, { toValue: 1, useNativeDriver: true, tension: 180, friction: 7 }),
    ]).start();
    setShowPassword((prev) => !prev);
  }

  function openForgot() {
    setResetEmail(login.includes('@') ? login : '');
    setResetSent(false);
    setForgotVisible(true);
  }

  function closeForgot() {
    setForgotVisible(false);
    setResetEmail('');
    setResetSent(false);
  }

  async function handleResetPassword() {
    if (!resetEmail.trim()) {
      Alert.alert('Ingresá tu email', 'Escribí el email con el que te registraste.');
      return;
    }
    try {
      setSendingReset(true);
      await resetPassword(resetEmail);
      setResetSent(true);
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar el email. Verificá que el email esté registrado.');
    } finally {
      setSendingReset(false);
    }
  }

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
      Alert.alert('Error al ingresar', 'Revisá el usuario/email y la contraseña.');
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

        {/* Contraseña con ojo */}
        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Contraseña"
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

        {/* Olvidaste tu contraseña */}
        <Pressable onPress={openForgot} style={styles.forgotLink}>
          <Text style={styles.forgotLinkText}>¿Olvidaste tu contraseña?</Text>
        </Pressable>

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

      {/* ── Modal: Recuperar contraseña ──────────────────────────────────── */}
      <Modal
        visible={forgotVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeForgot}
      >
        <Pressable style={styles.modalOverlay} onPress={closeForgot}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Recuperar contraseña</Text>
                <Text style={styles.modalSubtitle}>
                  Te mandamos un link por email para resetearla.
                </Text>
              </View>
              <Pressable onPress={closeForgot} style={styles.closeBtn} hitSlop={8}>
                <Ionicons name="close" size={18} color={COLORS.textSecondary} />
              </Pressable>
            </View>

            {resetSent ? (
              /* Estado: enviado */
              <View style={styles.sentBox}>
                <Ionicons name="checkmark-circle" size={44} color="#16a34a" />
                <Text style={styles.sentTitle}>¡Email enviado!</Text>
                <Text style={styles.sentBody}>
                  Revisá tu bandeja de entrada en {resetEmail} y seguí el link para cambiar tu contraseña.
                </Text>
                <Pressable style={styles.sentCloseBtn} onPress={closeForgot}>
                  <Text style={styles.sentCloseBtnText}>Listo</Text>
                </Pressable>
              </View>
            ) : (
              /* Formulario */
              <>
                <Text style={styles.fieldLabel}>Email</Text>
                <TextInput
                  style={styles.modalInput}
                  value={resetEmail}
                  onChangeText={setResetEmail}
                  placeholder="tu@email.com"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoFocus
                />
                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    sendingReset && styles.buttonDisabled,
                    pressed && !sendingReset && styles.buttonPressed,
                  ]}
                  onPress={handleResetPassword}
                  disabled={sendingReset}
                >
                  <Text style={styles.buttonText}>
                    {sendingReset ? 'Enviando...' : 'Enviar link de recuperación'}
                  </Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
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

  // ── Contraseña con ojo ────────────────────────────────────────────────
  passwordContainer: {
    position: 'relative',
    justifyContent: 'center',
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

  // ── Olvidé contraseña ─────────────────────────────────────────────────
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 16,
  },
  forgotLinkText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Botones principales ───────────────────────────────────────────────
  button: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
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

  // ── Modal ─────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    maxWidth: '85%',
    lineHeight: 18,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 16,
    backgroundColor: COLORS.cardAlt,
    color: COLORS.textPrimary,
    fontSize: 15,
  },

  // ── Estado: email enviado ─────────────────────────────────────────────
  sentBox: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  sentTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 12,
    marginBottom: 8,
  },
  sentBody: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  sentCloseBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  sentCloseBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
