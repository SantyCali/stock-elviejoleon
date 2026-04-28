import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getProductsByProvider } from '../services/productService';
import { createOrder, getLastOrderByProvider } from '../services/orderService';
import { getLatestStockByProvider } from '../services/stockService';
import { getCurrentUser, getUserProfile } from '../services/authService';
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
  const [stockLoadedBy, setStockLoadedBy] = useState(null);

  useEffect(() => {
    loadOrderData();
  }, [provider.id]);

  async function loadOrderData() {
    try {
      setLoading(true);

      const providerProducts = await getProductsByProvider(provider.id);
      const latestStock = await getLatestStockByProvider(provider.id);
      const lastOrder = await getLastOrderByProvider(provider.id);

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

      setStockLoadedBy(
        latestStock?.createdByName || latestStock?.createdByUsername || null
      );

      setProducts(
        providerProducts.map((item) => ({
          ...item,
          hay: stockMap[item.id] ?? null,
          ultimoPedido: lastOrderMap[item.id] ?? null,
          pedirAhora: getCachedPedir(provider.id, item.id),
        }))
      );
    } catch (error) {
      console.log('Error cargando datos de pedido:', error);
    } finally {
      setLoading(false);
    }
  }

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
      Alert.alert('Pedido guardado', 'El pedido se guardó correctamente.', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('ShareOrder', { order: orderToShare }),
        },
      ]);
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
          renderItem={({ item }) => (
            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryDot} />
                <Text style={styles.categoryTitle}>{item.category}</Text>
              </View>

              {item.items.map((product, productIndex) => (
                <View key={product.id} style={styles.productCard}>
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
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
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
  },
  productCard: {
    backgroundColor: COLORS.cardAlt,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
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
});
