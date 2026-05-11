import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { subscribeProductsByProvider } from '../services/productService';
import { createOrder, getLastOrderByProvider } from '../services/orderService';
import { getLatestStockByProvider } from '../services/stockService';
import { getCurrentUser, getUserProfile } from '../services/authService';
import { notifyOrderFinished } from '../services/activityNotificationService';
import { COLORS } from '../theme';

const pedirCache = {};
function getCachedPedir(providerId, productId) { return pedirCache[providerId]?.[productId] ?? ''; }
function setCachedPedir(providerId, productId, value) { if (!pedirCache[providerId]) pedirCache[providerId] = {}; pedirCache[providerId][productId] = value; }
function clearPedirCache(providerId) { delete pedirCache[providerId]; }

export default function NewOrderScreen({ route, navigation }) {
  const { provider } = route.params;
  const insets = useSafeAreaInsets();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [editPreviewProduct, setEditPreviewProduct] = useState(null);
  const [editPreviewValue, setEditPreviewValue] = useState('');
  const [pendingShareOrder, setPendingShareOrder] = useState(null);
  const [stockLoadedBy, setStockLoadedBy] = useState(null);
  const stockMapRef = useRef({});
  const lastOrderMapRef = useRef({});

  useEffect(() => {
    if (!previewMode && pendingShareOrder) {
      const order = pendingShareOrder;
      setPendingShareOrder(null);
      navigation.navigate('ShareOrder', { order });
    }
  }, [previewMode]);

  useEffect(() => {
    setLoading(true);
    let productsReady = false;
    let orderDataReady = false;
    let cancelled = false;
    let latestProducts = [];

    function mergeProducts(providerProducts) {
      const stockMap = stockMapRef.current;
      const lastOrderMap = lastOrderMapRef.current;

      setProducts(
        providerProducts.map((item) => ({
          ...item,
          hay: stockMap[item.id] ?? null,
          ultimoPedido: lastOrderMap[item.id] ?? null,
          pedirAhora: getCachedPedir(provider.id, item.id),
        }))
      );
    }

    function finishInitialLoad() {
      if (!cancelled && productsReady && orderDataReady) {
        setLoading(false);
      }
    }

    const unsubscribeProducts = subscribeProductsByProvider(
      provider.id,
      (data) => {
        productsReady = true;
        latestProducts = data;
        if (orderDataReady) mergeProducts(data);
        finishInitialLoad();
      },
      () => {
        productsReady = true;
        finishInitialLoad();
      }
    );

    Promise.all([
      getLatestStockByProvider(provider.id),
      getLastOrderByProvider(provider.id),
    ])
      .then(([latestStock, lastOrder]) => {
        if (cancelled) return;

        const stockMap = {};
        const lastOrderMap = {};

        if (latestStock?.items?.length) {
          latestStock.items.forEach((item) => {
            stockMap[item.productId] = item.hay;
          });
        }

        if (lastOrder?.items?.length) {
          lastOrder.items.forEach((item) => {
            lastOrderMap[item.productId] = item.pedir;
          });
        }

        stockMapRef.current = stockMap;
        lastOrderMapRef.current = lastOrderMap;
        orderDataReady = true;

        setStockLoadedBy(
          latestStock?.createdByName || latestStock?.createdByUsername || null
        );

        mergeProducts(latestProducts);
        finishInitialLoad();
      })
      .catch((error) => {
        console.log('Error cargando datos de pedido:', error);
        if (cancelled) return;
        orderDataReady = true;
        mergeProducts(latestProducts);
        finishInitialLoad();
      });

    return () => {
      cancelled = true;
      unsubscribeProducts();
    };
  }, [provider.id]);

  function updatePedirAhora(productId, value) {
    setCachedPedir(provider.id, productId, value);
    setProducts((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, pedirAhora: value } : item
      )
    );
  }

  function handleUseLastOrder() {
    setProducts((prev) =>
      prev.map((item) => {
        const newValue =
          item.ultimoPedido !== null && item.ultimoPedido !== undefined
            ? String(item.ultimoPedido)
            : item.pedirAhora;
        setCachedPedir(provider.id, item.id, newValue);
        return { ...item, pedirAhora: newValue };
      })
    );
  }

  async function handleSaveOrder() {
    try {
      setSaving(true);

      const currentUser = getCurrentUser();
      const profile = currentUser ? await getUserProfile(currentUser.uid) : null;

      const itemsToSave = products
        .filter((item) => item.pedirAhora.trim() !== '')
        .map((item) => ({
          productId: item.id,
          productName: item.name,
          category: item.category || '',
          hay: item.hay,
          ultimoPedido: item.ultimoPedido,
          pedir: item.pedirAhora.trim(),
        }));

      if (itemsToSave.length === 0) {
        Alert.alert('Ojo', 'Cargá al menos un producto para pedir.');
        return;
      }

      const orderId = await createOrder({
        providerId: provider.id,
        providerName: provider.name,
        status: 'pendiente',
        createdByUid: currentUser?.uid || null,
        createdByName: profile?.name || null,
        createdByUsername: profile?.username || null,
        items: itemsToSave,
      });

      notifyOrderFinished({
        profile,
        providerName: provider.name,
      });

      const orderToShare = {
        id: orderId,
        providerId: provider.id,
        providerName: provider.name,
        createdByUid: currentUser?.uid || null,
        createdByName: profile?.name || null,
        createdByUsername: profile?.username || null,
        createdAt: new Date().toISOString(),
        status: 'pendiente',
        items: itemsToSave,
      };

      clearPedirCache(provider.id);
      setPendingShareOrder(orderToShare);
      setPreviewMode(false);
    } catch (error) {
      console.log('Error guardando pedido:', error);
      Alert.alert('Error', 'No se pudo guardar el pedido.');
    } finally {
      setSaving(false);
    }
  }

  function renderHay(item) {
    if (item.hay === null || item.hay === undefined)
      return `${stockLoadedBy || 'Nadie'} todavía no puso stock`;
    return String(item.hay);
  }

  function renderUltimoPedido(item) {
    if (item.ultimoPedido === null || item.ultimoPedido === undefined)
      return 'No hay registro';
    return String(item.ultimoPedido);
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

  const previewGroups = useMemo(() =>
    groupedProducts
      .map((g) => ({ ...g, items: g.items.filter((p) => p.pedirAhora.trim() !== '') }))
      .filter((g) => g.items.length > 0),
  [groupedProducts]);

  function handlePreview() {
    const hasItems = products.some((p) => p.pedirAhora.trim() !== '');
    if (!hasItems) {
      Alert.alert('Ojo', 'Cargá al menos un producto para pedir.');
      return;
    }
    setPreviewMode(true);
  }

  function openPreviewEdit(product) {
    setEditPreviewValue(product.pedirAhora);
    setEditPreviewProduct(product);
  }

  function confirmPreviewEdit() {
    if (editPreviewProduct) {
      updatePedirAhora(editPreviewProduct.id, editPreviewValue);
    }
    setEditPreviewProduct(null);
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerArea}>
        <Text style={styles.title}>Nuevo pedido</Text>
        <View style={styles.providerChip}>
          <Text style={styles.providerChipText}>{provider.name}</Text>
        </View>
      </View>

      {!loading && (
        <Pressable
          style={({ pressed }) => [styles.baseButton, pressed && styles.baseButtonPressed]}
          onPress={handleUseLastOrder}
        >
          <Text style={styles.baseButtonText}>♻️  Usar último pedido como base</Text>
        </Pressable>
      )}

      {loading ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loaderText}>Cargando datos...</Text>
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
              <View style={styles.categoryHeader}>
                <View style={styles.categoryDot} />
                <Text style={styles.categoryTitle}>{item.category}</Text>
              </View>

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
                  <Text style={styles.productName}>{product.name}</Text>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Hay</Text>
                    <View style={styles.infoValueWrap}>
                      <Text style={styles.infoValue}>{renderHay(product)}</Text>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Último pedido</Text>
                    <View style={styles.infoValueWrap}>
                      <Text style={styles.infoValue}>{renderUltimoPedido(product)}</Text>
                    </View>
                  </View>

                  <View style={styles.inputBlock}>
                    <Text style={styles.inputLabel}>Pedir ahora</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={
                        item.category === groupedProducts[0]?.category && productIndex === 0
                          ? 'Ej: 7 packs'
                          : ''
                      }
                      placeholderTextColor={COLORS.textMuted}
                      value={product.pedirAhora}
                      onChangeText={(value) => updatePedirAhora(product.id, value)}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        />
      )}

      <View style={{ paddingBottom: insets.bottom }}>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={handlePreview}
        >
          <Text style={styles.buttonText}>Vista previa</Text>
        </Pressable>
      </View>

      {/* ── Vista previa ──────────────────────────────────────────────────── */}
      <Modal
        visible={previewMode}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setPreviewMode(false)}
      >
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.headerArea}>
            <Pressable
              onPress={() => setPreviewMode(false)}
              style={styles.previewBackBtn}
            >
              <Ionicons name="chevron-back" size={20} color={COLORS.accent} />
              <Text style={styles.previewBackText}>Volver</Text>
            </Pressable>
            <Text style={styles.title}>Vista previa</Text>
            <View style={styles.providerChip}>
              <Text style={styles.providerChipText}>{provider.name}</Text>
            </View>
          </View>

          <FlatList
            data={previewGroups}
            keyExtractor={(g) => g.category}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            renderItem={({ item: group, index: groupIndex }) => (
              <View style={styles.categoryCard}>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryDot} />
                  <Text style={styles.categoryTitle}>{group.category}</Text>
                </View>
                {group.items.map((product, productIndex) => (
                  <View
                    key={product.id}
                    style={[
                      styles.previewRow,
                      groupIndex === previewGroups.length - 1 &&
                        productIndex === group.items.length - 1 &&
                        { marginBottom: insets.bottom + 100 },
                    ]}
                  >
                    <View style={styles.previewLeft}>
                      <Text style={styles.previewName}>{product.name}</Text>
                      {product.hay !== null && product.hay !== undefined && (
                        <Text style={styles.previewHay}>Hay: {product.hay}</Text>
                      )}
                    </View>
                    <Pressable
                      style={({ pressed }) => [
                        styles.previewValueWrap,
                        pressed && styles.previewValueWrapPressed,
                      ]}
                      onPress={() => openPreviewEdit(product)}
                    >
                      <Text style={styles.previewInput} numberOfLines={2}>{product.pedirAhora}</Text>
                      <Ionicons name="create-outline" size={14} color={COLORS.accent} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          />

          <View style={{ paddingBottom: insets.bottom }}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                saving && styles.buttonDisabled,
                pressed && !saving && styles.buttonPressed,
              ]}
              onPress={handleSaveOrder}
              disabled={saving}
            >
              <Text style={styles.buttonText}>
                {saving ? 'Guardando...' : '✅  Guardar pedido'}
              </Text>
            </Pressable>
          </View>

          {/* ── Popup editar valor en vista previa ─────────────────────── */}
          <Modal
            visible={editPreviewProduct !== null}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={() => setEditPreviewProduct(null)}
          >
            <Pressable
              style={styles.smallModalOverlay}
              onPress={() => setEditPreviewProduct(null)}
            >
              <View style={styles.smallModalCard}>
                <Pressable onPress={() => {}}>
                  <Text style={styles.smallModalTitle}>Editar cantidad</Text>
                  {editPreviewProduct && (
                    <Text style={styles.smallModalSubtitle}>{editPreviewProduct.name}</Text>
                  )}
                  <TextInput
                    style={styles.smallModalInput}
                    value={editPreviewValue}
                    onChangeText={setEditPreviewValue}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={confirmPreviewEdit}
                    underlineColorAndroid="transparent"
                    placeholderTextColor={COLORS.textMuted}
                    placeholder="Ej: 7 packs"
                  />
                  <View style={styles.smallModalButtons}>
                    <Pressable
                      style={({ pressed }) => [styles.smallCancelBtn, pressed && styles.smallCancelBtnPressed]}
                      onPress={() => setEditPreviewProduct(null)}
                    >
                      <Text style={styles.smallCancelText}>Cancelar</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [styles.smallConfirmBtn, pressed && styles.smallConfirmBtnPressed]}
                      onPress={confirmPreviewEdit}
                    >
                      <Text style={styles.smallConfirmText}>Guardar</Text>
                    </Pressable>
                  </View>
                </Pressable>
              </View>
            </Pressable>
          </Modal>
        </View>
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
    marginBottom: 12,
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
  baseButton: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginBottom: 14,
  },
  baseButtonPressed: {
    backgroundColor: COLORS.accentLight,
  },
  baseButtonText: {
    color: COLORS.accent,
    fontWeight: '700',
    fontSize: 13,
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
    overflow: 'hidden',
  },
  productCard: {
    backgroundColor: COLORS.cardAlt,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
    gap: 8,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    width: 90,
  },
  infoValueWrap: {
    flex: 1,
  },
  infoValue: {
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  inputBlock: {
    marginTop: 8,
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
  },
  button: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
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

  // ── Vista previa ──────────────────────────────────────────────────────────
  previewBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginRight: 4,
  },
  previewBackText: {
    color: COLORS.accent,
    fontWeight: '700',
    fontSize: 15,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: 12,
  },
  previewLeft: {
    flex: 1,
  },
  previewName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  previewHay: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  previewValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.cardAlt,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    minWidth: 80,
    maxWidth: 150,
  },
  previewInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    padding: 0,
  },
  previewValueWrapPressed: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentLight,
  },
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
  smallConfirmText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
