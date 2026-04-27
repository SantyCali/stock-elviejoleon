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
import { COLORS } from '../theme';

function formatCreatedAt(createdAt) {
  if (!createdAt) return 'Sin fecha';
  if (typeof createdAt === 'string') {
    const date = new Date(createdAt);
    if (!isNaN(date.getTime())) return date.toLocaleString('es-AR');
    return createdAt;
  }
  if (createdAt?.toDate) return createdAt.toDate().toLocaleString('es-AR');
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
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loaderText}>Cargando pedidos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Últimos 5 pedidos</Text>
      <View style={styles.providerChip}>
        <Text style={styles.providerChipText}>{provider.name}</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Sin pedidos guardados</Text>
            <Text style={styles.emptySubtitle}>
              Todavía no hay pedidos para este proveedor.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={styles.card}>
            <View style={styles.cardAccent} />
            <Pressable
              style={styles.cardContent}
              onPress={() => navigation.navigate('OrderDetail', { order: item })}
            >
              <View style={styles.cardTopRow}>
                <View style={styles.orderNumberBadge}>
                  <Text style={styles.orderNumberText}>#{orders.length - index}</Text>
                </View>
                <Text style={styles.dateText}>{formatCreatedAt(item.createdAt)}</Text>
              </View>
              {!!buildPreview(item.items) && (
                <Text style={styles.previewText} numberOfLines={1}>
                  {buildPreview(item.items)}
                </Text>
              )}
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.shareButton, pressed && styles.shareButtonPressed]}
              onPress={() => navigation.navigate('ShareOrder', { order: item })}
            >
              <Ionicons name="share-outline" size={20} color="#fff" />
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
    backgroundColor: COLORS.bg,
  },
  loaderText: {
    marginTop: 10,
    color: COLORS.textSecondary,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  providerChip: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.accentLight,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 16,
  },
  providerChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accentDark,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyBox: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardAccent: {
    width: 5,
    alignSelf: 'stretch',
    backgroundColor: COLORS.accent,
  },
  cardContent: {
    flex: 1,
    padding: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 5,
  },
  orderNumberBadge: {
    backgroundColor: COLORS.accentLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  orderNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.accentDark,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  previewText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  shareButtonPressed: {
    backgroundColor: COLORS.accentDark,
  },
});
