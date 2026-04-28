import React, { useRef, useState } from 'react';
import {
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
import { changePassword } from '../services/authService';
import { COLORS } from '../theme';

function PasswordField({ label, value, onChangeText, placeholder }) {
  const [show, setShow] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  function toggle() {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.65, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 180, friction: 7 }),
    ]).start();
    setShow((p) => !p);
  }

  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, styles.inputWithEye]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry={!show}
          autoCapitalize="none"
        />
        <Pressable onPress={toggle} style={styles.eyeBtn} hitSlop={8}>
          <Animated.View style={{ transform: [{ scale }] }}>
            <Ionicons
              name={show ? 'eye-outline' : 'eye-off-outline'}
              size={21}
              color={COLORS.textSecondary}
            />
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

export default function ChangePasswordScreen({ navigation }) {
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const successScale = useRef(new Animated.Value(0.85)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  function validate() {
    if (!currentPwd.trim()) return 'Ingresá tu contraseña actual.';
    if (newPwd.length < 6) return 'La nueva contraseña debe tener al menos 6 caracteres.';
    if (newPwd !== confirmPwd) return 'Las contraseñas nuevas no coinciden.';
    if (currentPwd === newPwd) return 'La nueva contraseña debe ser diferente a la actual.';
    return null;
  }

  async function handleChange() {
    const error = validate();
    if (error) {
      // show inline — handled by state below
      setValidationMsg(error);
      return;
    }
    setValidationMsg('');
    try {
      setLoading(true);
      await changePassword(currentPwd, newPwd);
      setDone(true);
      Animated.parallel([
        Animated.spring(successScale, { toValue: 1, useNativeDriver: true, tension: 140, friction: 8 }),
        Animated.timing(successOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } catch (err) {
      const code = err?.code || '';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setValidationMsg('La contraseña actual es incorrecta.');
      } else if (code === 'auth/too-many-requests') {
        setValidationMsg('Demasiados intentos. Esperá unos minutos e intentá de nuevo.');
      } else {
        setValidationMsg('Ocurrió un error. Intentá de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  }

  const [validationMsg, setValidationMsg] = useState('');

  const canSubmit = currentPwd.length > 0 && newPwd.length >= 6 && confirmPwd.length >= 6 && !loading;

  if (done) {
    return (
      <View style={styles.doneContainer}>
        <Animated.View style={[styles.doneCard, { opacity: successOpacity, transform: [{ scale: successScale }] }]}>
          <Ionicons name="checkmark-circle" size={60} color="#16a34a" />
          <Text style={styles.doneTitle}>¡Contraseña actualizada!</Text>
          <Text style={styles.doneBody}>
            Tu contraseña se cambió correctamente en Firebase. La próxima vez que inicies sesión usá la nueva.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.doneBtn, pressed && styles.doneBtnPressed]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.doneBtnText}>Listo</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        <View style={styles.infoBanner}>
          <Ionicons name="lock-closed-outline" size={20} color={COLORS.accent} />
          <Text style={styles.infoText}>
            Ingresá tu contraseña actual y la nueva para actualizarla directo en Firebase.
          </Text>
        </View>

        <PasswordField
          label="Contraseña actual"
          value={currentPwd}
          onChangeText={(t) => { setCurrentPwd(t); setValidationMsg(''); }}
          placeholder="Tu contraseña actual"
        />

        <PasswordField
          label="Nueva contraseña"
          value={newPwd}
          onChangeText={(t) => { setNewPwd(t); setValidationMsg(''); }}
          placeholder="Mínimo 6 caracteres"
        />

        <PasswordField
          label="Confirmar nueva contraseña"
          value={confirmPwd}
          onChangeText={(t) => { setConfirmPwd(t); setValidationMsg(''); }}
          placeholder="Repetí la nueva contraseña"
        />

        {!!validationMsg && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
            <Text style={styles.errorText}>{validationMsg}</Text>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.btn,
            !canSubmit && styles.btnDisabled,
            pressed && canSubmit && styles.btnPressed,
          ]}
          onPress={handleChange}
          disabled={!canSubmit}
        >
          {loading ? (
            <Text style={styles.btnText}>Cambiando...</Text>
          ) : (
            <Text style={styles.btnText}>Cambiar contraseña</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.bg },
  container: { padding: 18, paddingBottom: 40 },

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.accentLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.accentDark,
    fontWeight: '600',
    lineHeight: 20,
  },

  fieldBlock: { marginBottom: 16 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  inputRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: COLORS.card,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  inputWithEye: { paddingRight: 46 },
  eyeBtn: { position: 'absolute', right: 13, padding: 4 },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
  },

  btn: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: COLORS.accentDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  btnDisabled: { backgroundColor: COLORS.border, shadowOpacity: 0, elevation: 0 },
  btnPressed: { backgroundColor: COLORS.accentDark },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  // ── Éxito ────────────────────────────────────────────────────────────
  doneContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    padding: 24,
  },
  doneCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  doneTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 14,
    marginBottom: 10,
  },
  doneBody: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  doneBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingHorizontal: 36,
    paddingVertical: 13,
  },
  doneBtnPressed: { backgroundColor: COLORS.accentDark },
  doneBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
