import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { sendBroadcastNotification } from '../services/pushTokenService';
import { COLORS } from '../theme';

export default function SendNotificationScreen() {
  const [title, setTitle] = useState('El Viejo León');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null); // { sent, errors } | 'error'

  const successScale = useRef(new Animated.Value(0.8)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  async function handleSend() {
    if (!body.trim()) return;
    setSending(true);
    setResult(null);

    try {
      const res = await sendBroadcastNotification(title.trim() || 'El Viejo León', body.trim());
      setResult(res);
      Animated.parallel([
        Animated.spring(successScale, { toValue: 1, useNativeDriver: true, tension: 140, friction: 8 }),
        Animated.timing(successOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } catch (err) {
      const code = err?.message;
      setResult(code === 'NO_TOKENS' ? 'no_tokens' : 'error');
      successScale.setValue(0.8);
      successOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(successScale, { toValue: 1, useNativeDriver: true, tension: 140, friction: 8 }),
        Animated.timing(successOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } finally {
      setSending(false);
    }
  }

  function handleClear() {
    setBody('');
    setTitle('El Viejo León');
    setResult(null);
    successOpacity.setValue(0);
  }

  const canSend = body.trim().length > 0 && !sending;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Info banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="megaphone-outline" size={22} color={COLORS.accent} />
          <Text style={styles.infoText}>
            Enviá un aviso a todos los dispositivos que tengan la app instalada.
          </Text>
        </View>

        {/* Título */}
        <Text style={styles.label}>Título</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="El Viejo León"
          placeholderTextColor={COLORS.textSecondary}
          maxLength={80}
          returnKeyType="next"
        />

        {/* Mensaje */}
        <Text style={styles.label}>Mensaje</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={body}
          onChangeText={setBody}
          placeholder="Escribí el aviso acá..."
          placeholderTextColor={COLORS.textSecondary}
          multiline
          maxLength={300}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{body.length}/300</Text>

        {/* Botón enviar */}
        <Pressable
          style={({ pressed }) => [
            styles.sendBtn,
            !canSend && styles.sendBtnDisabled,
            pressed && canSend && styles.sendBtnPressed,
          ]}
          onPress={handleSend}
          disabled={!canSend}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={18} color="#fff" style={styles.sendIcon} />
              <Text style={styles.sendBtnText}>Enviar notificación</Text>
            </>
          )}
        </Pressable>

        {/* Resultado */}
        {result !== null && (
          <Animated.View
            style={[
              styles.resultCard,
              typeof result === 'object' ? styles.resultSuccess : styles.resultError,
              { opacity: successOpacity, transform: [{ scale: successScale }] },
            ]}
          >
            {typeof result === 'object' ? (
              <>
                <Ionicons name="checkmark-circle" size={28} color="#16a34a" style={styles.resultIcon} />
                <Text style={styles.resultTitle}>¡Enviado!</Text>
                <Text style={styles.resultBody}>
                  Notificación enviada a {result.sent} dispositivo{result.sent !== 1 ? 's' : ''}.
                  {result.errors > 0 ? ` (${result.errors} fallaron)` : ''}
                </Text>
                <Pressable style={styles.clearBtn} onPress={handleClear}>
                  <Text style={styles.clearBtnText}>Nuevo mensaje</Text>
                </Pressable>
              </>
            ) : result === 'no_tokens' ? (
              <>
                <Ionicons name="phone-portrait-outline" size={28} color={COLORS.accent} style={styles.resultIcon} />
                <Text style={styles.resultTitle}>Sin dispositivos</Text>
                <Text style={styles.resultBody}>
                  Ningún dispositivo tiene registrado su token todavía. Abrí la app en cada celular al menos una vez.
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="alert-circle-outline" size={28} color="#ef4444" style={styles.resultIcon} />
                <Text style={styles.resultTitle}>Error al enviar</Text>
                <Text style={styles.resultBody}>
                  No se pudo enviar la notificación. Verificá la conexión a internet e intentá de nuevo.
                </Text>
              </>
            )}
          </Animated.View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    padding: 18,
    paddingBottom: 40,
  },
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
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  textarea: {
    height: 130,
    paddingTop: 13,
    marginBottom: 6,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginBottom: 24,
  },
  sendBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.accentDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  sendBtnPressed: {
    backgroundColor: COLORS.accentDark,
  },
  sendIcon: {
    marginRight: 8,
  },
  sendBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  resultCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  resultSuccess: {
    backgroundColor: '#DCFCE7',
  },
  resultError: {
    backgroundColor: '#FEF2F2',
  },
  resultIcon: {
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  resultBody: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  clearBtn: {
    marginTop: 14,
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 9,
  },
  clearBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
