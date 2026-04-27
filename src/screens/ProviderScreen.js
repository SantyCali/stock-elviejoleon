import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getProductsByProvider } from '../services/productService';
import { deleteProduct } from '../services/productAdminService';
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

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [provider.id])
  );

  async function loadData() {
    try {
      setLoading(true);
      const data = await getProductsByProvider(provider.id);
      setProducts(data);
      const currentUser = getCurrentUser();
      if (currentUser) {
        const profile = await getUserProfile(currentUser.uid);
        setUserRole(profile?.role || null);
      }
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

          {userRole === 'jefe' && (
            <View style={styles.topButtonsRow}>
              <Pressable
                style={({ pressed }) => [styles.outlineButton, pressed && styles.outlineButtonPressed]}
                onPress={() => navigation.navigate('AddProduct', { provider })}
              >
                <Text style={styles.outlineButtonText}>+ Agregar artículo</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.outlineButton, pressed && styles.outlineButtonPressed]}
                onPress={() => navigation.navigate('ProviderOrderHistory', { provider })}
              >
                <Text style={styles.outlineButtonText}>Últimos 5 pedidos</Text>
              </Pressable>
            </View>
          )}
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

                        {userRole === 'jefe' && (
                          <Pressable
                            style={({ pressed }) => [
                              styles.deleteButton,
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
                        )}
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
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  deleteButtonPressed: {
    backgroundColor: '#FEE2E2',
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
});
