import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { deleteStockSnapshot, subscribeAllStocks } from '../services/stockService';
import { COLORS } from '../theme';

function formatDate(createdAt) {
  if (!createdAt) return 'Sin fecha';
  const date = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
  return date.toLocaleString('es-AR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function StockHistoryScreen({ navigation }) {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeAllStocks((data) => {
      setStocks(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  function confirmDelete(stock) {
    Alert.alert(
      'Borrar stock',
      `¿Seguro que querés borrar el stock de ${stock.providerName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Borrar', style: 'destructive', onPress: () => handleDelete(stock.id) },
      ]
    );
  }

  async function handleDelete(stockId) {
    try {
      setDeletingId(stockId);
      await deleteStockSnapshot(stockId);
      // La lista se actualiza sola via onSnapshot
    } catch (error) {
      console.log('Error borrando stock:', error);
      Alert.alert('Error', 'No se pudo borrar el stock.');
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#F472B6" />
        <Text style={styles.loaderText}>Cargando historial...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={stocks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Text style={styles.sectionLabel}>
            {stocks.length > 0
              ? `${stocks.length} registro${stocks.length !== 1 ? 's' : ''}`
              : 'Sin registros'}
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>No hay stocks cargados</Text>
            <Text style={styles.emptySubtitle}>
              Los stocks aparecen acá cuando alguien los carga.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => navigation.navigate('EditStock', { stock: item })}
          >
            <View style={styles.cardAccent} />
            <View style={styles.cardBody}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitle}>{item.providerName}</Text>
              </View>
              <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
              {!!item.createdByName && (
                <Text style={styles.cardMeta}>Cargado por {item.createdByName}</Text>
              )}
              <View style={styles.cardFooter}>
                <Text style={styles.cardChip}>
                  {item.items?.length ?? 0} producto{item.items?.length !== 1 ? 's' : ''}
                </Text>
                {!!item.updatedAt && (
                  <Text style={styles.cardChipEdited}>Editado</Text>
                )}
              </View>
            </View>
            <View style={styles.cardActions}>
              <Pressable
                style={({ pressed }) => [styles.editBtn, pressed && styles.editBtnPressed]}
                onPress={() => navigation.navigate('EditStock', { stock: item })}
                hitSlop={4}
              >
                <Ionicons name="create-outline" size={18} color="#BE185D" />
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.deleteBtn, pressed && styles.deleteBtnPressed]}
                onPress={() => confirmDelete(item)}
                disabled={deletingId === item.id}
                hitSlop={4}
              >
                {deletingId === item.id ? (
                  <ActivityIndicator size={16} color="#fff" />
                ) : (
                  <Ionicons name="trash-outline" size={16} color="#fff" />
                )}
              </Pressable>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
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
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  listContent: {
    paddingBottom: 30,
  },
  emptyBox: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    marginTop: 16,
  },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
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
    backgroundColor: '#FFF5FA',
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FBCFE8',
    shadowColor: '#F472B6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressed: { opacity: 0.85 },
  cardAccent: {
    width: 5,
    backgroundColor: '#F472B6',
  },
  cardBody: {
    flex: 1,
    padding: 14,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  cardDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#BE185D',
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  cardMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  cardChip: {
    backgroundColor: '#FCE7F3',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    fontSize: 12,
    fontWeight: '600',
    color: '#9D174D',
  },
  cardChipEdited: {
    backgroundColor: '#EDE9FE',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    fontSize: 12,
    fontWeight: '600',
    color: '#5B21B6',
  },
  cardActions: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingRight: 12,
  },
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FCE7F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnPressed: { backgroundColor: '#FBCFE8' },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnPressed: { backgroundColor: '#b91c1c' },
});
