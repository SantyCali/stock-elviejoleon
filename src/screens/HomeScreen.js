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

function normalizeDayName(day) {
  return String(day || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
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
        String(day || '')
          .toLowerCase()
          .trim()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
      );

      const normalizedToday = String(todayName || '')
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');


      return normalizedDays.includes(normalizedToday);
    });
  }, [providers, todayName]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loaderText}>Cargando proveedores...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pedidos del negocio</Text>
      <Text style={styles.subtitle}>Hoy es {todayLabel}</Text>

      <Pressable
        style={styles.providersButton}
        onPress={() => navigation.navigate('ProvidersList')}
      >
        <Text style={styles.providersButtonText}>Ver todos los proveedores</Text>
      </Pressable>

      <FlatList
        data={providersToday}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No hay proveedores para hoy</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate('Provider', { provider: item })}
          >
            <Text style={styles.cardTitle}>{item.name}</Text>

            {!!item.alias?.length && (
              <Text style={styles.cardText}>Alias: {item.alias.join(', ')}</Text>
            )}

            <Text style={styles.cardText}>
              Frecuencia: {item.frequency}
            </Text>

            <Text style={styles.cardText}>
              Categorías: {item.categories?.length || 0}
            </Text>
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
    padding: 16,
    backgroundColor: '#f6f7fb',
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
    textTransform: 'capitalize',
  },
  providersButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  providersButtonText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 15,
  },
  listContent: {
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  cardText: {
    color: '#4b5563',
    marginBottom: 3,
  },
  emptyBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  emptyTitle: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '700',
  },
});