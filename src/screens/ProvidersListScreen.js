import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getProviders } from '../services/providerService';

export default function ProvidersListScreen({ navigation }) {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

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

  function formatDays(days = []) {
    if (!days.length) return 'Sin días cargados';
    return days.join(', ');
  }

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
      <Text style={styles.title}>Proveedores cargados</Text>
      <Text style={styles.subtitle}>Tocá uno para ver sus productos</Text>

      <FlatList
        data={providers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate('Provider', { provider: item })}
          >
            <View style={styles.topRow}>
              <Text style={styles.number}>{index + 1}</Text>
              <Text style={styles.name}>{item.name}</Text>
            </View>

            {!!item.alias?.length && (
              <Text style={styles.info}>Alias: {item.alias.join(', ')}</Text>
            )}

            <Text style={styles.info}>Días: {formatDays(item.days)}</Text>
            <Text style={styles.info}>
              Frecuencia: {item.frequency || 'No definida'}
            </Text>

            {!!item.categories?.length && (
              <Text style={styles.info}>
                Categorías: {item.categories.length}
              </Text>
            )}

            {item.isJoke && (
              <Text style={styles.joke}>Proveedor humorístico 😎</Text>
            )}
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  number: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#111827',
    color: '#fff',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontWeight: '700',
    marginRight: 10,
    overflow: 'hidden',
    paddingTop: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    flex: 1,
  },
  info: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 5,
  },
  joke: {
    marginTop: 6,
    color: '#7c3aed',
    fontWeight: '700',
  },
});