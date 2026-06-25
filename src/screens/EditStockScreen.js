import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { subscribeProductsByProvider } from '../services/productService';
import { updateStockSnapshot } from '../services/stockService';
import { COLORS } from '../theme';

function formatDate(createdAt) {
  if (!createdAt) return '';
  const date = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
  return date.toLocaleString('es-AR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function EditStockScreen({ route, navigation }) {
  const { stock } = route.params;

  const [items, setItems] = useState(() =>
    (stock.items || []).map((item) => ({ ...item }))
  );
  const [saving, setSaving] = useState(false);

  // Add modal
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [addQuantity, setAddQuantity] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeProductsByProvider(stock.providerId, (products) => {
      setAllProducts(products);
    });
    return unsubscribe;
  }, [stock.providerId]);

  // Products not yet in the snapshot
  const availableProducts = useMemo(() => {
    const usedIds = new Set(items.map((i) => i.productId).filter(Boolean));
    return allProducts.filter((p) => !usedIds.has(p.id));
  }, [allProducts, items]);

  // Items grouped by category for display
  const groupedItems = useMemo(() => {
    const groups = {};
    for (const item of items) {
      const cat = item.category || 'Sin categoría';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }
    return Object.keys(groups)
      .sort()
      .map((cat) => ({ category: cat, products: groups[cat] }));
  }, [items]);

  function updateItemHay(productId, value) {
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, hay: value } : item
      )
    );
  }

  function confirmRemove(productId, productName) {
    Alert.alert(
      'Sacar producto',
      `¿Sacás "${productName}" del stock?`,
      [
        { text: 'No', style: 'cancel' },
        { text: 'Sí, sacar', style: 'destructive', onPress: () => removeItem(productId) },
      ]
    );
  }

  function removeItem(productId) {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  }

  function openAddModal() {
    setSelectedProduct(null);
    setAddQuantity('');
    setAddModalVisible(true);
  }

  function confirmAdd() {
    if (!selectedProduct || !addQuantity.trim()) return;
    setItems((prev) => [
      ...prev,
      {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        category: selectedProduct.category || 'Sin categoría',
        hay: addQuantity.trim(),
      },
    ]);
    setAddModalVisible(false);
  }

  async function handleSave() {
    try {
      setSaving(true);
      await updateStockSnapshot(stock.id, items);
      Toast.show({
        type: 'success',
        text1: 'Stock actualizado',
        text2: `Los cambios de ${stock.providerName} se guardaron para todos.`,
        visibilityTime: 3000,
      });
      navigation.goBack();
    } catch (error) {
      console.log('Error actualizando stock:', error);
      Alert.alert('Error', 'No se pudieron guardar los cambios.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Info del stock */}
      <View style={styles.infoBox}>
        <View style={styles.infoRow}>
          <View style={styles.infoDot} />
          <Text style={styles.infoProvider}>{stock.providerName}</Text>
        </View>
        {!!stock.createdAt && (
          <Text style={styles.infoDate}>{formatDate(stock.createdAt)}</Text>
        )}
        {!!stock.createdByName && (
          <Text style={styles.infoBy}>Cargado por {stock.createdByName}</Text>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {groupedItems.map(({ category, products }) => (
          <View key={category} style={styles.group}>
            <Text style={styles.groupTitle}>{category}</Text>
            {products.map((item) => (
              <View key={item.productId} style={styles.row}>
                <Text style={styles.productName} numberOfLines={1}>
                  {item.productName}
                </Text>
                <View style={styles.hayBox}>
                  <Text style={styles.hayLabel}>HAY</Text>
                  <TextInput
                    style={styles.hayInput}
                    value={item.hay}
                    onChangeText={(v) => updateItemHay(item.productId, v)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                    selectTextOnFocus
                  />
                </View>
                <Pressable
                  style={({ pressed }) => [styles.removeBtn, pressed && styles.removeBtnPressed]}
                  onPress={() => confirmRemove(item.productId, item.productName)}
                >
                  <Ionicons name="close" size={14} color="#fff" />
                </Pressable>
              </View>
            ))}
          </View>
        ))}

        {items.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No hay productos. Agregá uno abajo.</Text>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
          onPress={openAddModal}
        >
          <Ionicons name="add-circle-outline" size={20} color="#BE185D" />
          <Text style={styles.addBtnText}>Agregar producto</Text>
        </Pressable>
      </ScrollView>

      {/* Botón guardar */}
      <View style={styles.saveContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.saveBtn,
            saving && styles.saveBtnDisabled,
            pressed && !saving && styles.saveBtnPressed,
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.saveBtnText}>Guardar cambios</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Modal agregar producto */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar producto</Text>
              <Pressable
                style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
                onPress={() => setAddModalVisible(false)}
              >
                <Ionicons name="close" size={18} color={COLORS.textSecondary} />
              </Pressable>
            </View>

            {availableProducts.length === 0 ? (
              <View style={styles.modalEmpty}>
                <Ionicons name="checkmark-circle" size={32} color={COLORS.success} style={{ marginBottom: 8 }} />
                <Text style={styles.modalEmptyText}>
                  Todos los productos ya están cargados en el stock.
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.modalLabel}>Seleccioná el producto</Text>
                <ScrollView
                  style={styles.productList}
                  showsVerticalScrollIndicator={false}
                >
                  {availableProducts.map((p) => (
                    <Pressable
                      key={p.id}
                      style={({ pressed }) => [
                        styles.productItem,
                        selectedProduct?.id === p.id && styles.productItemSelected,
                        pressed && styles.productItemPressed,
                      ]}
                      onPress={() => setSelectedProduct(p)}
                    >
                      <Text
                        style={[
                          styles.productItemText,
                          selectedProduct?.id === p.id && styles.productItemTextSelected,
                        ]}
                      >
                        {p.name}
                      </Text>
                      {!!p.category && (
                        <Text style={styles.productItemCat}>{p.category}</Text>
                      )}
                      {selectedProduct?.id === p.id && (
                        <Ionicons name="checkmark-circle" size={18} color="#BE185D" />
                      )}
                    </Pressable>
                  ))}
                </ScrollView>

                {!!selectedProduct && (
                  <View style={styles.quantityRow}>
                    <Text style={styles.modalLabel}>Cantidad (HAY)</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={addQuantity}
                      onChangeText={setAddQuantity}
                      placeholder="Ej: 5"
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="numeric"
                      autoFocus
                    />
                  </View>
                )}

                <Pressable
                  style={({ pressed }) => [
                    styles.modalConfirmBtn,
                    (!selectedProduct || !addQuantity.trim()) && styles.modalConfirmBtnDisabled,
                    pressed && selectedProduct && !!addQuantity.trim() && styles.modalConfirmBtnPressed,
                  ]}
                  onPress={confirmAdd}
                  disabled={!selectedProduct || !addQuantity.trim()}
                >
                  <Text style={styles.modalConfirmBtnText}>Agregar al stock</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.bg },

  // Info box
  infoBox: {
    backgroundColor: '#FFF5FA',
    borderBottomWidth: 1,
    borderBottomColor: '#FBCFE8',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  infoDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F472B6',
  },
  infoProvider: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  infoDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#BE185D',
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  infoBy: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },

  // Grupos de categoría
  group: {
    marginBottom: 18,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#BE185D',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingLeft: 4,
  },

  // Fila de producto
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FBCFE8',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
    gap: 8,
  },
  productName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  hayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hayLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  hayInput: {
    width: 56,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  removeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnPressed: { backgroundColor: '#b91c1c' },

  emptyBox: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#F472B6',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 4,
  },
  addBtnPressed: { backgroundColor: '#FFF5FA' },
  addBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#BE185D',
  },

  // Botón guardar
  saveContainer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  saveBtn: {
    backgroundColor: '#F472B6',
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#BE185D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  saveBtnPressed: { backgroundColor: '#EC4899' },
  saveBtnDisabled: { backgroundColor: COLORS.border, shadowOpacity: 0, elevation: 0 },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnPressed: { backgroundColor: COLORS.border },
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  productList: {
    maxHeight: 220,
    marginBottom: 12,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: COLORS.cardAlt,
    marginBottom: 6,
    gap: 8,
  },
  productItemSelected: {
    backgroundColor: '#FCE7F3',
    borderWidth: 1.5,
    borderColor: '#F472B6',
  },
  productItemPressed: { opacity: 0.75 },
  productItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  productItemTextSelected: { color: '#BE185D' },
  productItemCat: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  quantityRow: { marginBottom: 16 },
  modalInput: {
    backgroundColor: COLORS.cardAlt,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  modalConfirmBtn: {
    backgroundColor: '#F472B6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 20 : 4,
  },
  modalConfirmBtnPressed: { backgroundColor: '#EC4899' },
  modalConfirmBtnDisabled: { backgroundColor: COLORS.border },
  modalConfirmBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  modalEmpty: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  modalEmptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
