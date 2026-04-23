import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  createProduct,
  getCategoriesByProvider,
} from '../services/productAdminService';

export default function AddProductScreen({ route, navigation }) {
  const { provider } = route.params;

  const [name, setName] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCategories();
  }, [provider.id]);

  async function loadCategories() {
    try {
      setLoading(true);
      const data = await getCategoriesByProvider(provider.id);
      setCategories(data);
    } catch (error) {
      console.log('Error cargando categorías:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProduct() {
    if (!name.trim()) {
      Alert.alert('Falta dato', 'Escribí el nombre del artículo.');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Falta dato', 'Elegí una categoría.');
      return;
    }

    try {
      setSaving(true);

      await createProduct({
        providerId: provider.id,
        name,
        category: selectedCategory,
      });

      Alert.alert('Listo', 'El artículo se agregó correctamente.');
      navigation.goBack();
    } catch (error) {
      console.log('Error creando producto:', error);
      Alert.alert('Error', 'No se pudo agregar el artículo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Agregar artículo</Text>
      <Text style={styles.subtitle}>{provider.name}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Nombre del artículo</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Coca Zero 2.25"
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Elegí una categoría</Text>

        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="small" />
            <Text style={styles.loaderText}>Cargando categorías...</Text>
          </View>
        ) : categories.length === 0 ? (
          <Text style={styles.emptyText}>
            Este proveedor todavía no tiene categorías cargadas.
          </Text>
        ) : (
          <FlatList
            data={categories}
            keyExtractor={(item) => item}
            contentContainerStyle={{ paddingTop: 8 }}
            renderItem={({ item }) => {
              const selected = selectedCategory === item;

              return (
                <Pressable
                  style={[
                    styles.categoryButton,
                    selected && styles.categoryButtonActive,
                  ]}
                  onPress={() => setSelectedCategory(item)}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      selected && styles.categoryButtonTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            }}
          />
        )}
      </View>

      <Pressable
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSaveProduct}
        disabled={saving || loading || categories.length === 0}
      >
        <Text style={styles.saveButtonText}>
          {saving ? 'Guardando...' : 'Guardar artículo'}
        </Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7fb',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  loaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  loaderText: {
    marginLeft: 8,
    color: '#4b5563',
  },
  emptyText: {
    color: '#4b5563',
    marginTop: 8,
  },
  categoryButton: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  categoryButtonActive: {
    backgroundColor: '#dc2626',
    borderColor: '#111827',
  },
  categoryButtonText: {
    color: '#111827',
    fontWeight: '700',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 'auto',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});