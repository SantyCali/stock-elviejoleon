import React from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function ProviderScreen({ route, navigation }) {
  const { provider } = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.title}>{provider.name}</Text>
        <Text style={styles.subtitle}>Día asignado: {provider.day}</Text>
      </View>

      <Text style={styles.sectionTitle}>Productos</Text>

      <FlatList
        data={provider.products}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 16 }}
        renderItem={({ item }) => (
          <View style={styles.productCard}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productText}>Stock actual: {item.stock}</Text>
            <Text style={styles.productText}>
              Sugerido último pedido: {item.suggested}
            </Text>
          </View>
        )}
      />

      <Pressable
        style={styles.button}
        onPress={() => navigation.navigate('NewOrder', { provider })}
      >
        <Text style={styles.buttonText}>Hacer pedido</Text>
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
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    color: '#6b7280',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  productText: {
    color: '#4b5563',
    marginBottom: 2,
  },
  button: {
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});