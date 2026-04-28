import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
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
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getProductsByProvider } from '../services/productService';
import { createStandaloneCategory, deleteProduct, getStandaloneCategories, moveProductToCategory, renameCategory, updateProductName } from '../services/productAdminService';
import { getCurrentUser, getUserProfile } from '../services/authService';
import { COLORS } from '../theme';

export default function ProviderScreen({ route, navigation }) {
  const { provider } = route.params;
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [deletingId, setDeletingId] = useState(null);

  // Edit modal state
  const [editingProduct, setEditingProduct] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Standalone categories
  const [standaloneCategories, setStandaloneCategories] = useState([]);

  // Create category modal
  const [createCatVisible, setCreateCatVisible] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [createCatSaving, setCreateCatSaving] = useState(false);

  // Move category modal
  const [moveCatVisible, setMoveCatVisible] = useState(false);
  const [movingCategory, setMovingCategory] = useState(null);
  const [moveCatTarget, setMoveCatTarget] = useState('');
  const [moveCatSaving, setMoveCatSaving] = useState(false);

  // Move product modal
  const [moveProdVisible, setMoveProdVisible] = useState(false);
  const [movingProduct, setMovingProduct] = useState(null);
  const [moveProdTarget, setMoveProdTarget] = useState('');
  const [moveProdSaving, setMoveProdSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [provider.id])
  );

  async function loadData() {
    try {
      setLoading(true);
      const currentUser = getCurrentUser();
      const [data, extra, profile] = await Promise.all([
        getProductsByProvider(provider.id),
        getStandaloneCategories(provider.id),
        currentUser ? getUserProfile(currentUser.uid) : Promise.resolve(null),
      ]);
      setProducts(data);
      setStandaloneCategories(extra);
      setUserRole(profile?.role || null);
    } catch (error) {
      console.log('Error cargando proveedor:', error);
    } finally {
      setLoading(false);
    }
  }

  function toggleCategory(category) {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }

  function confirmDeleteProduct(product) {
    Alert.alert(
      'Eliminar artículo',
      `¿Seguro que querés eliminar "${product.name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => handleDeleteProduct(product),
        },
      ]
    );
  }

  async function handleDeleteProduct(product) {
    try {
      setDeletingId(product.id);
      await deleteProduct(product.id);
      setProducts(prev => prev.filter(p => p.id !== product.id));
    } catch (error) {
      console.log('Error eliminando producto:', error);
      Alert.alert('Error', 'No se pudo eliminar el artículo.');
    } finally {
      setDeletingId(null);
    }
  }

  function openEditModal(product) {
    setEditingProduct(product);
    setEditName(product.name);
    setEditModalVisible(true);
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

  function closeEditModal(callback) {
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
      setEditModalVisible(false);
      setEditingProduct(null);
      if (callback) callback();
    });
  }

  async function handleSaveEdit() {
    const trimmed = editName.trim();
    if (!trimmed) {
      Alert.alert('Falta dato', 'Escribí un nombre para el artículo.');
      return;
    }
    if (trimmed === editingProduct.name) {
      closeEditModal();
      return;
    }
    try {
      setEditSaving(true);
      await updateProductName(editingProduct.id, trimmed);
      setProducts(prev =>
        prev.map(p => p.id === editingProduct.id ? { ...p, name: trimmed } : p)
      );
      closeEditModal();
    } catch (error) {
      console.log('Error editando producto:', error);
      Alert.alert('Error', 'No se pudo guardar el cambio.');
    } finally {
      setEditSaving(false);
    }
  }

  function openSmallModal(setVisible, setup) {
    scaleAnim.setValue(0.85);
    opacityAnim.setValue(0);
    setup();
    setVisible(true);
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 130, friction: 8 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  }

  function closeSmallModal(setVisible, callback) {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0.85, duration: 140, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 140, useNativeDriver: true }),
    ]).start(() => { setVisible(false); if (callback) callback(); });
  }

  function openCreateCat() {
    setNewCatName('');
    openSmallModal(setCreateCatVisible, () => {});
  }

  async function handleSaveCreateCat() {
    const trimmed = newCatName.trim();
    if (!trimmed) { Alert.alert('Falta dato', 'Escribí un nombre para la categoría.'); return; }
    if (derivedCategories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      Alert.alert('Ya existe', 'Ya hay una categoría con ese nombre.'); return;
    }
    try {
      setCreateCatSaving(true);
      await createStandaloneCategory(provider.id, trimmed);
      setStandaloneCategories((prev) =>
        Array.from(new Set([...prev, trimmed])).sort((a, b) => a.localeCompare(b))
      );
      closeSmallModal(setCreateCatVisible);
    } catch (error) {
      console.log('Error creando categoría:', error);
      Alert.alert('Error', 'No se pudo crear la categoría.');
    } finally {
      setCreateCatSaving(false);
    }
  }

  function openMoveCat(category) {
    openSmallModal(setMoveCatVisible, () => {
      setMovingCategory(category);
      setMoveCatTarget('');
    });
  }

  async function handleSaveMoveCat() {
    if (!moveCatTarget) { Alert.alert('Falta dato', 'Elegí una categoría destino.'); return; }
    try {
      setMoveCatSaving(true);
      await renameCategory(provider.id, movingCategory, moveCatTarget);
      setProducts((prev) =>
        prev.map((p) => p.category === movingCategory ? { ...p, category: moveCatTarget } : p)
      );
      closeSmallModal(setMoveCatVisible);
    } catch (error) {
      console.log('Error moviendo categoría:', error);
      Alert.alert('Error', 'No se pudo mover la categoría.');
    } finally {
      setMoveCatSaving(false);
    }
  }

  function openMoveProd(product) {
    openSmallModal(setMoveProdVisible, () => {
      setMovingProduct(product);
      setMoveProdTarget('');
    });
  }

  async function handleSaveMoveProd() {
    if (!moveProdTarget) { Alert.alert('Falta dato', 'Elegí una categoría destino.'); return; }
    try {
      setMoveProdSaving(true);
      await moveProductToCategory(movingProduct.id, moveProdTarget);
      setProducts((prev) =>
        prev.map((p) => p.id === movingProduct.id ? { ...p, category: moveProdTarget } : p)
      );
      closeSmallModal(setMoveProdVisible);
    } catch (error) {
      console.log('Error moviendo artículo:', error);
      Alert.alert('Error', 'No se pudo mover el artículo.');
    } finally {
      setMoveProdSaving(false);
    }
  }

  const groupedProducts = useMemo(() => {
    const groups = {};
    products.forEach((product) => {
      const category = product.category?.trim() || 'Sin categoría';
      if (!groups[category]) groups[category] = [];
      groups[category].push(product);
    });
    return Object.keys(groups)
      .sort((a, b) => a.localeCompare(b))
      .map((category) => ({
        category,
        items: groups[category].sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [products]);

  const derivedCategories = useMemo(() => {
    const set = new Set(standaloneCategories);
    groupedProducts.forEach((g) => set.add(g.category));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [groupedProducts, standaloneCategories]);

  return (
    <View style={styles.container}>
      {/* Header card */}
      <View style={styles.headerCard}>
        <View style={styles.headerAccentBar} />
        <View style={styles.headerContent}>
          <Text style={styles.title}>{provider.name}</Text>

          {!!provider.alias?.length && (
            <Text style={styles.alias}>
              También conocido como: {provider.alias.join(', ')}
            </Text>
          )}

          <View style={styles.daysRow}>
            <Text style={styles.daysLabel}>📅</Text>
            {(provider.days || []).map((day) => (
              <View key={day} style={styles.dayChip}>
                <Text style={styles.dayChipText}>{day}</Text>
              </View>
            ))}
          </View>

          <View style={styles.topButtonsRow}>
            <Pressable
              style={({ pressed }) => [styles.outlineButton, pressed && styles.outlineButtonPressed]}
              onPress={() => navigation.navigate('AddProduct', { provider })}
            >
              <Text style={styles.outlineButtonText}>+ Agregar artículo</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.outlineButton, pressed && styles.outlineButtonPressed]}
              onPress={openCreateCat}
            >
              <Text style={styles.outlineButtonText}>+ Categoría</Text>
            </Pressable>

            {userRole === 'jefe' && (
              <Pressable
                style={({ pressed }) => [styles.outlineButton, pressed && styles.outlineButtonPressed]}
                onPress={() => navigation.navigate('ProviderOrderHistory', { provider })}
              >
                <Text style={styles.outlineButtonText}>Últimos 5 pedidos</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* Section label */}
      <Text style={styles.sectionLabel}>
        {loading
          ? 'Cargando...'
          : `${products.length} producto${products.length !== 1 ? 's' : ''} en ${groupedProducts.length} categoría${groupedProducts.length !== 1 ? 's' : ''}`}
      </Text>

      {loading ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loaderText}>Cargando productos...</Text>
        </View>
      ) : groupedProducts.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyText}>
            Todavía no hay productos cargados para este proveedor.
          </Text>
        </View>
      ) : (
        <FlatList
          data={groupedProducts}
          keyExtractor={(item) => item.category}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const expanded = expandedCategories.has(item.category);
            return (
              <View style={styles.categoryCard}>
                {/* Header tocable */}
                <Pressable
                  style={({ pressed }) => [
                    styles.categoryHeader,
                    pressed && styles.categoryHeaderPressed,
                  ]}
                  onPress={() => toggleCategory(item.category)}
                >
                  <View style={styles.categoryDot} />
                  <Text style={styles.categoryTitle}>{item.category}</Text>
                  <View style={styles.categoryCount}>
                    <Text style={styles.categoryCountText}>{item.items.length}</Text>
                  </View>
                  {derivedCategories.length > 1 && (
                    <Pressable
                      style={({ pressed }) => [styles.catMoveBtn, pressed && styles.catMoveBtnPressed]}
                      onPress={() => openMoveCat(item.category)}
                      hitSlop={6}
                    >
                      <Ionicons name="arrow-redo-outline" size={16} color={COLORS.textSecondary} />
                    </Pressable>
                  )}
                  <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={COLORS.textSecondary}
                    style={styles.chevron}
                  />
                </Pressable>

                {/* Productos (visible solo si expandido) */}
                {expanded && (
                  <View style={styles.productList}>
                    {item.items.map((product) => (
                      <View key={product.id} style={styles.productRow}>
                        <View style={styles.productBullet} />
                        <Text style={styles.productName}>{product.name}</Text>

                        <View style={styles.actionButtons}>
                          {/* Editar */}
                          <Pressable
                            style={({ pressed }) => [
                              styles.actionButton,
                              pressed && styles.editButtonPressed,
                            ]}
                            onPress={() => openEditModal(product)}
                            disabled={deletingId === product.id}
                          >
                            <Ionicons name="create-outline" size={17} color={COLORS.accent} />
                          </Pressable>

                          {/* Mover a otra categoría */}
                          {derivedCategories.length > 1 && (
                            <Pressable
                              style={({ pressed }) => [
                                styles.actionButton,
                                pressed && styles.moveButtonPressed,
                              ]}
                              onPress={() => openMoveProd(product)}
                              disabled={deletingId === product.id}
                            >
                              <Ionicons name="arrow-redo-outline" size={17} color={COLORS.textSecondary} />
                            </Pressable>
                          )}

                          {/* Eliminar */}
                          <Pressable
                            style={({ pressed }) => [
                              styles.actionButton,
                              pressed && styles.deleteButtonPressed,
                            ]}
                            onPress={() => confirmDeleteProduct(product)}
                            disabled={deletingId === product.id}
                          >
                            {deletingId === product.id ? (
                              <ActivityIndicator size={14} color={COLORS.danger} />
                            ) : (
                              <Ionicons name="trash-outline" size={17} color={COLORS.danger} />
                            )}
                          </Pressable>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          }}
        />
      )}

      {/* Bottom actions */}
      <View style={[styles.buttonsContainer, { paddingBottom: insets.bottom }]}>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => navigation.navigate('Stock', { provider })}
        >
          <Text style={styles.buttonText}>📊  Cargar stock</Text>
        </Pressable>

        {userRole === 'jefe' && (
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
            onPress={() => navigation.navigate('NewOrder', { provider })}
          >
            <Text style={styles.secondaryButtonText}>🛒  Hacer pedido</Text>
          </Pressable>
        )}
      </View>

      {/* Modal crear categoría */}
      <Modal
        visible={createCatVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => closeSmallModal(setCreateCatVisible)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => closeSmallModal(setCreateCatVisible)}>
          <Animated.View
            style={[styles.modalCard, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}
          >
            <Pressable onPress={() => {}}>
              <Text style={styles.modalTitle}>Nueva categoría</Text>
              <Text style={styles.modalSubtitle}>
                La categoría se va a crear aunque no tenga artículos todavía.
              </Text>
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Ej: Gaseosas"
                  placeholderTextColor={COLORS.textMuted}
                  value={newCatName}
                  onChangeText={setNewCatName}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleSaveCreateCat}
                  underlineColorAndroid="transparent"
                />
              </KeyboardAvoidingView>
              <View style={styles.modalButtons}>
                <Pressable
                  style={({ pressed }) => [styles.modalCancelButton, pressed && styles.modalCancelButtonPressed]}
                  onPress={() => closeSmallModal(setCreateCatVisible)}
                  disabled={createCatSaving}
                >
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.modalConfirmButton,
                    createCatSaving && styles.modalConfirmButtonDisabled,
                    pressed && !createCatSaving && styles.modalConfirmButtonPressed,
                  ]}
                  onPress={handleSaveCreateCat}
                  disabled={createCatSaving}
                >
                  <Text style={styles.modalConfirmText}>
                    {createCatSaving ? 'Guardando...' : 'Crear'}
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Modal mover categoría */}
      <Modal
        visible={moveCatVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => closeSmallModal(setMoveCatVisible)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => closeSmallModal(setMoveCatVisible)}>
          <Animated.View
            style={[styles.modalCard, styles.moveModalCard, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}
          >
            <Pressable onPress={() => {}}>
              <Text style={styles.modalTitle}>Mover categoría</Text>
              {movingCategory && (
                <Text style={styles.modalSubtitle}>
                  Todos los artículos de "{movingCategory}" se van a mover a la categoría que elijas.
                </Text>
              )}
              <ScrollView style={styles.moveCatList} showsVerticalScrollIndicator={false}>
                {derivedCategories.filter((c) => c !== movingCategory).map((cat) => {
                  const selected = moveCatTarget === cat;
                  return (
                    <Pressable
                      key={cat}
                      style={[styles.catPickerBtn, selected && styles.catPickerBtnActive]}
                      onPress={() => setMoveCatTarget(cat)}
                    >
                      {selected && <View style={styles.catPickerCheck} />}
                      <Text style={[styles.catPickerText, selected && styles.catPickerTextActive]}>{cat}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <View style={styles.modalButtons}>
                <Pressable
                  style={({ pressed }) => [styles.modalCancelButton, pressed && styles.modalCancelButtonPressed]}
                  onPress={() => closeSmallModal(setMoveCatVisible)}
                  disabled={moveCatSaving}
                >
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.modalConfirmButton,
                    moveCatSaving && styles.modalConfirmButtonDisabled,
                    pressed && !moveCatSaving && styles.modalConfirmButtonPressed,
                  ]}
                  onPress={handleSaveMoveCat}
                  disabled={moveCatSaving}
                >
                  <Text style={styles.modalConfirmText}>{moveCatSaving ? 'Moviendo...' : 'Mover'}</Text>
                </Pressable>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Modal mover artículo a otra categoría */}
      <Modal
        visible={moveProdVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => closeSmallModal(setMoveProdVisible)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => closeSmallModal(setMoveProdVisible)}>
          <Animated.View
            style={[styles.modalCard, styles.moveModalCard, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}
          >
            <Pressable onPress={() => {}}>
              <Text style={styles.modalTitle}>Mover artículo</Text>
              {movingProduct && (
                <Text style={styles.modalSubtitle}>
                  "{movingProduct.name}" → elegí la categoría destino
                </Text>
              )}
              <ScrollView style={styles.moveCatList} showsVerticalScrollIndicator={false}>
                {derivedCategories.filter((c) => c !== movingProduct?.category).map((cat) => {
                  const selected = moveProdTarget === cat;
                  return (
                    <Pressable
                      key={cat}
                      style={[styles.catPickerBtn, selected && styles.catPickerBtnActive]}
                      onPress={() => setMoveProdTarget(cat)}
                    >
                      {selected && <View style={styles.catPickerCheck} />}
                      <Text style={[styles.catPickerText, selected && styles.catPickerTextActive]}>{cat}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <View style={styles.modalButtons}>
                <Pressable
                  style={({ pressed }) => [styles.modalCancelButton, pressed && styles.modalCancelButtonPressed]}
                  onPress={() => closeSmallModal(setMoveProdVisible)}
                  disabled={moveProdSaving}
                >
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.modalConfirmButton,
                    moveProdSaving && styles.modalConfirmButtonDisabled,
                    pressed && !moveProdSaving && styles.modalConfirmButtonPressed,
                  ]}
                  onPress={handleSaveMoveProd}
                  disabled={moveProdSaving}
                >
                  <Text style={styles.modalConfirmText}>{moveProdSaving ? 'Moviendo...' : 'Mover'}</Text>
                </Pressable>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Modal editar nombre de artículo */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => closeEditModal()}
      >
        <Pressable style={styles.modalOverlay} onPress={() => closeEditModal()}>
          <Animated.View
            style={[
              styles.modalCard,
              {
                opacity: opacityAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Pressable onPress={() => {}}>
              <Text style={styles.modalTitle}>Editar artículo</Text>
              {editingProduct && (
                <Text style={styles.modalSubtitle}>
                  Nombre actual: {editingProduct.name}
                </Text>
              )}

              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Nuevo nombre..."
                  placeholderTextColor={COLORS.textMuted}
                  value={editName}
                  onChangeText={setEditName}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleSaveEdit}
                  underlineColorAndroid="transparent"
                />
              </KeyboardAvoidingView>

              <View style={styles.modalButtons}>
                <Pressable
                  style={({ pressed }) => [
                    styles.modalCancelButton,
                    pressed && styles.modalCancelButtonPressed,
                  ]}
                  onPress={() => closeEditModal()}
                  disabled={editSaving}
                >
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.modalConfirmButton,
                    editSaving && styles.modalConfirmButtonDisabled,
                    pressed && !editSaving && styles.modalConfirmButtonPressed,
                  ]}
                  onPress={handleSaveEdit}
                  disabled={editSaving}
                >
                  <Text style={styles.modalConfirmText}>
                    {editSaving ? 'Guardando...' : 'Guardar'}
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.bg,
  },
  headerCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  headerAccentBar: {
    height: 5,
    backgroundColor: COLORS.accent,
  },
  headerContent: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  alias: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 10,
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  daysLabel: {
    fontSize: 15,
    marginRight: 2,
  },
  dayChip: {
    backgroundColor: COLORS.accentLight,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accentDark,
    textTransform: 'capitalize',
  },
  topButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  outlineButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  outlineButtonPressed: {
    backgroundColor: COLORS.accentLight,
  },
  outlineButtonText: {
    color: COLORS.accent,
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  loaderBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    color: COLORS.textSecondary,
  },
  emptyBox: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  emptyText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    paddingBottom: 8,
  },
  categoryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  categoryHeaderPressed: {
    backgroundColor: COLORS.cardAlt,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    marginRight: 8,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textTransform: 'capitalize',
    flex: 1,
  },
  categoryCount: {
    backgroundColor: COLORS.accentLight,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 6,
  },
  categoryCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accentDark,
  },
  chevron: {
    marginLeft: 2,
  },
  productList: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  productBullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
    marginRight: 10,
    opacity: 0.6,
  },
  productName: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 2,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonPressed: {
    backgroundColor: COLORS.accentLight,
  },
  moveButtonPressed: {
    backgroundColor: COLORS.borderLight,
  },
  deleteButtonPressed: {
    backgroundColor: '#FEE2E2',
  },
  catMoveBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  catMoveBtnPressed: {
    backgroundColor: COLORS.borderLight,
  },
  moveModalCard: {
    maxHeight: '75%',
  },
  moveCatList: {
    maxHeight: 220,
    marginBottom: 14,
  },
  catPickerBtn: {
    backgroundColor: COLORS.cardAlt,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginBottom: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  catPickerBtnActive: {
    backgroundColor: COLORS.accentLight,
    borderColor: COLORS.accent,
  },
  catPickerCheck: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
  },
  catPickerText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  catPickerTextActive: {
    color: COLORS.accentDark,
    fontWeight: '700',
  },
  buttonsContainer: {
    marginTop: 10,
    gap: 10,
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
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonPressed: {
    backgroundColor: COLORS.accentLight,
  },
  secondaryButtonText: {
    color: COLORS.accent,
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
  modalConfirmButtonDisabled: {
    opacity: 0.6,
  },
  modalConfirmText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
