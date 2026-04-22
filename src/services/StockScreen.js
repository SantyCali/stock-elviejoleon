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
import { createStockSnapshot } from '../services/stockService';
import { getCurrentUser, getUserProfile } from '../services/authService';

export default function StockScreen({ route, navigation }) {
  const { provider } = route.params;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  async function handleSaveStock() {
    try {
      setSaving(true);

      const currentUser = getCurrentUser();
      const profile = currentUser ? await getUserProfile(currentUser.uid) : null;

      const itemsToSave = products
        .filter((item) => item.hay.trim() !== '')
        .map((item) => ({
          productId: item.id,
          productName: item.name,
          category: item.category || '',
          hay: Number(item.hay),
        }));

      if (itemsToSave.length === 0) {
        Alert.alert('Ojo', 'Cargá al menos un stock antes de guardar.');
        return;
      }

      await createStockSnapshot({
        providerId: provider.id,
        providerName: provider.name,
        createdByUid: currentUser?.uid || null,
        createdByName: profile?.name || null,
        createdByUsername: profile?.username || null,
        items: itemsToSave,
      });

      Alert.alert('Listo', 'El stock se guardó correctamente.');
      navigation.goBack();
    } catch (error) {
      console.log('Error guardando stock:', error);
      Alert.alert('Error', 'No se pudo guardar el stock.');
    } finally {
      setSaving(false);
    }
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

      <Pressable
        style={[styles.button, saving && styles.buttonDisabled]}
        onPress={handleSaveStock}
        disabled={saving}
      >
        <Text style={styles.buttonText}>
          {saving ? 'Guardando...' : 'Guardar stock'}
        </Text>
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
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});