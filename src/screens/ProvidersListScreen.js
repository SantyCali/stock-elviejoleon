import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { createProvider, getProviders } from '../services/providerService';
import { hasOrderDoneToday } from '../services/orderService';
import { getTodayName } from '../utils/dates';
import { COLORS } from '../theme';

const MAX_FONT_SCALE = 1.2;
const DAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const FREQUENCIES = ['semanal', 'quincenal', 'mensual'];

function normalize(str) {
  return String(str)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export default function ProvidersListScreen({ navigation }) {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [createVisible, setCreateVisible] = useState(false);
  const [newProviderName, setNewProviderName] = useState('');
  const [newProviderAlias, setNewProviderAlias] = useState('');
  const [newProviderDays, setNewProviderDays] = useState([]);
  const [newProviderFrequency, setNewProviderFrequency] = useState('semanal');
  const [creating, setCreating] = useState(false);
  const [doneToday, setDoneToday] = useState(new Set());
  const aliasInputRef = useRef(null);
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      loadProviders();
    }, [])
  );

  async function loadProviders() {
    try {
      setLoading(true);
      const data = await getProviders();
      setProviders(data);

      const todayNorm = normalize(getTodayName());
      const todayProviders = data.filter(p =>
        (p.days || []).map(normalize).includes(todayNorm)
      );
      const statusList = await Promise.all(
        todayProviders.map(async p => ({ id: p.id, done: await hasOrderDoneToday(p.id) }))
      );
      setDoneToday(new Set(statusList.filter(s => s.done).map(s => s.id)));
    } catch (error) {
      console.log('Error cargando proveedores:', error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return providers;
    return providers.filter(p => {
      if (normalize(p.name).includes(q)) return true;
      if (p.alias?.some(a => normalize(a).includes(q))) return true;
      return false;
    });
  }, [providers, query]);

  function formatDays(days = []) {
    if (!days.length) return 'Sin días cargados';
    return days.join(', ');
  }

  function openCreateProvider() {
    setNewProviderName('');
    setNewProviderAlias('');
    setNewProviderDays([]);
    setNewProviderFrequency('semanal');
    setCreateVisible(true);
    scaleAnim.setValue(0.85);
    opacityAnim.setValue(0);
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 130, friction: 8 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  }

  function closeCreateProvider(callback) {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0.85, duration: 140, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 140, useNativeDriver: true }),
    ]).start(() => {
      setCreateVisible(false);
      if (callback) callback();
    });
  }

  function toggleNewProviderDay(day) {
    setNewProviderDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleCreateProvider() {
    const trimmed = newProviderName.trim();
    if (!trimmed) {
      Alert.alert('Falta dato', 'Escribí el nombre del proveedor.');
      return;
    }
    if (newProviderDays.length === 0) {
      Alert.alert('Falta dato', 'Elegí al menos un día de pedido.');
      return;
    }
    if (providers.some((p) => normalize(p.name) === normalize(trimmed))) {
      Alert.alert('Ya existe', 'Ya hay un proveedor con ese nombre.');
      return;
    }

    try {
      setCreating(true);
      const provider = await createProvider({
        name: trimmed,
        alias: newProviderAlias,
        days: newProviderDays,
        frequency: newProviderFrequency,
      });
      setProviders((prev) =>
        [...prev, provider].sort((a, b) => a.name.localeCompare(b.name))
      );
      closeCreateProvider();
    } catch (error) {
      console.log('Error creando proveedor:', error);
      if (error?.message === 'PROVIDER_ALREADY_EXISTS') {
        Alert.alert('Ya existe', 'Ya hay un proveedor con ese nombre.');
        return;
      }
      Alert.alert('Error', 'No se pudo crear el proveedor.');
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loaderText} maxFontSizeMultiplier={MAX_FONT_SCALE}>Cargando proveedores...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerArea}>
        <Text style={styles.title} maxFontSizeMultiplier={MAX_FONT_SCALE}>Proveedores</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            {query.trim() ? filtered.length : providers.length}
          </Text>
        </View>
      </View>
      <Text style={styles.subtitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>Tocá uno para ver sus productos</Text>

      {/* Buscador */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar proveedor..."
          placeholderTextColor={COLORS.textMuted}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          clearButtonMode="never"
          autoCorrect={false}
          underlineColorAndroid="transparent"
          maxFontSizeMultiplier={MAX_FONT_SCALE}
        />
        {!!query && (
          <Pressable onPress={() => setQuery('')} style={styles.clearButton} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
          </Pressable>
        )}
      </View>

      <Pressable
        style={({ pressed }) => [styles.addProviderButton, pressed && styles.addProviderButtonPressed]}
        onPress={openCreateProvider}
      >
        <Ionicons name="add-circle-outline" size={17} color={COLORS.accent} />
        <Text style={styles.addProviderText} maxFontSizeMultiplier={MAX_FONT_SCALE}>Agregar proveedor</Text>
      </Pressable>

      {filtered.length === 0 && !!query.trim() && (
        <View style={styles.emptySearch}>
          <Text style={styles.emptySearchIcon} maxFontSizeMultiplier={MAX_FONT_SCALE}>🔍</Text>
          <Text style={styles.emptySearchText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            No se encontró ningún proveedor con "{query}"
          </Text>
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        extraData={doneToday}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => {
          const done = doneToday.has(item.id);
          return (
            <Pressable
              style={({ pressed }) => [styles.card, done && styles.cardDone, pressed && styles.cardPressed]}
              onPress={() => navigation.navigate('Provider', { provider: item })}
            >
              <View style={[styles.cardAccent, done && styles.cardAccentDone]} />
              <View style={styles.cardBody}>
                <View style={styles.topRow}>
                  <View style={[styles.numberBadge, done && styles.numberBadgeDone]}>
                    <Text style={[styles.numberText, done && styles.numberTextDone]} maxFontSizeMultiplier={MAX_FONT_SCALE}>{index + 1}</Text>
                  </View>
                  <Text style={styles.name} maxFontSizeMultiplier={MAX_FONT_SCALE}>{item.name}</Text>
                  {done && <Ionicons name="checkmark-circle" size={18} color="#16a34a" />}
                </View>

                {!!item.alias?.length && (
                  <Text style={styles.info} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                    También conocido como: {item.alias.join(', ')}
                  </Text>
                )}

                <Text style={styles.info} maxFontSizeMultiplier={MAX_FONT_SCALE}>📅 {formatDays(item.days)}</Text>

                <View style={styles.chipRow}>
                  {!!(item.frequency) && (
                    <View style={styles.chip}>
                      <Text style={styles.chipText} maxFontSizeMultiplier={MAX_FONT_SCALE}>{item.frequency}</Text>
                    </View>
                  )}
                  {!!item.categories?.length && (
                    <View style={styles.chip}>
                      <Text style={styles.chipText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                        {item.categories.length} categoría{item.categories.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  )}
                  {done && (
                    <View style={[styles.chip, styles.chipDone]}>
                      <Text style={[styles.chipText, styles.chipTextDone]} maxFontSizeMultiplier={MAX_FONT_SCALE}>Pedido hecho ✓</Text>
                    </View>
                  )}
                </View>

                {item.isJoke && (
                  <Text style={styles.joke} maxFontSizeMultiplier={MAX_FONT_SCALE}>Proveedor humorístico 😎</Text>
                )}
              </View>
            </Pressable>
          );
        }}
      />

      <Modal
        visible={createVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => closeCreateProvider()}
      >
        <Pressable style={styles.modalOverlay} onPress={() => closeCreateProvider()}>
          <Animated.View
            style={[styles.modalCard, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              <Pressable onPress={Keyboard.dismiss}>
                <Text style={styles.modalTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>Agregar proveedor</Text>
                <Text style={styles.modalSubtitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                  Creá el proveedor y después cargale categorías y artículos.
                </Text>

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Nombre del proveedor..."
                    placeholderTextColor={COLORS.textMuted}
                    value={newProviderName}
                    onChangeText={setNewProviderName}
                    autoFocus
                    returnKeyType="next"
                    onSubmitEditing={() => aliasInputRef.current?.focus()}
                    blurOnSubmit={false}
                    underlineColorAndroid="transparent"
                    maxFontSizeMultiplier={MAX_FONT_SCALE}
                  />

                  <TextInput
                    ref={aliasInputRef}
                    style={styles.modalInput}
                    placeholder="Apodo o tambien conocido como..."
                    placeholderTextColor={COLORS.textMuted}
                    value={newProviderAlias}
                    onChangeText={setNewProviderAlias}
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                    underlineColorAndroid="transparent"
                    maxFontSizeMultiplier={MAX_FONT_SCALE}
                  />
                </KeyboardAvoidingView>

                <Text style={styles.modalLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>Días de pedido</Text>
                <View style={styles.pickerWrap}>
                  {DAYS.map((day) => {
                    const selected = newProviderDays.includes(day);
                    return (
                      <Pressable
                        key={day}
                        style={[styles.pickerChip, selected && styles.pickerChipActive]}
                        onPress={() => toggleNewProviderDay(day)}
                      >
                        <Text style={[styles.pickerChipText, selected && styles.pickerChipTextActive]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                          {day}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.modalLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>Frecuencia</Text>
                <View style={styles.pickerWrap}>
                  {FREQUENCIES.map((frequency) => {
                    const selected = newProviderFrequency === frequency;
                    return (
                      <Pressable
                        key={frequency}
                        style={[styles.pickerChip, selected && styles.pickerChipActive]}
                        onPress={() => setNewProviderFrequency(frequency)}
                      >
                        <Text style={[styles.pickerChipText, selected && styles.pickerChipTextActive]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                          {frequency}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.modalButtons}>
                  <Pressable
                    style={({ pressed }) => [styles.modalCancelButton, pressed && styles.modalCancelButtonPressed]}
                    onPress={() => closeCreateProvider()}
                    disabled={creating}
                  >
                    <Text style={styles.modalCancelText} maxFontSizeMultiplier={MAX_FONT_SCALE}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.modalConfirmButton,
                      (creating || newProviderDays.length === 0) && styles.modalConfirmButtonDisabled,
                      pressed && !creating && newProviderDays.length > 0 && styles.modalConfirmButtonPressed,
                    ]}
                    onPress={handleCreateProvider}
                    disabled={creating}
                  >
                    <Text style={styles.modalConfirmText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                      {creating ? 'Guardando...' : 'Crear'}
                    </Text>
                  </Pressable>
                </View>
              </Pressable>
            </ScrollView>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  loaderText: {
    marginTop: 10,
    color: COLORS.textSecondary,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 16,
  },
  headerArea: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 1,
  },
  countBadge: {
    backgroundColor: COLORS.accent,
    borderRadius: 20,
    minWidth: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  countBadgeText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    backgroundColor: 'transparent',
    padding: 0,
  },
  clearButton: {
    marginLeft: 6,
  },
  addProviderButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.accentLight,
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 14,
  },
  addProviderButtonPressed: {
    backgroundColor: '#FED7AA',
  },
  addProviderText: {
    color: COLORS.accentDark,
    fontWeight: '800',
    fontSize: 12,
  },
  emptySearch: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptySearchIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  emptySearchText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    paddingBottom: 140,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardDone: {
    backgroundColor: '#F0FDF4',
  },
  cardAccent: {
    width: 5,
    backgroundColor: COLORS.accent,
  },
  cardAccentDone: {
    backgroundColor: '#16a34a',
  },
  cardBody: {
    flex: 1,
    padding: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  numberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  numberBadgeDone: {
    backgroundColor: '#DCFCE7',
  },
  numberText: {
    fontWeight: '800',
    fontSize: 13,
    color: COLORS.accentDark,
  },
  numberTextDone: {
    color: '#166534',
  },
  name: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 1,
    flexShrink: 1,
  },
  info: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 5,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    backgroundColor: COLORS.borderLight,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  chipDone: {
    backgroundColor: '#DCFCE7',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  chipTextDone: {
    color: '#166534',
    fontWeight: '700',
  },
  joke: {
    marginTop: 6,
    color: '#7c3aed',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 16,
    lineHeight: 17,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.cardAlt,
    color: COLORS.textPrimary,
    fontSize: 15,
    marginBottom: 14,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  pickerWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  pickerChip: {
    backgroundColor: COLORS.cardAlt,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  pickerChipActive: {
    backgroundColor: COLORS.accentLight,
    borderColor: COLORS.accent,
  },
  pickerChipText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  pickerChipTextActive: {
    color: COLORS.accentDark,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  modalCancelButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelButtonPressed: {
    backgroundColor: COLORS.cardAlt,
  },
  modalCancelText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 14,
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: COLORS.accentDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  modalConfirmButtonPressed: {
    backgroundColor: COLORS.accentDark,
  },
  modalConfirmButtonDisabled: {
    opacity: 0.6,
  },
  modalConfirmText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
