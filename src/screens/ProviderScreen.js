import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getProductsByProvider } from '../services/productService';
import { getCurrentUser, getUserProfile } from '../services/authService';

export default function ProviderScreen({ route, navigation }) {
  const { provider } = route.params;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

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
        items: groups[category].sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [products]);

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.title}>{provider.name}</Text>

        {!!provider.alias?.length && (
          <Text style={styles.subtitle}>
            También figura como: {provider.alias.join(', ')}
          </Text>
        )}

        <Text style={styles.subtitle}>Días: {provider.days?.join(', ')}</Text>

        {userRole === 'jefe' && (
          <View style={styles.topButtonsRow}>
            <Pressable
              style={styles.smallButton}
              onPress={() => navigation.navigate('AddProduct', { provider })}
            >
              <Text style={styles.smallButtonText}>+ Agregar artículo</Text>
            </Pressable>

            <Pressable
              style={styles.smallButton}
              onPress={() =>
                navigation.navigate('ProviderOrderHistory', { provider })
              }
            >
              <Text style={styles.smallButtonText}>Últimos 5 pedidos</Text>
            </Pressable>
          </View>
        )}
      </View>

      <Text style={styles.sectionTitle}>Productos por categoría</Text>

      {loading ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" />
          <Text style={styles.loaderText}>Cargando productos...</Text>
        </View>
      ) : groupedProducts.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            Todavía no cargamos los productos de este proveedor en Firebase.
          </Text>
        </View>
      ) : (
        <FlatList
          data={groupedProducts}
          keyExtractor={(item) => item.category}
          contentContainerStyle={{ paddingBottom: 16 }}
          renderItem={({ item }) => (
            <View style={styles.categoryCard}>
              <Text style={styles.categoryTitle}>{item.category}</Text>

              {item.items.map((product) => (
                <View key={product.id} style={styles.productRow}>
                  <Text style={styles.productBullet}>•</Text>
                  <Text style={styles.productName}>{product.name}</Text>
                </View>
              ))}
            </View>
          )}
        />
      )}

      <View style={styles.buttonsContainer}>
        <Pressable
          style={styles.button}
          onPress={() => navigation.navigate('Stock', { provider })}
        >
          <Text style={styles.buttonText}>Cargar stock</Text>
        </Pressable>

        {userRole === 'jefe' && (
          <Pressable
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('NewOrder', { provider })}
          >
            <Text style={styles.secondaryButtonText}>Hacer pedido</Text>
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
    backgroundColor: '#f6f7fb',
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  subtitle: {
    color: '#6b7280',
    marginBottom: 4,
  },
  topButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  smallButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#111827',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallButtonText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
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
    marginBottom: 16,
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
  productRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  productBullet: {
    color: '#111827',
    marginRight: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  productName: {
    flex: 1,
    color: '#4b5563',
    fontSize: 14,
    lineHeight: 20,
  },
  buttonsContainer: {
    marginTop: 8,
    gap: 10,
  },
  button: {
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#111827',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 15,
  },
});