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
import { getRecentOrders } from '../services/orderService';

function formatCreatedAt(createdAt) {
  if (!createdAt) return 'Sin fecha';

  if (typeof createdAt === 'string') {
    return createdAt;
  }

  if (createdAt?.toDate) {
    return createdAt.toDate().toLocaleDateString('es-AR');
  }

  return 'Sin fecha';
}

function buildPreview(items = []) {
  return items
    .slice(0, 2)
    .map((item) => `${item.productName} ${item.pedir}`)
    .join(', ');
}

export default function OrderHistoryScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [])
  );

  async function loadOrders() {
    try {
      setLoading(true);
      const data = await getRecentOrders(5);
      setOrders(data);
    } catch (error) {
      console.log('Error cargando historial:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loaderText}>Cargando historial...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Últimos pedidos</Text>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              Todavía no hay pedidos guardados.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate('OrderDetail', { order: item })}
          >
            <Text style={styles.providerName}>{item.providerName}</Text>
            <Text style={styles.dateText}>{formatCreatedAt(item.createdAt)}</Text>
            <Text style={styles.previewText}>{buildPreview(item.items)}</Text>
          </Pressable>
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
  },
  providerName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  dateText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
  },
  previewText: {
    fontSize: 14,
    color: '#4b5563',
  },
});