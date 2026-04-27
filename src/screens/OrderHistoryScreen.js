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
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loaderText}>Cargando historial...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerArea}>
        <Text style={styles.title}>Historial</Text>
        {orders.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{orders.length}</Text>
          </View>
        )}
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
              Los pedidos que hagas aparecerán acá.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardAccent} />
            <Pressable
              style={styles.cardContent}
              onPress={() => navigation.navigate('OrderDetail', { order: item })}
            >
              <Text style={styles.providerName}>{item.providerName}</Text>
              <Text style={styles.dateText}>{formatCreatedAt(item.createdAt)}</Text>
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
  headerArea: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  countBadge: {
    backgroundColor: COLORS.accent,
    borderRadius: 20,
    minWidth: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  countBadgeText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
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
  providerName: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
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
