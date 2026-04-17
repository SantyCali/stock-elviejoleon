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

  const totalProducts =
    provider.categories?.reduce(
      (acc, category) => acc + category.products.length,
      0
    ) || 0;

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.title}>{provider.name}</Text>

        {!!provider.alias?.length && (
          <Text style={styles.subtitle}>
            También figura como: {provider.alias.join(', ')}
          </Text>
        )}

        <Text style={styles.subtitle}>
          Días: {provider.days?.join(', ')}
        </Text>

        <Text style={styles.subtitle}>
          Total de productos: {totalProducts}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Categorías</Text>

      <FlatList
        data={provider.categories || []}
        keyExtractor={(item) => item.name}
        contentContainerStyle={{ paddingBottom: 16 }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              Este proveedor todavía no tiene productos cargados.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.categoryCard}>
            <Text style={styles.categoryTitle}>{item.name}</Text>
            <Text style={styles.categoryCount}>
              Productos: {item.products.length}
            </Text>
          </View>
        )}
      />

      <Pressable
        style={styles.button}
        onPress={() => navigation.navigate('NewOrder', { provider })}
      >
        <Text style={styles.buttonText}>Cargar stock y pedido</Text>
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
    marginBottom: 6,
  },
  subtitle: {
    color: '#6b7280',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  categoryCount: {
    color: '#4b5563',
  },
  emptyBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  emptyText: {
    color: '#4b5563',
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