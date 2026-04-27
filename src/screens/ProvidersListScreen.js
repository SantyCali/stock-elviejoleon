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
import { COLORS } from '../theme';

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
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loaderText}>Cargando proveedores...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerArea}>
        <Text style={styles.title}>Proveedores</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{providers.length}</Text>
        </View>
      </View>
      <Text style={styles.subtitle}>Tocá uno para ver sus productos</Text>

      <FlatList
        data={providers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => navigation.navigate('Provider', { provider: item })}
          >
            <View style={styles.cardAccent} />
            <View style={styles.cardBody}>
              <View style={styles.topRow}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberText}>{index + 1}</Text>
                </View>
                <Text style={styles.name}>{item.name}</Text>
              </View>

              {!!item.alias?.length && (
                <Text style={styles.info}>
                  También conocido como: {item.alias.join(', ')}
                </Text>
              )}

              <Text style={styles.info}>📅 {formatDays(item.days)}</Text>

              <View style={styles.chipRow}>
                {!!(item.frequency) && (
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>{item.frequency}</Text>
                  </View>
                )}
                {!!item.categories?.length && (
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>
                      {item.categories.length} categoría{item.categories.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
              </View>

              {item.isJoke && (
                <Text style={styles.joke}>Proveedor humorístico 😎</Text>
              )}
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
    backgroundColor: COLORS.bg,
    padding: 16,
  },
  headerArea: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 1,
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
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 20,
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  numberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  numberText: {
    fontWeight: '800',
    fontSize: 13,
    color: COLORS.accentDark,
  },
  name: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 1,
  },
  info: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 5,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    backgroundColor: COLORS.borderLight,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  joke: {
    marginTop: 6,
    color: '#7c3aed',
    fontWeight: '700',
  },
});
