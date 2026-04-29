import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { subscribeProductsByProvider } from '../services/productService';
import {
  createProduct,
  createStandaloneCategory,
  deleteProduct,
  moveProductToCategory,
  renameCategory,
  subscribeStandaloneCategories,
  updateProductName,
} from '../services/productAdminService';
import { createStockSnapshot } from '../services/stockService';
import { getCurrentUser, getUserProfile } from '../services/authService';
import { notifyStockLoaded } from '../services/activityNotificationService';
import { COLORS } from '../theme';

// Persiste los valores HAY durante la sesión de la app, sobrevive a la navegación.
// Solo se limpia con el botón "Borrar pedido" o al guardar exitosamente.
const hayCache = {}; // { providerId: { productId: value } }

function getCached(providerId, productId) {
  return hayCache[providerId]?.[productId] ?? '';
}
function setCached(providerId, productId, value) {
  if (!hayCache[providerId]) hayCache[providerId] = {};
  hayCache[providerId][productId] = value;
}
function removeCached(providerId, productId) {
  if (hayCache[providerId]) delete hayCache[providerId][productId];
}
function clearCache(providerId) {
  delete hayCache[providerId];
}

export default function StockScreen({ route, navigation }) {
  const { provider } = route.params;
  const insets = useSafeAreaInsets();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [standaloneCategories, setStandaloneCategories] = useState([]);

  // Add-product modal
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newNames, setNewNames] = useState(['']);
  const [modalCategories, setModalCategories] = useState([]);
  const [modalSelectedCategory, setModalSelectedCategory] = useState('');
  const [addProductSaving, setAddProductSaving] = useState(false);
  const [showCatInput, setShowCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Edit category modal
  const [editCatVisible, setEditCatVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatSaving, setEditCatSaving] = useState(false);

  // Edit product modal
  const [editProdVisible, setEditProdVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdSaving, setEditProdSaving] = useState(false);

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

  // Animation for the big add-product modal
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Animation for small edit modals (shared — only one open at a time)
  const smallScale = useRef(new Animated.Value(0.85)).current;
  const smallOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setLoading(true);
    let productsReady = false;
    let categoriesReady = false;
    let cancelled = false;

    function finishInitialLoad() {
      if (!cancelled && productsReady && categoriesReady) {
        setLoading(false);
      }
    }

    const unsubscribeProducts = subscribeProductsByProvider(
      provider.id,
      (data) => {
        productsReady = true;
        setProducts(data.map((item) => ({ ...item, hay: getCached(provider.id, item.id) })));
        finishInitialLoad();
      },
      () => {
        productsReady = true;
        finishInitialLoad();
      }
    );

    const unsubscribeCategories = subscribeStandaloneCategories(
      provider.id,
      (data) => {
        categoriesReady = true;
        setStandaloneCategories(data);
        finishInitialLoad();
      },
      () => {
        categoriesReady = true;
        finishInitialLoad();
      }
    );

    return () => {
      cancelled = true;
      unsubscribeProducts();
      unsubscribeCategories();
    };
  }, [provider.id]);

  function updateHay(productId, value) {
    setCached(provider.id, productId, value);
    setProducts((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, hay: value } : item
      )
    );
  }

  async function handleSaveStock() {
    try {
      setSaving(true);
      const currentUser = getCurrentUser();
      const profile = currentUser ? await getUserProfile(currentUser.uid) : null;

      const itemsToSave = products
        .filter((item) => item.hay.trim() !== '')
        .map((item) => ({
          productId: item.id,
          productName: item.name,
          category: item.category || '',
          hay: item.hay.trim(),
        }));

      if (itemsToSave.length === 0) {
        Alert.alert('Ojo', 'Cargá al menos un stock antes de guardar.');
        return;
      }

      await createStockSnapshot({
        providerId: provider.id,
        providerName: provider.name,
        createdByUid: currentUser?.uid || null,
        createdByName: profile?.name || null,
        createdByUsername: profile?.username || null,
        items: itemsToSave,
      });

      notifyStockLoaded({
        profile,
        providerName: provider.name,
      });

      clearCache(provider.id);
      Alert.alert('Listo', 'El stock se guardó correctamente.');
      navigation.goBack();
    } catch (error) {
      console.log('Error guardando stock:', error);
      Alert.alert('Error', 'No se pudo guardar el stock.');
    } finally {
      setSaving(false);
    }
  }

  function handleClearStock() {
    Alert.alert(
      'Borrar todo lo cargado',
      '¿Seguro? Se van a borrar todos los valores que pusiste en HAY.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar todo',
          style: 'destructive',
          onPress: () => {
            clearCache(provider.id);
            setProducts((prev) => prev.map((p) => ({ ...p, hay: '' })));
          },
        },
      ]
    );
  }

  // ─── Add-product modal ────────────────────────────────────────────────────

  const derivedCategories = useMemo(() => {
    const set = new Set(standaloneCategories);
    products.forEach((p) => {
      if (p.category?.trim()) set.add(p.category.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products, standaloneCategories]);

  function openAddModal() {
    setNewNames(['']);
    setModalCategories(derivedCategories);
    setModalSelectedCategory('');
    setShowCatInput(false);
    setNewCatName('');
    setAddModalVisible(true);
    scaleAnim.setValue(0.85);
    opacityAnim.setValue(0);
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 130, friction: 8 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  }

  function closeAddModal() {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0.85, duration: 140, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 140, useNativeDriver: true }),
    ]).start(() => setAddModalVisible(false));
  }

  function handleAddNewCategory() {
    const trimmed = newCatName.trim();
    if (!trimmed) { Alert.alert('Falta dato', 'Escribí un nombre para la categoría.'); return; }
    const exists = modalCategories.some((c) => c.toLowerCase() === trimmed.toLowerCase());
    if (exists) { Alert.alert('Ya existe', 'Esa categoría ya está en la lista.'); return; }
    const updated = [...modalCategories, trimmed].sort((a, b) => a.localeCompare(b));
    setModalCategories(updated);
    setModalSelectedCategory(trimmed);
    setShowCatInput(false);
    setNewCatName('');
  }

  async function handleSaveNewProduct() {
    const validNames = newNames.map((n) => n.trim()).filter(Boolean);
    if (!modalSelectedCategory) { Alert.alert('Falta dato', 'Elegí una categoría.'); return; }
    try {
      setAddProductSaving(true);
      if (validNames.length === 0) {
        // Solo crear la categoría
        if (!derivedCategories.includes(modalSelectedCategory)) {
          await createStandaloneCategory(provider.id, modalSelectedCategory);
          setStandaloneCategories((prev) =>
            Array.from(new Set([...prev, modalSelectedCategory])).sort((a, b) => a.localeCompare(b))
          );
        }
        closeAddModal();
        return;
      }
      // Crear artículos
      const ids = await Promise.all(
        validNames.map((name) =>
          createProduct({ providerId: provider.id, name, category: modalSelectedCategory })
        )
      );
      const newProds = validNames.map((name, i) => ({
        id: ids[i], name, category: modalSelectedCategory, hay: '', active: true,
      }));
      setProducts((prev) => [...prev, ...newProds]);
      closeAddModal();
    } catch (error) {
      console.log('Error guardando:', error);
      Alert.alert('Error', 'No se pudo guardar.');
    } finally {
      setAddProductSaving(false);
    }
  }

  // ─── Small modal helpers ──────────────────────────────────────────────────

  function openSmallModal(onReady) {
    smallScale.setValue(0.85);
    smallOpacity.setValue(0);
    onReady();
    Animated.parallel([
      Animated.spring(smallScale, { toValue: 1, useNativeDriver: true, tension: 130, friction: 8 }),
      Animated.timing(smallOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  }

  function closeSmallModal(setVisible, callback) {
    Animated.parallel([
      Animated.timing(smallScale, { toValue: 0.85, duration: 140, useNativeDriver: true }),
      Animated.timing(smallOpacity, { toValue: 0, duration: 140, useNativeDriver: true }),
    ]).start(() => { setVisible(false); if (callback) callback(); });
  }

  // ─── Edit category ────────────────────────────────────────────────────────

  function openEditCat(category) {
    setEditingCategory(category);
    setEditCatName(category);
    openSmallModal(() => setEditCatVisible(true));
  }

  async function handleSaveEditCat() {
    const trimmed = editCatName.trim();
    if (!trimmed) { Alert.alert('Falta dato', 'Escribí un nombre para la categoría.'); return; }
    if (trimmed === editingCategory) { closeSmallModal(setEditCatVisible); return; }
    const exists = derivedCategories.some(
      (c) => c !== editingCategory && c.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) { Alert.alert('Ya existe', 'Ya hay una categoría con ese nombre.'); return; }
    try {
      setEditCatSaving(true);
      await renameCategory(provider.id, editingCategory, trimmed);
      setProducts((prev) =>
        prev.map((p) => p.category === editingCategory ? { ...p, category: trimmed } : p)
      );
      closeSmallModal(setEditCatVisible);
    } catch (error) {
      console.log('Error renombrando categoría:', error);
      Alert.alert('Error', 'No se pudo renombrar la categoría.');
    } finally {
      setEditCatSaving(false);
    }
  }

  // ─── Edit product name ────────────────────────────────────────────────────

  function openEditProd(product) {
    setEditingProduct(product);
    setEditProdName(product.name);
    openSmallModal(() => setEditProdVisible(true));
  }

  async function handleSaveEditProd() {
    const trimmed = editProdName.trim();
    if (!trimmed) { Alert.alert('Falta dato', 'Escribí un nombre para el artículo.'); return; }
    if (trimmed === editingProduct.name) { closeSmallModal(setEditProdVisible); return; }
    try {
      setEditProdSaving(true);
      await updateProductName(editingProduct.id, trimmed);
      setProducts((prev) =>
        prev.map((p) => p.id === editingProduct.id ? { ...p, name: trimmed } : p)
      );
      closeSmallModal(setEditProdVisible);
    } catch (error) {
      console.log('Error editando producto:', error);
      Alert.alert('Error', 'No se pudo guardar el cambio.');
    } finally {
      setEditProdSaving(false);
    }
  }

  // ─── Delete product ───────────────────────────────────────────────────────

  function confirmDeleteProduct(product) {
    Alert.alert(
      'Eliminar artículo',
      `¿Seguro que querés eliminar "${product.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => handleDeleteProduct(product) },
      ]
    );
  }

  async function handleDeleteProduct(product) {
    try {
      setDeletingId(product.id);
      await deleteProduct(product.id);
      removeCached(provider.id, product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (error) {
      console.log('Error eliminando producto:', error);
      Alert.alert('Error', 'No se pudo eliminar el artículo.');
    } finally {
      setDeletingId(null);
    }
  }

  // ─── Move category ────────────────────────────────────────────────────────

  function openMoveCat(category) {
    setMovingCategory(category);
    setMoveCatTarget('');
    openSmallModal(() => setMoveCatVisible(true));
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

  // ─── Move product ─────────────────────────────────────────────────────────

  function openMoveProd(product) {
    setMovingProduct(product);
    setMoveProdTarget('');
    openSmallModal(() => setMoveProdVisible(true));
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

  // ─── Grouped products ─────────────────────────────────────────────────────

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

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerArea}>
        <Text style={styles.title}>Cargar stock</Text>
        <View style={styles.providerChip}>
          <Text style={styles.providerChipText}>{provider.name}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.addProductBtn, pressed && styles.addProductBtnPressed]}
          onPress={openAddModal}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      <Pressable
        style={({ pressed }) => [styles.clearButton, pressed && styles.clearButtonPressed]}
        onPress={handleClearStock}
      >
        <Text style={styles.clearButtonText}>🗑  Borrar pedido</Text>
      </Pressable>

      {loading ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loaderText}>Cargando productos...</Text>
        </View>
      ) : groupedProducts.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyText}>
            Este proveedor todavía no tiene productos cargados.
          </Text>
        </View>
      ) : (
        <FlatList
          data={groupedProducts}
          keyExtractor={(item) => item.category}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          renderItem={({ item, index: categoryIndex }) => (
            <View style={styles.categoryCard}>

              {/* Category header con lápiz */}
              <View style={styles.categoryHeader}>
                <View style={styles.categoryDot} />
                <Text style={styles.categoryTitle}>{item.category}</Text>
                <View style={styles.categoryCount}>
                  <Text style={styles.categoryCountText}>{item.items.length}</Text>
                </View>
                <Pressable
                  style={({ pressed }) => [styles.catEditBtn, pressed && styles.catEditBtnPressed]}
                  onPress={() => openEditCat(item.category)}
                >
                  <Ionicons name="create-outline" size={16} color={COLORS.accent} />
                </Pressable>
                {derivedCategories.length > 1 && (
                  <Pressable
                    style={({ pressed }) => [styles.catEditBtn, pressed && styles.catEditBtnPressed]}
                    onPress={() => openMoveCat(item.category)}
                  >
                    <Ionicons name="arrow-redo-outline" size={16} color={COLORS.textSecondary} />
                  </Pressable>
                )}
              </View>

              {/* Productos con lápiz + tacho */}
              {item.items.map((product, productIndex) => (
                <View
                  key={product.id}
                  style={[
                    styles.productCard,
                    categoryIndex === groupedProducts.length - 1 &&
                    productIndex === item.items.length - 1 &&
                    { marginBottom: insets.bottom + 220 },
                  ]}
                >

                  {/* Fila nombre + botones */}
                  <View style={styles.productTopRow}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <View style={styles.productActions}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.actionBtn,
                          pressed && styles.editBtnPressed,
                        ]}
                        onPress={() => openEditProd(product)}
                        disabled={deletingId === product.id}
                      >
                        <Ionicons name="create-outline" size={15} color={COLORS.accent} />
                      </Pressable>
                      {derivedCategories.length > 1 && (
                        <Pressable
                          style={({ pressed }) => [
                            styles.actionBtn,
                            pressed && styles.moveBtnPressed,
                          ]}
                          onPress={() => openMoveProd(product)}
                          disabled={deletingId === product.id}
                        >
                          <Ionicons name="arrow-redo-outline" size={15} color={COLORS.textSecondary} />
                        </Pressable>
                      )}
                      <Pressable
                        style={({ pressed }) => [
                          styles.actionBtn,
                          pressed && styles.deleteBtnPressed,
                        ]}
                        onPress={() => confirmDeleteProduct(product)}
                        disabled={deletingId === product.id}
                      >
                        {deletingId === product.id ? (
                          <ActivityIndicator size={14} color={COLORS.danger} />
                        ) : (
                          <Ionicons name="trash-outline" size={15} color={COLORS.danger} />
                        )}
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.inputBlock}>
                    <Text style={styles.inputLabel}>Hay</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={
                        item.category === groupedProducts[0]?.category && productIndex === 0
                          ? 'Ej: 7 packs'
                          : ''
                      }
                      placeholderTextColor={COLORS.textMuted}
                      value={product.hay}
                      onChangeText={(value) => updateHay(product.id, value)}
                      underlineColorAndroid="transparent"
                      multiline
                      textAlignVertical="top"
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        />
      )}

      {/* Botón guardar stock */}
      <View style={{ paddingBottom: insets.bottom }}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            saving && styles.buttonDisabled,
            pressed && !saving && styles.buttonPressed,
          ]}
          onPress={handleSaveStock}
          disabled={saving}
        >
          <Text style={styles.buttonText}>
            {saving ? 'Guardando...' : '💾  Guardar stock'}
          </Text>
        </Pressable>
      </View>

      {/* ── Modal: agregar artículo (grande, 82%) ──────────────────────────── */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeAddModal}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={closeAddModal} />
          <Animated.View
            style={[styles.modalCard, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Agregar artículo</Text>
                <Text style={styles.modalProvider}>{provider.name}</Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.modalCloseBtn, pressed && styles.modalCloseBtnPressed]}
                onPress={closeAddModal}
              >
                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Nombres */}
              <View style={styles.modalSection}>
                <View style={styles.sectionLabelRow}>
                  <Text style={styles.sectionLabel}>Nombre del artículo</Text>
                  <Pressable
                    style={({ pressed }) => [styles.smallAddBtn, pressed && styles.smallAddBtnPressed]}
                    onPress={() => setNewNames((prev) => [...prev, ''])}
                  >
                    <Text style={styles.smallAddBtnText}>+</Text>
                  </Pressable>
                </View>
                {newNames.map((name, index) => (
                  <View key={index} style={styles.inputRow}>
                    <TextInput
                      style={[styles.modalInput, newNames.length > 1 && styles.modalInputFlex]}
                      placeholder={newNames.length > 1 ? `Artículo ${index + 1}` : 'Ej: Coca Zero 2.25'}
                      placeholderTextColor={COLORS.textMuted}
                      value={name}
                      onChangeText={(val) =>
                        setNewNames((prev) => prev.map((n, i) => (i === index ? val : n)))
                      }
                      underlineColorAndroid="transparent"
                    />
                    {newNames.length > 1 && (
                      <Pressable
                        style={({ pressed }) => [styles.removeBtn, pressed && styles.removeBtnPressed]}
                        onPress={() => setNewNames((prev) => prev.filter((_, i) => i !== index))}
                      >
                        <Text style={styles.removeBtnText}>✕</Text>
                      </Pressable>
                    )}
                  </View>
                ))}
              </View>

              {/* Categorías */}
              <View style={styles.modalSection}>
                <View style={styles.sectionLabelRow}>
                  <Text style={styles.sectionLabel}>Elegí una categoría</Text>
                  <Pressable
                    style={({ pressed }) => [styles.smallAddBtn, pressed && styles.smallAddBtnPressed]}
                    onPress={() => { setShowCatInput((v) => !v); setNewCatName(''); }}
                  >
                    <Text style={styles.smallAddBtnText}>{showCatInput ? '−' : '+'}</Text>
                  </Pressable>
                </View>

                {showCatInput && (
                  <View style={styles.newCatRow}>
                    <TextInput
                      style={[styles.modalInput, styles.modalInputFlex]}
                      placeholder="Ej: Gaseosas"
                      placeholderTextColor={COLORS.textMuted}
                      value={newCatName}
                      onChangeText={setNewCatName}
                      autoFocus
                      returnKeyType="done"
                      onSubmitEditing={handleAddNewCategory}
                      underlineColorAndroid="transparent"
                    />
                    <Pressable
                      style={({ pressed }) => [styles.catConfirmBtn, pressed && styles.catConfirmBtnPressed]}
                      onPress={handleAddNewCategory}
                    >
                      <Text style={styles.catConfirmBtnText}>OK</Text>
                    </Pressable>
                  </View>
                )}

                {modalCategories.length === 0 && !showCatInput ? (
                  <Text style={styles.emptyCatText}>Tocá + para crear la primera categoría.</Text>
                ) : (
                  modalCategories.map((cat) => {
                    const selected = modalSelectedCategory === cat;
                    return (
                      <Pressable
                        key={cat}
                        style={[styles.catButton, selected && styles.catButtonActive]}
                        onPress={() => setModalSelectedCategory(cat)}
                      >
                        {selected && <View style={styles.catCheck} />}
                        <Text style={[styles.catButtonText, selected && styles.catButtonTextActive]}>
                          {cat}
                        </Text>
                      </Pressable>
                    );
                  })
                )}
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.modalSaveBtn,
                  addProductSaving && styles.modalSaveBtnDisabled,
                  pressed && !addProductSaving && styles.modalSaveBtnPressed,
                ]}
                onPress={handleSaveNewProduct}
                disabled={addProductSaving}
              >
                <Text style={styles.modalSaveBtnText}>
                  {addProductSaving
                    ? 'Guardando...'
                    : newNames.filter((n) => n.trim()).length === 0
                      ? '✅  Guardar categoría'
                      : newNames.filter((n) => n.trim()).length > 1
                        ? `✅  Guardar ${newNames.filter((n) => n.trim()).length} artículos`
                        : '✅  Guardar artículo'}
                </Text>
              </Pressable>
              <View style={{ height: Platform.OS === 'ios' ? 20 : 8 }} />
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* ── Modal: editar categoría ────────────────────────────────────────── */}
      <Modal
        visible={editCatVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => closeSmallModal(setEditCatVisible)}
      >
        <Pressable
          style={styles.smallModalOverlay}
          onPress={() => closeSmallModal(setEditCatVisible)}
        >
          <Animated.View
            style={[
              styles.smallModalCard,
              { opacity: smallOpacity, transform: [{ scale: smallScale }] },
            ]}
          >
            <Pressable onPress={() => { }}>
              <Text style={styles.smallModalTitle}>Editar categoría</Text>
              {editingCategory && (
                <Text style={styles.smallModalSubtitle}>
                  Nombre actual: {editingCategory}
                </Text>
              )}
              <TextInput
                style={styles.smallModalInput}
                value={editCatName}
                onChangeText={setEditCatName}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSaveEditCat}
                underlineColorAndroid="transparent"
                placeholderTextColor={COLORS.textMuted}
              />
              <View style={styles.smallModalButtons}>
                <Pressable
                  style={({ pressed }) => [styles.smallCancelBtn, pressed && styles.smallCancelBtnPressed]}
                  onPress={() => closeSmallModal(setEditCatVisible)}
                  disabled={editCatSaving}
                >
                  <Text style={styles.smallCancelText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.smallConfirmBtn,
                    editCatSaving && styles.smallConfirmBtnDisabled,
                    pressed && !editCatSaving && styles.smallConfirmBtnPressed,
                  ]}
                  onPress={handleSaveEditCat}
                  disabled={editCatSaving}
                >
                  <Text style={styles.smallConfirmText}>
                    {editCatSaving ? 'Guardando...' : 'Guardar'}
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* ── Modal: mover categoría ───────────────────────────────────────── */}
      <Modal
        visible={moveCatVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => closeSmallModal(setMoveCatVisible)}
      >
        <Pressable
          style={styles.smallModalOverlay}
          onPress={() => closeSmallModal(setMoveCatVisible)}
        >
          <Animated.View
            style={[
              styles.smallModalCard,
              styles.moveModalCard,
              { opacity: smallOpacity, transform: [{ scale: smallScale }] },
            ]}
          >
            <Pressable onPress={() => { }}>
              <Text style={styles.smallModalTitle}>Mover categoría</Text>
              {movingCategory && (
                <Text style={styles.smallModalSubtitle}>
                  Todos los artículos de "{movingCategory}" se van a mover a la categoría que elijas.
                </Text>
              )}
              <ScrollView style={styles.moveCatList} showsVerticalScrollIndicator={false}>
                {derivedCategories
                  .filter((c) => c !== movingCategory)
                  .map((cat) => {
                    const selected = moveCatTarget === cat;
                    return (
                      <Pressable
                        key={cat}
                        style={[styles.catButton, selected && styles.catButtonActive]}
                        onPress={() => setMoveCatTarget(cat)}
                      >
                        {selected && <View style={styles.catCheck} />}
                        <Text style={[styles.catButtonText, selected && styles.catButtonTextActive]}>
                          {cat}
                        </Text>
                      </Pressable>
                    );
                  })}
              </ScrollView>
              <View style={styles.smallModalButtons}>
                <Pressable
                  style={({ pressed }) => [styles.smallCancelBtn, pressed && styles.smallCancelBtnPressed]}
                  onPress={() => closeSmallModal(setMoveCatVisible)}
                  disabled={moveCatSaving}
                >
                  <Text style={styles.smallCancelText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.smallConfirmBtn,
                    moveCatSaving && styles.smallConfirmBtnDisabled,
                    pressed && !moveCatSaving && styles.smallConfirmBtnPressed,
                  ]}
                  onPress={handleSaveMoveCat}
                  disabled={moveCatSaving}
                >
                  <Text style={styles.smallConfirmText}>
                    {moveCatSaving ? 'Moviendo...' : 'Mover'}
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* ── Modal: mover artículo a otra categoría ────────────────────────── */}
      <Modal
        visible={moveProdVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => closeSmallModal(setMoveProdVisible)}
      >
        <Pressable
          style={styles.smallModalOverlay}
          onPress={() => closeSmallModal(setMoveProdVisible)}
        >
          <Animated.View
            style={[
              styles.smallModalCard,
              styles.moveModalCard,
              { opacity: smallOpacity, transform: [{ scale: smallScale }] },
            ]}
          >
            <Pressable onPress={() => { }}>
              <Text style={styles.smallModalTitle}>Mover artículo</Text>
              {movingProduct && (
                <Text style={styles.smallModalSubtitle}>
                  "{movingProduct.name}" → elegí la categoría destino
                </Text>
              )}
              <ScrollView style={styles.moveCatList} showsVerticalScrollIndicator={false}>
                {derivedCategories
                  .filter((c) => c !== movingProduct?.category)
                  .map((cat) => {
                    const selected = moveProdTarget === cat;
                    return (
                      <Pressable
                        key={cat}
                        style={[styles.catButton, selected && styles.catButtonActive]}
                        onPress={() => setMoveProdTarget(cat)}
                      >
                        {selected && <View style={styles.catCheck} />}
                        <Text style={[styles.catButtonText, selected && styles.catButtonTextActive]}>
                          {cat}
                        </Text>
                      </Pressable>
                    );
                  })}
              </ScrollView>
              <View style={styles.smallModalButtons}>
                <Pressable
                  style={({ pressed }) => [styles.smallCancelBtn, pressed && styles.smallCancelBtnPressed]}
                  onPress={() => closeSmallModal(setMoveProdVisible)}
                  disabled={moveProdSaving}
                >
                  <Text style={styles.smallCancelText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.smallConfirmBtn,
                    moveProdSaving && styles.smallConfirmBtnDisabled,
                    pressed && !moveProdSaving && styles.smallConfirmBtnPressed,
                  ]}
                  onPress={handleSaveMoveProd}
                  disabled={moveProdSaving}
                >
                  <Text style={styles.smallConfirmText}>
                    {moveProdSaving ? 'Moviendo...' : 'Mover'}
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* ── Modal: editar nombre de artículo ──────────────────────────────── */}
      <Modal
        visible={editProdVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => closeSmallModal(setEditProdVisible)}
      >
        <Pressable
          style={styles.smallModalOverlay}
          onPress={() => closeSmallModal(setEditProdVisible)}
        >
          <Animated.View
            style={[
              styles.smallModalCard,
              { opacity: smallOpacity, transform: [{ scale: smallScale }] },
            ]}
          >
            <Pressable onPress={() => { }}>
              <Text style={styles.smallModalTitle}>Editar artículo</Text>
              {editingProduct && (
                <Text style={styles.smallModalSubtitle}>
                  Nombre actual: {editingProduct.name}
                </Text>
              )}
              <TextInput
                style={styles.smallModalInput}
                value={editProdName}
                onChangeText={setEditProdName}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSaveEditProd}
                underlineColorAndroid="transparent"
                placeholderTextColor={COLORS.textMuted}
              />
              <View style={styles.smallModalButtons}>
                <Pressable
                  style={({ pressed }) => [styles.smallCancelBtn, pressed && styles.smallCancelBtnPressed]}
                  onPress={() => closeSmallModal(setEditProdVisible)}
                  disabled={editProdSaving}
                >
                  <Text style={styles.smallCancelText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.smallConfirmBtn,
                    editProdSaving && styles.smallConfirmBtnDisabled,
                    pressed && !editProdSaving && styles.smallConfirmBtnPressed,
                  ]}
                  onPress={handleSaveEditProd}
                  disabled={editProdSaving}
                >
                  <Text style={styles.smallConfirmText}>
                    {editProdSaving ? 'Guardando...' : 'Guardar'}
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
  headerArea: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 1,
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
  addProductBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.accentDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  addProductBtnPressed: {
    backgroundColor: COLORS.accentDark,
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
    paddingBottom: 16,
  },
  categoryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 18,
    marginBottom: 70,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.accent,
    marginRight: 10,
  },
  categoryTitle: {
    alignSelf: 'flex-start',
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#C4B5FD',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    fontSize: 14,
    fontWeight: '800',
    color: '#6D28D9',
    textTransform: 'capitalize',
    maxWidth: '72%',
    overflow: 'hidden',
  },
  categoryCount: {
    backgroundColor: COLORS.accentLight,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 'auto',
    marginRight: 4,
  },
  categoryCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accentDark,
  },
  catEditBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catEditBtnPressed: {
    backgroundColor: COLORS.accentLight,
  },
  productCard: {
    backgroundColor: COLORS.cardAlt,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  productTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  productActions: {
    flexDirection: 'row',
    gap: 2,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnPressed: {
    backgroundColor: COLORS.accentLight,
  },
  deleteBtnPressed: {
    backgroundColor: '#FEE2E2',
  },
  moveBtnPressed: {
    backgroundColor: COLORS.borderLight,
  },
  inputBlock: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accent,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.card,
    color: COLORS.textPrimary,
    fontSize: 14,
    minHeight: 42,
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
    fontSize: 15,
  },
  clearButton: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    marginBottom: 10,
  },
  clearButtonPressed: {
    backgroundColor: '#FEE2E2',
  },
  clearButtonText: {
    color: COLORS.danger,
    fontWeight: '700',
    fontSize: 12,
  },

  // ── Modal grande (agregar artículo) ───────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalCard: {
    width: '100%',
    height: '82%',
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  modalProvider: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnPressed: {
    backgroundColor: COLORS.border,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 16,
  },
  modalSection: {
    backgroundColor: COLORS.cardAlt,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  smallAddBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallAddBtnPressed: {
    backgroundColor: COLORS.accentDark,
  },
  smallAddBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 24,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: COLORS.card,
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  modalInputFlex: {
    flex: 1,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnPressed: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  removeBtnText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  newCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  catConfirmBtn: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: COLORS.accent,
    borderRadius: 12,
  },
  catConfirmBtnPressed: {
    backgroundColor: COLORS.accentDark,
  },
  catConfirmBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyCatText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  catButton: {
    backgroundColor: COLORS.card,
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
  catButtonActive: {
    backgroundColor: COLORS.accentLight,
    borderColor: COLORS.accent,
  },
  catCheck: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
  },
  catButtonText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  catButtonTextActive: {
    color: COLORS.accentDark,
    fontWeight: '700',
  },
  modalSaveBtn: {
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
  modalSaveBtnPressed: {
    backgroundColor: COLORS.accentDark,
  },
  modalSaveBtnDisabled: {
    opacity: 0.6,
  },
  modalSaveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  moveModalCard: {
    maxHeight: '75%',
  },
  moveCatList: {
    maxHeight: 220,
    marginBottom: 14,
  },

  // ── Modales pequeños (editar categoría / editar artículo) ─────────────────
  smallModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  smallModalCard: {
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
  smallModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  smallModalSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 16,
    lineHeight: 17,
  },
  smallModalInput: {
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
  smallModalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  smallCancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  smallCancelBtnPressed: {
    backgroundColor: COLORS.cardAlt,
  },
  smallCancelText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 14,
  },
  smallConfirmBtn: {
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
  smallConfirmBtnPressed: {
    backgroundColor: COLORS.accentDark,
  },
  smallConfirmBtnDisabled: {
    opacity: 0.6,
  },
  smallConfirmText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
