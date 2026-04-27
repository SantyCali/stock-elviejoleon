import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
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
import {
  createProduct,
  getCategoriesByProvider,
} from '../services/productAdminService';
import { COLORS } from '../theme';

export default function AddProductScreen({ route, navigation }) {
  const { provider } = route.params;

  const [names, setNames] = useState(['']);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadCategories();
  }, [provider.id]);

  async function loadCategories() {
    try {
      setLoading(true);
      const data = await getCategoriesByProvider(provider.id);
      setCategories(data);
    } catch (error) {
      console.log('Error cargando categorías:', error);
    } finally {
      setLoading(false);
    }
  }

  function addInput() {
    setNames(prev => [...prev, '']);
  }

  function updateName(index, value) {
    setNames(prev => prev.map((n, i) => (i === index ? value : n)));
  }

  function removeName(index) {
    setNames(prev => prev.filter((_, i) => i !== index));
  }

  function openCategoryModal() {
    setNewCategoryName('');
    setModalVisible(true);
    scaleAnim.setValue(0.85);
    opacityAnim.setValue(0);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 130,
        friction: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }

  function closeCategoryModal(callback) {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
      if (callback) callback();
    });
  }

  function handleAddCategory() {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      Alert.alert('Falta dato', 'Escribí un nombre para la categoría.');
      return;
    }
    const exists = categories.some(c => c.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      Alert.alert('Ya existe', 'Esa categoría ya está en la lista.');
      return;
    }
    closeCategoryModal(() => {
      const updated = [...categories, trimmed].sort((a, b) => a.localeCompare(b));
      setCategories(updated);
      setSelectedCategory(trimmed);
    });
  }

  async function handleSaveProduct() {
    const validNames = names.map(n => n.trim()).filter(Boolean);
    if (validNames.length === 0) {
      Alert.alert('Falta dato', 'Escribí al menos un nombre de artículo.');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('Falta dato', 'Elegí una categoría.');
      return;
    }

    try {
      setSaving(true);
      await Promise.all(
        validNames.map(name =>
          createProduct({ providerId: provider.id, name, category: selectedCategory })
        )
      );
      const count = validNames.length;
      Alert.alert(
        'Listo',
        `${count} artículo${count > 1 ? 's' : ''} agregado${count > 1 ? 's' : ''} correctamente.`
      );
      navigation.goBack();
    } catch (error) {
      console.log('Error creando productos:', error);
      Alert.alert('Error', 'No se pudo agregar alguno de los artículos.');
    } finally {
      setSaving(false);
    }
  }

  const canSave = !saving && !loading && (categories.length > 0 || selectedCategory);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerArea}>
          <Text style={styles.title}>Agregar artículo</Text>
          <View style={styles.providerChip}>
            <Text style={styles.providerChipText}>{provider.name}</Text>
          </View>
        </View>

        {/* Card de nombres */}
        <View style={styles.card}>
          <View style={styles.cardLabelRow}>
            <Text style={styles.label}>Nombre del artículo</Text>
            <Pressable
              style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
              onPress={addInput}
            >
              <Text style={styles.addButtonText}>+</Text>
            </Pressable>
          </View>

          {names.map((name, index) => (
            <View key={index} style={styles.inputRow}>
              <TextInput
                style={[styles.input, names.length > 1 && styles.inputFlex]}
                placeholder={names.length > 1 ? `Artículo ${index + 1}` : 'Ej: Coca Zero 2.25'}
                placeholderTextColor={COLORS.textMuted}
                value={name}
                onChangeText={val => updateName(index, val)}
              />
              {names.length > 1 && (
                <Pressable
                  style={({ pressed }) => [styles.removeButton, pressed && styles.removeButtonPressed]}
                  onPress={() => removeName(index)}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>

        {/* Card de categorías */}
        <View style={styles.card}>
          <View style={styles.cardLabelRow}>
            <Text style={styles.label}>Elegí una categoría</Text>
            <Pressable
              style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
              onPress={openCategoryModal}
            >
              <Text style={styles.addButtonText}>+</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loaderBox}>
              <ActivityIndicator size="small" color={COLORS.accent} />
              <Text style={styles.loaderText}>Cargando categorías...</Text>
            </View>
          ) : categories.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                Todavía no hay categorías. Tocá + para crear la primera.
              </Text>
            </View>
          ) : (
            categories.map(item => {
              const selected = selectedCategory === item;
              return (
                <Pressable
                  key={item}
                  style={[styles.categoryButton, selected && styles.categoryButtonActive]}
                  onPress={() => setSelectedCategory(item)}
                >
                  {selected && <View style={styles.categoryCheck} />}
                  <Text style={[styles.categoryButtonText, selected && styles.categoryButtonTextActive]}>
                    {item}
                  </Text>
                </Pressable>
              );
            })
          )}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            !canSave && styles.saveButtonDisabled,
            pressed && canSave && styles.saveButtonPressed,
          ]}
          onPress={handleSaveProduct}
          disabled={!canSave}
        >
          <Text style={styles.saveButtonText}>
            {saving
              ? 'Guardando...'
              : names.filter(n => n.trim()).length > 1
              ? `✅  Guardar ${names.filter(n => n.trim()).length} artículos`
              : '✅  Guardar artículo'}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Modal nueva categoría */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => closeCategoryModal()}
      >
        <Pressable style={styles.modalOverlay} onPress={() => closeCategoryModal()}>
          <Animated.View
            style={[
              styles.modalCard,
              {
                opacity: opacityAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* Inner Pressable absorbs taps so they don't close the modal */}
            <Pressable onPress={() => {}}>
              <Text style={styles.modalTitle}>Nueva categoría</Text>
              <Text style={styles.modalSubtitle}>
                Se guardará en Firebase cuando cargues el primer artículo.
              </Text>

              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Ej: Gaseosas"
                  placeholderTextColor={COLORS.textMuted}
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleAddCategory}
                />
              </KeyboardAvoidingView>

              <View style={styles.modalButtons}>
                <Pressable
                  style={({ pressed }) => [
                    styles.modalCancelButton,
                    pressed && styles.modalCancelButtonPressed,
                  ]}
                  onPress={() => closeCategoryModal()}
                >
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.modalConfirmButton,
                    pressed && styles.modalConfirmButtonPressed,
                  ]}
                  onPress={handleAddCategory}
                >
                  <Text style={styles.modalConfirmText}>Agregar</Text>
                </Pressable>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  headerArea: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  providerChip: {
    backgroundColor: COLORS.accentLight,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    flexShrink: 1,
  },
  providerChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accentDark,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.accentDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  addButtonPressed: {
    backgroundColor: COLORS.accentDark,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 26,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.cardAlt,
    color: COLORS.textPrimary,
    fontSize: 15,
    flex: 1,
  },
  inputFlex: {
    flex: 1,
  },
  removeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.cardAlt,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonPressed: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  removeButtonText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  loaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  loaderText: {
    color: COLORS.textSecondary,
  },
  emptyBox: {
    padding: 8,
  },
  emptyText: {
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  categoryButton: {
    backgroundColor: COLORS.cardAlt,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryButtonActive: {
    backgroundColor: COLORS.accentLight,
    borderColor: COLORS.accent,
  },
  categoryCheck: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
  },
  categoryButtonText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  categoryButtonTextActive: {
    color: COLORS.accentDark,
    fontWeight: '700',
  },
  saveButton: {
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
  saveButtonPressed: {
    backgroundColor: COLORS.accentDark,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
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
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
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
  modalConfirmText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
