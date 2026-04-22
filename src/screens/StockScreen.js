import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { getProductsByProvider } from '../services/productService';

export default function StockScreen({ route }) {
  const { provider } = route.params;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      const data = await getProductsByProvider(provider.id);

      const formatted = data.map((item) => ({
        ...item,
        hay: '',
      }));

      setProducts(formatted);
    } catch (error) {
      console.log('Error cargando productos para stock:', error);
    } finally {
      setLoading(false);
    }
  }

  function updateHay(productId, value) {
    setProducts((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, hay: value } : item
      )
    );
  }

  function handleSaveStock() {
    const loadedItems = products.filter((item) => item.hay.trim() !== '');

    Alert.alert(
      'Stock cargado',
      `Se cargaron ${loadedItems.length} producto(s) de ${provider.name}.`
    );

    console.log('STOCK CARGADO:', {
      providerId: provider.id,
      providerName: provider.name,
      items: loadedItems,
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cargar stock - {provider.name}</Text>

      {loading ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" />
          <Text style={styles.loaderText}>Cargando productos...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.category}>{item.category}</Text>
              <Text style={styles.name}>{item.name}</Text>

              <View style={styles.inputBlock}>
                <Text style={styles.label}>Hay</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={item.hay}
                  onChangeText={(value) => updateHay(item.id, value)}
                />
              </View>
            </View>
          )}
        />
      )}

      <Pressable style={styles.button} onPress={handleSaveStock}>
        <Text style={styles.buttonText}>Guardar stock</Text>
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
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  loaderBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    color: '#4b5563',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  category: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  inputBlock: {
    width: '100%',
  },
  label: {
    fontSize: 12,
    color: '#4b5563',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#fff',
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