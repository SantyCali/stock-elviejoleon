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
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getProductsByProvider } from '../services/productService';
import { createStandaloneCategory, deleteCategoryByProvider, deleteProduct, getStandaloneCategories, moveProductToCategory, renameCategory, updateProductName } from '../services/productAdminService';
import { deleteProviderById, updateProviderDetails } from '../services/providerService';
import { hasOrderDoneToday } from '../services/orderService';
import { getCurrentUser, getUserProfile } from '../services/authService';
import { COLORS } from '../theme';

const MAX_FONT_SCALE = 1.2;
const DAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const FREQUENCIES = ['semanal', 'quincenal', 'mensual'];

export default function ProviderScreen({ route, navigation }) {
  const { provider } = route.params;
  const insets = useSafeAreaInsets();
  const [currentProvider, setCurrentProvider] = useState(provider);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [deletingId, setDeletingId] = useState(null);
  const [orderDoneToday, setOrderDoneToday] = useState(false);

  // Edit modal state
  const [editingProduct, setEditingProduct] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Provider name modal state
  const [providerEditVisible, setProviderEditVisible] = useState(false);
  const [providerEditName, setProviderEditName] = useState(provider.name || '');
  const [providerEditAlias, setProviderEditAlias] = useState((provider.alias || []).join(', '));
  const [providerEditDays, setProviderEditDays] = useState(provider.days || []);
  const [providerEditFrequency, setProviderEditFrequency] = useState(provider.frequency || 'semanal');
  const [providerEditSaving, setProviderEditSaving] = useState(false);
  const [providerDeleteSaving, setProviderDeleteSaving] = useState(false);
  const providerAliasInputRef = useRef(null);

  // Standalone categories
  const [standaloneCategories, setStandaloneCategories] = useState([]);

  // Create category modal
  const [createCatVisible, setCreateCatVisible] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [createCatSaving, setCreateCatSaving] = useState(false);

  // Edit category modal
  const [editCatVisible, setEditCatVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatSaving, setEditCatSaving] = useState(false);
  const [deleteCatSaving, setDeleteCatSaving] = useState(false);

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
    }, [currentProvider.id])
  );

  async function loadData() {
    try {
      setLoading(true);
      const currentUser = getCurrentUser();
      const [data, extra, profile, doneToday] = await Promise.all([
        getProductsByProvider(currentProvider.id),
        getStandaloneCategories(currentProvider.id),
        currentUser ? getUserProfile(currentUser.uid) : Promise.resolve(null),
        hasOrderDoneToday(currentProvider.id),
      ]);
      setProducts(data);
      setStandaloneCategories(extra);
      setUserRole(profile?.role || null);
      setOrderDoneToday(doneToday);
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

  function openProviderEditModal() {
    setProviderEditName(currentProvider.name || '');
    setProviderEditAlias((currentProvider.alias || []).join(', '));
    setProviderEditDays(currentProvider.days || []);
    setProviderEditFrequency(currentProvider.frequency || 'semanal');
    openSmallModal(setProviderEditVisible, () => {});
  }

  function toggleProviderEditDay(day) {
    setProviderEditDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleSaveProviderName() {
    const trimmed = providerEditName.trim();
    if (!trimmed) {
      Alert.alert('Falta dato', 'Escribí un nombre para el proveedor.');
      return;
    }
    if (providerEditDays.length === 0) {
      Alert.alert('Falta dato', 'Elegí al menos un día de pedido.');
      return;
    }

    try {
      setProviderEditSaving(true);
      const saved = await updateProviderDetails(currentProvider.id, {
        name: trimmed,
        alias: providerEditAlias,
        days: providerEditDays,
        frequency: providerEditFrequency,
      });
      const nextProvider = { ...currentProvider, ...saved };
      setCurrentProvider(nextProvider);
      navigation.setParams({ provider: nextProvider });
      closeSmallModal(setProviderEditVisible);
    } catch (error) {
      console.log('Error editando proveedor:', error);
      Alert.alert('Error', 'No se pudo guardar el nombre del proveedor.');
    } finally {
      setProviderEditSaving(false);
    }
  }

  function confirmDeleteProvider() {
    Alert.alert(
      'Eliminar proveedor',
      `¿Seguro que querés eliminar "${currentProvider.name}"? También se eliminarán sus categorías, artículos, pedidos e historial asociado.`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, eliminar',
          style: 'destructive',
          onPress: handleDeleteProvider,
        },
      ]
    );
  }

  async function handleDeleteProvider() {
    try {
      setProviderDeleteSaving(true);
      await deleteProviderById(currentProvider.id);
      closeSmallModal(setProviderEditVisible, () => navigation.goBack());
    } catch (error) {
      console.log('Error eliminando proveedor:', error);
      Alert.alert('Error', 'No se pudo eliminar el proveedor.');
    } finally {
      setProviderDeleteSaving(false);
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
      await createStandaloneCategory(currentProvider.id, trimmed);
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
    if (derivedCategories.filter((c) => c !== category).length === 0) {
      Alert.alert('Sin destino', 'Creá otra categoría para poder mover esta categoría completa.');
      return;
    }

    openSmallModal(setMoveCatVisible, () => {
      setMovingCategory(category);
      setMoveCatTarget('');
    });
  }

  function openEditCat(category) {
    openSmallModal(setEditCatVisible, () => {
      setEditingCategory(category);
      setEditCatName(category);
    });
  }

  async function handleSaveEditCat() {
    const trimmed = editCatName.trim();
    if (!trimmed) { Alert.alert('Falta dato', 'Escribí un nombre para la categoría.'); return; }
    if (trimmed === editingCategory) { closeSmallModal(setEditCatVisible); return; }
    if (derivedCategories.some((c) => c !== editingCategory && c.toLowerCase() === trimmed.toLowerCase())) {
      Alert.alert('Ya existe', 'Ya hay una categoría con ese nombre.'); return;
    }

    try {
      setEditCatSaving(true);
      await renameCategory(currentProvider.id, editingCategory, trimmed);
      setProducts((prev) =>
        prev.map((p) => p.category === editingCategory ? { ...p, category: trimmed } : p)
      );
      setStandaloneCategories((prev) =>
        Array.from(new Set(prev.map((c) => c === editingCategory ? trimmed : c)))
          .sort((a, b) => a.localeCompare(b))
      );
      closeSmallModal(setEditCatVisible);
    } catch (error) {
      console.log('Error editando categoría:', error);
      Alert.alert('Error', 'No se pudo guardar el cambio.');
    } finally {
      setEditCatSaving(false);
    }
  }

  function confirmDeleteCategory() {
    if (!editingCategory) return;
    const count = products.filter((p) => p.category === editingCategory).length;
    const detail = count > 0
      ? `También se eliminarán ${count} artículo${count !== 1 ? 's' : ''} de esta categoría.`
      : 'La categoría no tiene artículos.';

    Alert.alert(
      'Eliminar categoría',
      `¿Seguro que querés eliminar "${editingCategory}"? ${detail}`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, eliminar',
          style: 'destructive',
          onPress: handleDeleteCategory,
        },
      ]
    );
  }

  async function handleDeleteCategory() {
    try {
      setDeleteCatSaving(true);
      await deleteCategoryByProvider(currentProvider.id, editingCategory);
      setProducts((prev) => prev.filter((p) => p.category !== editingCategory));
      setStandaloneCategories((prev) => prev.filter((c) => c !== editingCategory));
      closeSmallModal(setEditCatVisible);
    } catch (error) {
      console.log('Error eliminando categoría:', error);
      Alert.alert('Error', 'No se pudo eliminar la categoría.');
    } finally {
      setDeleteCatSaving(false);
    }
  }

  async function handleSaveMoveCat() {
    if (!moveCatTarget) { Alert.alert('Falta dato', 'Elegí una categoría destino.'); return; }
    try {
      setMoveCatSaving(true);
      await renameCategory(currentProvider.id, movingCategory, moveCatTarget);
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
    if (derivedCategories.filter((c) => c !== product.category).length === 0) {
      Alert.alert('Sin destino', 'Creá otra categoría para poder mover este artículo.');
      return;
    }

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

  const categoryRows = useMemo(() => {
    const productsByCategory = new Map(
      groupedProducts.map((group) => [group.category, group.items])
    );

    return derivedCategories.map((category) => ({
      category,
      items: productsByCategory.get(category) || [],
    }));
  }, [derivedCategories, groupedProducts]);

  return (
    <View style={styles.container}>
      {/* Header card */}
      <View style={[styles.headerCard, orderDoneToday && styles.headerCardDone]}>
        <View style={[styles.headerAccentBar, orderDoneToday && styles.headerAccentBarDone]} />
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <Text
              style={[styles.title, orderDoneToday && styles.titleDone]}
              maxFontSizeMultiplier={MAX_FONT_SCALE}
              numberOfLines={2}
            >
              {currentProvider.name}
            </Text>

            {orderDoneToday && (
              <View style={styles.doneBadge}>
                <Text style={styles.doneBadgeText} maxFontSizeMultiplier={MAX_FONT_SCALE}>Pedido hecho</Text>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [styles.providerEditButton, pressed && styles.providerEditButtonPressed]}
              onPress={openProviderEditModal}
              hitSlop={8}
            >
              <Ionicons name="pencil" size={16} color={orderDoneToday ? '#16a34a' : COLORS.accent} />
            </Pressable>
          </View>

          {!!currentProvider.alias?.length && (
            <Text style={[styles.alias, orderDoneToday && styles.aliasDone]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              También conocido como: {currentProvider.alias.join(', ')}
            </Text>
          )}

          <View style={styles.daysRow}>
            <Text style={styles.daysLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>📅</Text>
            {(currentProvider.days || []).map((day) => (
              <View key={day} style={[styles.dayChip, orderDoneToday && styles.dayChipDone]}>
                <Text style={[styles.dayChipText, orderDoneToday && styles.dayChipTextDone]} maxFontSizeMultiplier={MAX_FONT_SCALE}>{day}</Text>
              </View>
            ))}
          </View>

          <View style={styles.topButtonsRow}>
            <Pressable
              style={({ pressed }) => [
                styles.outlineButton,
                orderDoneToday && styles.outlineButtonDone,
                pressed && (orderDoneToday ? styles.outlineButtonDonePressed : styles.outlineButtonPressed),
              ]}
              onPress={() => navigation.navigate('AddProduct', { provider: currentProvider })}
            >
              <Text style={[styles.outlineButtonText, orderDoneToday && styles.outlineButtonTextDone]} maxFontSizeMultiplier={MAX_FONT_SCALE}>+ Agregar artículo</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.outlineButton,
                orderDoneToday && styles.outlineButtonDone,
                pressed && (orderDoneToday ? styles.outlineButtonDonePressed : styles.outlineButtonPressed),
              ]}
              onPress={openCreateCat}
            >
              <Text style={[styles.outlineButtonText, orderDoneToday && styles.outlineButtonTextDone]} maxFontSizeMultiplier={MAX_FONT_SCALE}>+ Categoría</Text>
            </Pressable>

            {userRole === 'jefe' && (
              <Pressable
                style={({ pressed }) => [
                  styles.outlineButton,
                  orderDoneToday && styles.outlineButtonDone,
                  pressed && (orderDoneToday ? styles.outlineButtonDonePressed : styles.outlineButtonPressed),
                ]}
                onPress={() => navigation.navigate('ProviderOrderHistory', { provider: currentProvider })}
              >
                <Text style={[styles.outlineButtonText, orderDoneToday && styles.outlineButtonTextDone]} maxFontSizeMultiplier={MAX_FONT_SCALE}>Últimos 5 pedidos</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* Section label */}
      <Text style={styles.sectionLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>
        {loading
          ? 'Cargando...'
          : `${products.length} producto${products.length !== 1 ? 's' : ''} en ${categoryRows.length} categoría${categoryRows.length !== 1 ? 's' : ''}`}
      </Text>

      {loading ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loaderText} maxFontSizeMultiplier={MAX_FONT_SCALE}>Cargando productos...</Text>
        </View>
      ) : categoryRows.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon} maxFontSizeMultiplier={MAX_FONT_SCALE}>📦</Text>
          <Text style={styles.emptyText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            Todavía no hay productos cargados para este proveedor.
          </Text>
        </View>
      ) : (
        <FlatList
          data={categoryRows}
          keyExtractor={(item) => item.category}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const expanded = expandedCategories.has(item.category);
            return (
              <View style={[styles.categoryCard, orderDoneToday && styles.categoryCardDone]}>
                {/* Header tocable */}
                <Pressable
                  style={({ pressed }) => [
                    styles.categoryHeader,
                    pressed && (orderDoneToday ? styles.categoryHeaderDonePressed : styles.categoryHeaderPressed),
                  ]}
                  onPress={() => toggleCategory(item.category)}
                >
                  <View style={[styles.categoryDot, orderDoneToday && styles.categoryDotDone]} />
                  <Text
                    style={[styles.categoryTitle, orderDoneToday && styles.categoryTitleDone]}
                    maxFontSizeMultiplier={MAX_FONT_SCALE}
                  >
                    {item.category}
                  </Text>
                  <View style={[styles.categoryCount, orderDoneToday && styles.categoryCountDone]}>
                    <Text
                      style={[styles.categoryCountText, orderDoneToday && styles.categoryCountTextDone]}
                      maxFontSizeMultiplier={MAX_FONT_SCALE}
                    >
                      {item.items.length}
                    </Text>
                  </View>
                  <Pressable
                    style={({ pressed }) => [
                      styles.catMoveBtn,
                      pressed && (orderDoneToday ? styles.doneIconButtonPressed : styles.catMoveBtnPressed),
                    ]}
                    onPress={() => openMoveCat(item.category)}
                    hitSlop={6}
                  >
                    <Ionicons name="arrow-redo-outline" size={16} color={orderDoneToday ? '#16a34a' : COLORS.textSecondary} />
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.catEditBtn,
                      pressed && (orderDoneToday ? styles.doneIconButtonPressed : styles.catEditBtnPressed),
                    ]}
                    onPress={() => openEditCat(item.category)}
                    hitSlop={6}
                  >
                    <Ionicons name="pencil" size={15} color={orderDoneToday ? '#16a34a' : COLORS.accent} />
                  </Pressable>
                  <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={orderDoneToday ? '#16a34a' : COLORS.textSecondary}
                    style={styles.chevron}
                  />
                </Pressable>

                {/* Productos (visible solo si expandido) */}
                {expanded && (
                  <View style={styles.productList}>
                    {item.items.map((product) => (
                      <View key={product.id} style={styles.productRow}>
                        <View style={[styles.productBullet, orderDoneToday && styles.productBulletDone]} />
                        <Text
                          style={[styles.productName, orderDoneToday && styles.productNameDone]}
                          maxFontSizeMultiplier={MAX_FONT_SCALE}
                        >
                          {product.name}
                        </Text>

                        <View style={styles.actionButtons}>
                          {/* Editar */}
                          <Pressable
                            style={({ pressed }) => [
                              styles.actionButton,
                              pressed && (orderDoneToday ? styles.doneIconButtonPressed : styles.editButtonPressed),
                            ]}
                            onPress={() => openEditModal(product)}
                            disabled={deletingId === product.id}
                          >
                            <Ionicons name="create-outline" size={17} color={orderDoneToday ? '#16a34a' : COLORS.accent} />
                          </Pressable>

                          {/* Mover a otra categoría */}
                          <Pressable
                            style={({ pressed }) => [
                              styles.actionButton,
                              pressed && (orderDoneToday ? styles.doneIconButtonPressed : styles.moveButtonPressed),
                            ]}
                            onPress={() => openMoveProd(product)}
                            disabled={deletingId === product.id}
                          >
                            <Ionicons name="arrow-redo-outline" size={17} color={orderDoneToday ? '#16a34a' : COLORS.textSecondary} />
                          </Pressable>

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
          style={({ pressed }) => [
            styles.button,
            orderDoneToday && styles.buttonDone,
            pressed && (orderDoneToday ? styles.buttonDonePressed : styles.buttonPressed),
          ]}
          onPress={() => navigation.navigate('Stock', { provider: currentProvider })}
        >
          <Text style={styles.buttonText} maxFontSizeMultiplier={MAX_FONT_SCALE}>📊  Cargar stock</Text>
        </Pressable>

        {userRole === 'jefe' && (
          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              orderDoneToday && styles.secondaryButtonDone,
              pressed && (orderDoneToday ? styles.secondaryButtonDonePressed : styles.secondaryButtonPressed),
            ]}
            onPress={() => navigation.navigate('NewOrder', { provider: currentProvider })}
          >
            <Text
              style={[styles.secondaryButtonText, orderDoneToday && styles.secondaryButtonTextDone]}
              maxFontSizeMultiplier={MAX_FONT_SCALE}
            >
              🛒  Hacer pedido
            </Text>
          </Pressable>
        )}
      </View>

      {/* Modal editar nombre de proveedor */}
      <Modal
        visible={providerEditVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => closeSmallModal(setProviderEditVisible)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => closeSmallModal(setProviderEditVisible)}>
          <Animated.View
            style={[styles.modalCard, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
            <Pressable onPress={Keyboard.dismiss}>
              <View style={styles.modalTitleRow}>
                <View style={styles.modalTitleTextBox}>
                  <Text style={styles.modalTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>Editar proveedor</Text>
              <Text style={styles.modalSubtitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                Cambiá el nombre y el apodo del proveedor en Firebase.
                  </Text>
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.modalTrashButton,
                    pressed && styles.modalTrashButtonPressed,
                  ]}
                  onPress={confirmDeleteProvider}
                  disabled={providerEditSaving || providerDeleteSaving}
                  hitSlop={8}
                >
                  {providerDeleteSaving ? (
                    <ActivityIndicator size={15} color={COLORS.danger} />
                  ) : (
                    <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                  )}
                </Pressable>
              </View>

              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Nombre del proveedor..."
                  placeholderTextColor={COLORS.textMuted}
                  value={providerEditName}
                  onChangeText={setProviderEditName}
                  autoFocus
                  returnKeyType="next"
                  onSubmitEditing={() => providerAliasInputRef.current?.focus()}
                  blurOnSubmit={false}
                  underlineColorAndroid="transparent"
                  maxFontSizeMultiplier={MAX_FONT_SCALE}
                />

                <TextInput
                  ref={providerAliasInputRef}
                  style={styles.modalInput}
                  placeholder="Apodo o tambien conocido como..."
                  placeholderTextColor={COLORS.textMuted}
                  value={providerEditAlias}
                  onChangeText={setProviderEditAlias}
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                  underlineColorAndroid="transparent"
                  maxFontSizeMultiplier={MAX_FONT_SCALE}
                />
              </KeyboardAvoidingView>

              <Text style={styles.modalLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>Días de pedido</Text>
              <View style={styles.pickerWrap}>
                {DAYS.map((day) => {
                  const selected = providerEditDays.includes(day);
                  return (
                    <Pressable
                      key={day}
                      style={[styles.pickerChip, selected && styles.pickerChipActive]}
                      onPress={() => toggleProviderEditDay(day)}
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
                  const selected = providerEditFrequency === frequency;
                  return (
                    <Pressable
                      key={frequency}
                      style={[styles.pickerChip, selected && styles.pickerChipActive]}
                      onPress={() => setProviderEditFrequency(frequency)}
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
                  onPress={() => closeSmallModal(setProviderEditVisible)}
                  disabled={providerEditSaving || providerDeleteSaving}
                >
                  <Text style={styles.modalCancelText} maxFontSizeMultiplier={MAX_FONT_SCALE}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.modalConfirmButton,
                    (providerEditSaving || providerEditDays.length === 0) && styles.modalConfirmButtonDisabled,
                    pressed && !providerEditSaving && providerEditDays.length > 0 && styles.modalConfirmButtonPressed,
                  ]}
                  onPress={handleSaveProviderName}
                  disabled={providerEditSaving || providerDeleteSaving}
                >
                  <Text style={styles.modalConfirmText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                    {providerEditSaving ? 'Guardando...' : 'Guardar'}
                  </Text>
                </Pressable>
              </View>
            </Pressable>
            </ScrollView>
          </Animated.View>
        </Pressable>
      </Modal>

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
            <Pressable onPress={Keyboard.dismiss}>
              <Text style={styles.modalTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>Nueva categoría</Text>
              <Text style={styles.modalSubtitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>
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
                  maxFontSizeMultiplier={MAX_FONT_SCALE}
                />
              </KeyboardAvoidingView>
              <View style={styles.modalButtons}>
                <Pressable
                  style={({ pressed }) => [styles.modalCancelButton, pressed && styles.modalCancelButtonPressed]}
                  onPress={() => closeSmallModal(setCreateCatVisible)}
                  disabled={createCatSaving}
                >
                  <Text style={styles.modalCancelText} maxFontSizeMultiplier={MAX_FONT_SCALE}>Cancelar</Text>
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
                  <Text style={styles.modalConfirmText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                    {createCatSaving ? 'Guardando...' : 'Crear'}
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Modal editar categoría */}
      <Modal
        visible={editCatVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => closeSmallModal(setEditCatVisible)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => closeSmallModal(setEditCatVisible)}>
          <Animated.View
            style={[styles.modalCard, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}
          >
            <Pressable onPress={Keyboard.dismiss}>
              <View style={styles.modalTitleRow}>
                <View style={styles.modalTitleTextBox}>
                  <Text style={styles.modalTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>Editar categoría</Text>
                  <Text style={styles.modalSubtitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                    Cambiá el nombre o eliminá la categoría.
                  </Text>
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.modalTrashButton,
                    pressed && styles.modalTrashButtonPressed,
                  ]}
                  onPress={confirmDeleteCategory}
                  disabled={editCatSaving || deleteCatSaving}
                  hitSlop={8}
                >
                  {deleteCatSaving ? (
                    <ActivityIndicator size={15} color={COLORS.danger} />
                  ) : (
                    <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                  )}
                </Pressable>
              </View>

              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Nombre de la categoría..."
                  placeholderTextColor={COLORS.textMuted}
                  value={editCatName}
                  onChangeText={setEditCatName}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleSaveEditCat}
                  underlineColorAndroid="transparent"
                  maxFontSizeMultiplier={MAX_FONT_SCALE}
                />
              </KeyboardAvoidingView>

              <View style={styles.modalButtons}>
                <Pressable
                  style={({ pressed }) => [styles.modalCancelButton, pressed && styles.modalCancelButtonPressed]}
                  onPress={() => closeSmallModal(setEditCatVisible)}
                  disabled={editCatSaving || deleteCatSaving}
                >
                  <Text style={styles.modalCancelText} maxFontSizeMultiplier={MAX_FONT_SCALE}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.modalConfirmButton,
                    editCatSaving && styles.modalConfirmButtonDisabled,
                    pressed && !editCatSaving && styles.modalConfirmButtonPressed,
                  ]}
                  onPress={handleSaveEditCat}
                  disabled={editCatSaving || deleteCatSaving}
                >
                  <Text style={styles.modalConfirmText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                    {editCatSaving ? 'Guardando...' : 'Guardar'}
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
            <Pressable onPress={Keyboard.dismiss}>
              <Text style={styles.modalTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>Mover categoría</Text>
              {movingCategory && (
                <Text style={styles.modalSubtitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>
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
                      <Text style={[styles.catPickerText, selected && styles.catPickerTextActive]} maxFontSizeMultiplier={MAX_FONT_SCALE}>{cat}</Text>
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
                  <Text style={styles.modalCancelText} maxFontSizeMultiplier={MAX_FONT_SCALE}>Cancelar</Text>
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
                  <Text style={styles.modalConfirmText} maxFontSizeMultiplier={MAX_FONT_SCALE}>{moveCatSaving ? 'Moviendo...' : 'Mover'}</Text>
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
            <Pressable onPress={Keyboard.dismiss}>
              <Text style={styles.modalTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>Mover artículo</Text>
              {movingProduct && (
                <Text style={styles.modalSubtitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>
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
                      <Text style={[styles.catPickerText, selected && styles.catPickerTextActive]} maxFontSizeMultiplier={MAX_FONT_SCALE}>{cat}</Text>
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
                  <Text style={styles.modalCancelText} maxFontSizeMultiplier={MAX_FONT_SCALE}>Cancelar</Text>
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
                  <Text style={styles.modalConfirmText} maxFontSizeMultiplier={MAX_FONT_SCALE}>{moveProdSaving ? 'Moviendo...' : 'Mover'}</Text>
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
            <Pressable onPress={Keyboard.dismiss}>
              <Text style={styles.modalTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>Editar artículo</Text>
              {editingProduct && (
                <Text style={styles.modalSubtitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>
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
                  maxFontSizeMultiplier={MAX_FONT_SCALE}
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
                  <Text style={styles.modalCancelText} maxFontSizeMultiplier={MAX_FONT_SCALE}>Cancelar</Text>
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
                  <Text style={styles.modalConfirmText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
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
  headerCardDone: {
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
    backgroundColor: '#F0FDF4',
  },
  headerAccentBar: {
    height: 5,
    backgroundColor: COLORS.accent,
  },
  headerAccentBarDone: {
    backgroundColor: '#16a34a',
  },
  headerContent: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 1,
  },
  titleDone: {
    color: '#111827',
  },
  doneBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginTop: 1,
  },
  doneBadgeText: {
    color: '#166534',
    fontSize: 11,
    fontWeight: '800',
  },
  providerEditButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2,
  },
  providerEditButtonPressed: {
    backgroundColor: COLORS.borderLight,
  },
  alias: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 10,
  },
  aliasDone: {
    color: '#166534',
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
  dayChipDone: {
    backgroundColor: '#DCFCE7',
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accentDark,
    textTransform: 'capitalize',
  },
  dayChipTextDone: {
    color: '#166534',
  },
  topButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 2,
  },
  outlineButton: {
    flex: 1,
    minWidth: 118,
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
  outlineButtonDone: {
    borderColor: '#16a34a',
    backgroundColor: '#F0FDF4',
  },
  outlineButtonDonePressed: {
    backgroundColor: '#DCFCE7',
  },
  outlineButtonText: {
    color: COLORS.accent,
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 17,
  },
  outlineButtonTextDone: {
    color: '#166534',
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
  categoryCardDone: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
  },
  categoryHeaderPressed: {
    backgroundColor: COLORS.cardAlt,
  },
  categoryHeaderDonePressed: {
    backgroundColor: '#DCFCE7',
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    marginRight: 8,
  },
  categoryDotDone: {
    backgroundColor: '#16a34a',
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textTransform: 'capitalize',
    flex: 1,
    flexShrink: 1,
    lineHeight: 20,
  },
  categoryTitleDone: {
    color: '#14532d',
  },
  categoryCount: {
    backgroundColor: COLORS.accentLight,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 6,
  },
  categoryCountDone: {
    backgroundColor: '#BBF7D0',
  },
  categoryCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accentDark,
  },
  categoryCountTextDone: {
    color: '#166534',
  },
  chevron: {
    marginLeft: 2,
    marginTop: 7,
  },
  productList: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    marginTop: 8,
    opacity: 0.6,
  },
  productBulletDone: {
    backgroundColor: '#16a34a',
    opacity: 1,
  },
  productName: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  productNameDone: {
    color: '#166534',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 2,
    marginLeft: 8,
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
  doneIconButtonPressed: {
    backgroundColor: '#DCFCE7',
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
    marginTop: -5,
  },
  catMoveBtnPressed: {
    backgroundColor: COLORS.borderLight,
  },
  catEditBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
    marginTop: -5,
  },
  catEditBtnPressed: {
    backgroundColor: COLORS.accentLight,
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
  buttonDone: {
    backgroundColor: '#16a34a',
    shadowColor: '#166534',
  },
  buttonDonePressed: {
    backgroundColor: '#15803d',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 20,
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
  secondaryButtonDone: {
    backgroundColor: '#F0FDF4',
    borderColor: '#16a34a',
  },
  secondaryButtonDonePressed: {
    backgroundColor: '#DCFCE7',
  },
  secondaryButtonText: {
    color: COLORS.accent,
    fontWeight: '700',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 20,
  },
  secondaryButtonTextDone: {
    color: '#166534',
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
    maxHeight: '90%',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  modalScrollContent: {
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
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  modalTitleTextBox: {
    flex: 1,
  },
  modalTrashButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTrashButtonPressed: {
    backgroundColor: '#FECACA',
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
