import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getRecentOrdersByProvider } from '../services/orderService';
import { Ionicons } from '@expo/vector-icons';

function formatCreatedAt(createdAt) {
  if (!createdAt) return 'Sin fecha';

  if (typeof createdAt === 'string') {
    const date = new Date(createdAt);
    if (!isNaN(date.getTime())) {
      return date.toLocaleString('es-AR');
    }
    return createdAt;
  }

  if (createdAt?.toDate) {
    return createdAt.toDate().toLocaleString('es-AR');
  }

  return 'Sin fecha';
}

function buildPreview(items = []) {
  return items
    .slice(0, 2)
    .map((item) => `${item.productName} ${item.pedir}`)
    .join(', ');
}

export default function ProviderOrderHistoryScreen({ route, navigation }) {
  const { provider } = route.params;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [provider.id])
  );

  async function loadOrders() {
    try {
      setLoading(true);
      const data = await getRecentOrdersByProvider(provider.id, 5);
      setOrders(data);
    } catch (error) {
      console.log('Error cargando historial del proveedor:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loaderText}>Cargando pedidos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Últimos 5 pedidos</Text>
      <Text style={styles.subtitle}>{provider.name}</Text>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              Todavía no hay pedidos guardados para este proveedor.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Pressable
              style={styles.cardContent}
              onPress={() => navigation.navigate('OrderDetail', { order: item })}
            >
              <Text style={styles.dateText}>{formatCreatedAt(item.createdAt)}</Text>
              <Text style={styles.previewText}>{buildPreview(item.items)}</Text>
            </Pressable>

            <Pressable
              style={styles.shareButton}
              onPress={() => navigation.navigate('ShareOrder', { order: item })}
            >
              <Ionicons name="share-outline" size={22} color="#fff" />
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6f7fb',
  },
  loaderText: {
    marginTop: 10,
    color: '#4b5563',
  },
  container: {
    flex: 1,
    backgroundColor: '#f6f7fb',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 16,
  },
  emptyBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  emptyText: {
    color: '#4b5563',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    paddingRight: 12,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  previewText: {
    fontSize: 14,
    color: '#4b5563',
  },
  shareButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
});