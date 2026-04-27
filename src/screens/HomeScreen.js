import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getProviders } from '../services/providerService';
import { getTodayLabel, getTodayName } from '../utils/dates';
import { COLORS } from '../theme';

function normalizeDayName(day) {
  return String(day || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export default function HomeScreen({ navigation }) {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  const todayName = getTodayName();
  const todayLabel = getTodayLabel();

  useEffect(() => {
    loadProviders();
  }, []);

  async function loadProviders() {
    try {
      setLoading(true);
      const data = await getProviders();
      setProviders(data);
    } catch (error) {
      console.log('Error cargando proveedores:', error);
    } finally {
      setLoading(false);
    }
  }

  const providersToday = useMemo(() => {
    return providers.filter((provider) => {
      const normalizedDays = (provider.days || []).map((day) =>
        normalizeDayName(day)
      );
      const normalizedToday = normalizeDayName(todayName);
      return normalizedDays.includes(normalizedToday);
    });
  }, [providers, todayName]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loaderText}>Cargando proveedores...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerArea}>
        <Text style={styles.title}>Pedidos del negocio</Text>
        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeText}>{todayLabel}</Text>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.providersButton,
          pressed && styles.providersButtonPressed,
        ]}
        onPress={() => navigation.navigate('ProvidersList')}
      >
        <Text style={styles.providersButtonText}>Ver todos los proveedores</Text>
      </Pressable>

      <Text style={styles.sectionLabel}>
        {providersToday.length > 0
          ? `${providersToday.length} proveedor${providersToday.length !== 1 ? 'es' : ''} hoy`
          : 'Proveedores de hoy'}
      </Text>

      <FlatList
        data={providersToday}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No hay proveedores para hoy</Text>
            <Text style={styles.emptySubtitle}>
              Revisá la lista completa si necesitás hacer un pedido.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => navigation.navigate('Provider', { provider: item })}
          >
            <View style={styles.cardAccent} />
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.name}</Text>

              {!!item.alias?.length && (
                <Text style={styles.cardText}>
                  También conocido como: {item.alias.join(', ')}
                </Text>
              )}

              <View style={styles.cardFooter}>
                <Text style={styles.cardChip}>{item.frequency}</Text>
                {!!item.categories?.length && (
                  <Text style={styles.cardChip}>
                    {item.categories.length} categoría{item.categories.length !== 1 ? 's' : ''}
                  </Text>
                )}
              </View>
            </View>
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
    backgroundColor: COLORS.bg,
  },
  loaderText: {
    marginTop: 10,
    color: COLORS.textSecondary,
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.bg,
  },
  headerArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 1,
  },
  dateBadge: {
    backgroundColor: COLORS.accentLight,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginLeft: 10,
  },
  dateBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accentDark,
    textTransform: 'capitalize',
  },
  providersButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: COLORS.accentDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  providersButtonPressed: {
    backgroundColor: COLORS.accentDark,
  },
  providersButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingBottom: 16,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardAccent: {
    width: 5,
    backgroundColor: COLORS.accent,
  },
  cardBody: {
    flex: 1,
    padding: 14,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  cardText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  cardChip: {
    backgroundColor: COLORS.borderLight,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  emptyBox: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
