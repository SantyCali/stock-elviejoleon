import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

const MOCK_HISTORY = [
  {
    id: 'h1',
    provider: 'Sancor',
    date: '2026-04-10',
    summary: 'Leche entera x12, Yogur vainilla x10',
  },
  {
    id: 'h2',
    provider: 'Coca Cola',
    date: '2026-04-08',
    summary: 'Coca 2.25L x15, Sprite 2.25L x8',
  },
  {
    id: 'h3',
    provider: 'Serenísima',
    date: '2026-04-05',
    summary: 'Crema x5, Manteca x6',
  },
];

export default function OrderHistoryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Últimos pedidos</Text>

      <FlatList
        data={MOCK_HISTORY}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.provider}>{item.provider}</Text>
            <Text style={styles.date}>{item.date}</Text>
            <Text style={styles.summary}>{item.summary}</Text>
          </View>
        )}
      />
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
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  provider: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  date: {
    color: '#6b7280',
    marginBottom: 6,
  },
  summary: {
    color: '#374151',
    lineHeight: 20,
  },
});