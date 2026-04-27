import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
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

export default function OrderDetailScreen({ route }) {
  const order = route?.params?.order;

  const groupedItems = useMemo(() => {
    if (!order?.items?.length) return [];
    const groups = {};
    order.items.forEach((item) => {
      const category = item.category?.trim() || 'Sin categoría';
      if (!groups[category]) groups[category] = [];
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
          <Text style={styles.emptyIcon}>❌</Text>
          <Text style={styles.emptyText}>No se encontró el pedido.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <View style={styles.headerAccentBar} />
        <View style={styles.headerContent}>
          <Text style={styles.title}>{order.providerName}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>📅</Text>
            <Text style={styles.metaValue}>{formatCreatedAt(order.createdAt)}</Text>
          </View>

          {!!order.createdByName && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>👤</Text>
              <Text style={styles.metaValue}>{order.createdByName}</Text>
            </View>
          )}

          {!!order.createdByUsername && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>@</Text>
              <Text style={styles.metaValue}>{order.createdByUsername}</Text>
            </View>
          )}

          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
              {order.items?.length || 0} producto{(order.items?.length || 0) !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Detalle del pedido</Text>

      <FlatList
        data={groupedItems}
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

            {item.items.map((product) => (
              <View key={product.productId} style={styles.productCard}>
                <Text style={styles.productName}>{product.productName}</Text>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Había</Text>
                  <Text style={styles.infoValue}>{product.hay ?? 'Sin dato'}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Pedido ant.</Text>
                  <Text style={styles.infoValue}>{product.ultimoPedido ?? 'No hay registro'}</Text>
                </View>

                <View style={styles.orderRow}>
                  <Text style={styles.orderLabel}>Se pidió</Text>
                  <View style={styles.orderBadge}>
                    <Text style={styles.orderBadgeText}>{product.pedir ?? 'Sin dato'}</Text>
                  </View>
                </View>
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
    backgroundColor: COLORS.bg,
    padding: 16,
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
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },
  metaLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  metaValue: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  countBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.accentLight,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 8,
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accentDark,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  listContent: {
    paddingBottom: 20,
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
  categoryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
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
    marginBottom: 8,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    width: 80,
  },
  infoValue: {
    fontSize: 13,
    color: COLORS.textPrimary,
    flex: 1,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  orderLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    width: 80,
  },
  orderBadge: {
    backgroundColor: COLORS.accentLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  orderBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.accentDark,
  },
});
