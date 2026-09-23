import React, { useState } from 'react';
import {
  Alert,
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
import { getCurrentUser, updateUserName } from '../services/authService';
import { COLORS } from '../theme';

export default function EditNameScreen({ route, navigation }) {
  const { currentName = '' } = route.params || {};
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);

  const canSubmit = name.trim().length > 0 && !saving;

  async function handleSave() {
    const cleanName = name.trim();
    if (!cleanName) return;

    try {
      setSaving(true);
      const currentUser = getCurrentUser();
      if (!currentUser) throw new Error('NOT_AUTHENTICATED');
      await updateUserName(currentUser.uid, cleanName);
      navigation.goBack();
    } catch (error) {
      console.log('Error actualizando nombre:', error);
      Alert.alert('Error', 'No se pudo guardar el nombre.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.infoBanner}>
          <Ionicons name="person-outline" size={20} color={COLORS.accent} />
          <Text style={styles.infoText}>
            Este nombre es el que se muestra en el menú y en las notificaciones de actividad.
          </Text>
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ej: Ezequiel"
            placeholderTextColor={COLORS.textMuted}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.btn,
            !canSubmit && styles.btnDisabled,
            pressed && canSubmit && styles.btnPressed,
          ]}
          onPress={handleSave}
          disabled={!canSubmit}
        >
          <Text style={styles.btnText}>{saving ? 'Guardando...' : 'Guardar nombre'}</Text>
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

  fieldBlock: { marginBottom: 20 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
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
});
