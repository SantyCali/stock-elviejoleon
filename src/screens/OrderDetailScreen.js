import React, { useMemo } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

function formatCreatedAt(createdAt) {
  if (!createdAt) return 'Sin fecha';

  if (typeof createdAt === 'string') {
    return createdAt;
  }

  if (createdAt?.toDate) {
    return createdAt.toDate().toLocaleString('es-AR');
  }

  return 'Sin fecha';
}

export default function OrderDetailScreen({ route }) {
  const order = route?.params?.order;

  const groupedItems = useMemo(() => {
    if (!order?.items?.length) return [];

    const groups = {};

    order.items.forEach((item) => {
      const category = item.category?.trim() || 'Sin categoría';

      if (!groups[category]) {
        groups[category] = [];
      }

      groups[category].push(item);
    });

    return Object.keys(groups)
      .sort((a, b) => a.localeCompare(b))
      .map((category) => ({
        category,
        items: groups[category].sort((a, b) =>
          a.productName.localeCompare(b.productName)
        ),
      }));
  }, [order]);

  if (!order) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No se encontró el pedido.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.title}>{order.providerName}</Text>
        <Text style={styles.subtitle}>
          Fecha: {formatCreatedAt(order.createdAt)}
        </Text>

        {!!order.createdByName && (
          <Text style={styles.subtitle}>
            Hecho por: {order.createdByName}
          </Text>
        )}

        {!!order.createdByUsername && (
          <Text style={styles.subtitle}>
            Usuario: @{order.createdByUsername}
          </Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>Detalle del pedido</Text>

      <FlatList
        data={groupedItems}
        keyExtractor={(item) => item.category}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.categoryCard}>
            <Text style={styles.categoryTitle}>{item.category}</Text>

            {item.items.map((product) => (
              <View key={product.productId} style={styles.productCard}>
                <Text style={styles.productName}>{product.productName}</Text>

                <Text style={styles.infoText}>
                  Hay: {product.hay ?? 'Sin dato'}
                </Text>

                <Text style={styles.infoText}>
                  Último pedido: {product.ultimoPedido ?? 'No hay registro'}
                </Text>

                <Text style={styles.orderText}>
                  Pedido: {product.pedir ?? 'Sin dato'}
                </Text>
              </View>
            ))}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7fb',
    padding: 16,
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
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
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
  },
  productCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  orderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginTop: 2,
  },
});