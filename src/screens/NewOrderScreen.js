import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function NewOrderScreen({ route, navigation }) {
  const { provider } = route.params;

  const initialItems = useMemo(() => {
    return provider.products.map((product) => ({
      ...product,
      quantity: String(product.suggested || 0),
    }));
  }, [provider.products]);

  const [items, setItems] = useState(initialItems);

  function updateQuantity(productId, value) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity: value } : item
      )
    );
  }

  function handleSaveOrder() {
    const summary = items
      .filter((item) => Number(item.quantity) > 0)
      .map((item) => `${item.name}: ${item.quantity}`)
      .join('\n');

    Alert.alert(
      'Pedido armado',
      summary || 'No cargaste cantidades todavía.'
    );

    navigation.goBack();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nuevo pedido - {provider.name}</Text>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.stock}>Stock actual: {item.stock}</Text>
            <Text style={styles.stock}>Sugerido: {item.suggested}</Text>

            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={item.quantity}
              onChangeText={(value) => updateQuantity(item.id, value)}
              placeholder="Cantidad a pedir"
            />
          </View>
        )}
      />

      <Pressable style={styles.button} onPress={handleSaveOrder}>
        <Text style={styles.buttonText}>Guardar pedido</Text>
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  stock: {
    color: '#4b5563',
    marginBottom: 4,
  },
  input: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
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