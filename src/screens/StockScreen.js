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
import { createStockSnapshot } from '../services/stockService';
import { getCurrentUser, getUserProfile } from '../services/authService';
import { COLORS } from '../theme';

export default function StockScreen({ route, navigation }) {
  const { provider } = route.params;
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [provider.id]);

  async function loadProducts() {
    try {
      setLoading(true);
      const data = await getProductsByProvider(provider.id);
      setProducts(data.map((item) => ({ ...item, hay: '' })));
    } catch (error) {
      console.log('Error cargando productos para stock:', error);
    } finally {
      setLoading(false);
    }
  }

  function updateHay(productId, value) {
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

      Alert.alert('Listo', 'El stock se guardó correctamente.');
      navigation.goBack();
    } catch (error) {
      console.log('Error guardando stock:', error);
      Alert.alert('Error', 'No se pudo guardar el stock.');
    } finally {
      setSaving(false);
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

  return (
    <View style={styles.container}>
      <View style={styles.headerArea}>
        <Text style={styles.title}>Cargar stock</Text>
        <View style={styles.providerChip}>
          <Text style={styles.providerChipText}>{provider.name}</Text>
        </View>
      </View>

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
          renderItem={({ item }) => (
            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryDot} />
                <Text style={styles.categoryTitle}>{item.category}</Text>
                <View style={styles.categoryCount}>
                  <Text style={styles.categoryCountText}>{item.items.length}</Text>
                </View>
              </View>

              {item.items.map((product, productIndex) => (
                <View key={product.id} style={styles.productCard}>
                  <Text style={styles.productName}>{product.name}</Text>

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
          onPress={handleSaveStock}
          disabled={saving}
        >
          <Text style={styles.buttonText}>
            {saving ? 'Guardando...' : '💾  Guardar stock'}
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
    marginBottom: 14,
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
    marginBottom: 12,
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
  },
  categoryCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accentDark,
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
