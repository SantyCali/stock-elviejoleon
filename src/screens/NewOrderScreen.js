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
import { getProductsByProvider } from '../services/productService';
import { createOrder, getLastOrderByProvider } from '../services/orderService';
import { getLatestStockByProvider } from '../services/stockService';
import { getCurrentUser, getUserProfile } from '../services/authService';

export default function NewOrderScreen({ route, navigation }) {
  const { provider } = route.params;

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

      if (latestStock?.createdByName || latestStock?.createdByUsername) {
        setStockLoadedBy(
          latestStock.createdByName || latestStock.createdByUsername
        );
      } else {
        setStockLoadedBy(null);
      }

      const formatted = providerProducts.map((item) => ({
        ...item,
        hay: stockMap[item.id] ?? null,
        ultimoPedido: lastOrderMap[item.id] ?? null,
        pedirAhora: '',
      }));

      setProducts(formatted);
    } catch (error) {
      console.log('Error cargando datos de pedido:', error);
    } finally {
      setLoading(false);
    }
  }

  function updatePedirAhora(productId, value) {
    setProducts((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, pedirAhora: value } : item
      )
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

      await createOrder({
        providerId: provider.id,
        providerName: provider.name,
        status: 'pendiente',
        createdByUid: currentUser?.uid || null,
        createdByName: profile?.name || null,
        createdByUsername: profile?.username || null,
        items: itemsToSave,
      });

      Alert.alert('Pedido guardado', 'El pedido se guardó correctamente.');
      navigation.goBack();
    } catch (error) {
      console.log('Error guardando pedido:', error);
      Alert.alert('Error', 'No se pudo guardar el pedido.');
    } finally {
      setSaving(false);
    }
  }

  function renderHay(item) {
    if (item.hay === null || item.hay === undefined) {
      return `${stockLoadedBy || 'Poro'} todavía no puso stock`;
    }

    return String(item.hay);
  }

  function renderUltimoPedido(item) {
    if (item.ultimoPedido === null || item.ultimoPedido === undefined) {
      return 'No hay registro';
    }

    return String(item.ultimoPedido);
  }

  const groupedProducts = useMemo(() => {
    const groups = {};

    products.forEach((product) => {
      const category = product.category?.trim() || 'Sin categoría';

      if (!groups[category]) {
        groups[category] = [];
      }

      groups[category].push(product);
    });

    return Object.keys(groups)
      .sort((a, b) => a.localeCompare(b))
      .map((category) => ({
        category,
        items: groups[category].sort((a, b) =>
          a.name.localeCompare(b.name)
        ),
      }));
  }, [products]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hacer pedido - {provider.name}</Text>

      {loading ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" />
          <Text style={styles.loaderText}>Cargando datos...</Text>
        </View>
      ) : groupedProducts.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            Este proveedor todavía no tiene productos cargados.
          </Text>
        </View>
      ) : (
        <FlatList
          data={groupedProducts}
          keyExtractor={(item) => item.category}
          contentContainerStyle={{ paddingBottom: 300 }}
          renderItem={({ item }) => (
            <View style={styles.categoryCard}>
              <Text style={styles.categoryTitle}>{item.category}</Text>

              {item.items.map((product, productIndex) => (
                <View key={product.id} style={styles.productCard}>
                  <Text style={styles.name}>{product.name}</Text>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Hay:</Text>
                    <Text style={styles.infoValue}>{renderHay(product)}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Último pedido:</Text>
                    <Text style={styles.infoValue}>
                      {renderUltimoPedido(product)}
                    </Text>
                  </View>

                  <View style={styles.inputBlock}>
                    <Text style={styles.label}>Pedir</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={
                        item.category === groupedProducts[0]?.category &&
                        productIndex === 0
                          ? 'Ej: 7 packs'
                          : ''
                      }
                      value={product.pedirAhora}
                      onChangeText={(value) =>
                        updatePedirAhora(product.id, value)
                      }
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        />
      )}

      <Pressable
        style={[styles.button, saving && styles.buttonDisabled]}
        onPress={handleSaveOrder}
        disabled={saving}
      >
        <Text style={styles.buttonText}>
          {saving ? 'Guardando...' : 'Guardar pedido'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f6f7fb',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  loaderBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    color: '#4b5563',
  },
  emptyBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  emptyText: {
    color: '#4b5563',
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
    textTransform: 'capitalize',
  },
  productCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginRight: 8,
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  inputBlock: {
    marginTop: 8,
  },
  label: {
    fontSize: 12,
    color: '#4b5563',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
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