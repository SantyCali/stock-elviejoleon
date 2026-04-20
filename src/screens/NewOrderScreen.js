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

export default function NewOrderScreen({ route }) {
  const { provider } = route.params;

  const initialItems = useMemo(() => {
    const flatProducts = [];

    (provider.categories || []).forEach((category) => {
      category.products.forEach((product, index) => {
        flatProducts.push({
          id: `${category.name}-${index}-${product}`,
          category: category.name,
          name: product,
          hay: '',
          debeHaber: '',
          pedir: '',
        });
      });
    });

    return flatProducts;
  }, [provider]);

  const [items, setItems] = useState(initialItems);

  function updateField(itemId, field, value) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  }

  function handleSaveOrder() {
    const loadedItems = items.filter(
      (item) => item.hay || item.debeHaber || item.pedir
    );

    Alert.alert(
      'Pedido guardado',
      `Se cargaron ${loadedItems.length} producto(s) para ${provider.name}.`
    );

    console.log('Pedido cargado:', {
      provider: provider.name,
      items: loadedItems,
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pedido - {provider.name}</Text>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.category}>{item.category}</Text>
            <Text style={styles.name}>{item.name}</Text>

            <View style={styles.inputsRow}>
              <View style={styles.inputBlock}>
                <Text style={styles.label}>Hay</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={item.hay}
                  onChangeText={(value) => updateField(item.id, 'hay', value)}
                />
              </View>

              <View style={styles.inputBlock}>
                <Text style={styles.label}>Debe haber</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={item.debeHaber}
                  onChangeText={(value) =>
                    updateField(item.id, 'debeHaber', value)
                  }
                />
              </View>

              <View style={styles.inputBlock}>
                <Text style={styles.label}>Pedir</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={item.pedir}
                  onChangeText={(value) => updateField(item.id, 'pedir', value)}
                />
              </View>
            </View>
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
  inputsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inputBlock: {
    flex: 1,
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