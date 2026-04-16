import React, { useMemo } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MOCK_PROVIDERS } from '../utils/constants';
import { getTodayLabel, getTodayName } from '../utils/dates';

export default function HomeScreen({ navigation }) {
  const todayName = getTodayName();
  const todayLabel = getTodayLabel();

  const providersToday = useMemo(() => {
    return MOCK_PROVIDERS.filter((provider) => provider.day === todayName);
  }, [todayName]);

  const providersToShow =
    providersToday.length > 0 ? providersToday : MOCK_PROVIDERS;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pedidos del negocio</Text>
      <Text style={styles.subtitle}>Hoy es {todayLabel}</Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Proveedores del día</Text>
        <Text style={styles.infoText}>
          {providersToday.length > 0
            ? providersToday.map((p) => p.name).join(', ')
            : 'No hay proveedores asignados para hoy, te muestro todos.'}
        </Text>
      </View>

      <FlatList
        data={providersToShow}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate('Provider', { provider: item })}
          >
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardText}>Día: {item.day}</Text>
            <Text style={styles.cardText}>
              Productos cargados: {item.products.length}
            </Text>
          </Pressable>
        )}
      />

      <Pressable
        style={styles.historyButton}
        onPress={() => navigation.navigate('OrderHistory')}
      >
        <Text style={styles.historyButtonText}>Ver historial de pedidos</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
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
  infoBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    color: '#111827',
  },
  infoText: {
    color: '#4b5563',
    lineHeight: 20,
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
    marginBottom: 2,
  },
  historyButton: {
    backgroundColor: '#111827',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  historyButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});