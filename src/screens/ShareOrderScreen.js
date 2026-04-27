import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { COLORS } from '../theme';

function formatCreatedAt(createdAt) {
  if (!createdAt) return 'Sin fecha';
  if (typeof createdAt === 'string') {
    const date = new Date(createdAt);
    if (!isNaN(date.getTime())) return date.toLocaleString('es-AR');
    return createdAt;
  }
  if (createdAt?.toDate) return createdAt.toDate().toLocaleString('es-AR');
  return 'Sin fecha';
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default function ShareOrderScreen({ route, navigation }) {
  const { order } = route.params;
  const insets = useSafeAreaInsets();
  const [sharingPdf, setSharingPdf] = useState(false);
  const [sharingText, setSharingText] = useState(false);

  const groupedItems = useMemo(() => {
    const groups = {};
    (order.items || []).forEach((item) => {
      const category = item.category?.trim() || 'Sin categoría';
      if (!groups[category]) groups[category] = [];
      groups[category].push(item);
    });
    return Object.keys(groups)
      .sort((a, b) => a.localeCompare(b))
      .map((category) => ({
        category,
        items: groups[category].sort((a, b) =>
          a.productName.localeCompare(b.productName)
        ),
      }));
  }, [order]);

  const whatsappText = useMemo(() => {
    const lines = [];
    lines.push(`*El Viejo León*`);
    lines.push(`*Pedido - ${order.providerName}*`);
    lines.push(`Fecha: ${formatCreatedAt(order.createdAt)}`);
    lines.push('');
    groupedItems.forEach((group) => {
      lines.push(`*${group.category}*`);
      group.items.forEach((item) => {
        lines.push(`- ${item.productName}: ${item.pedir}`);
      });
      lines.push('');
    });
    return lines.join('\n').trim();
  }, [groupedItems, order]);

  async function handleSharePdf() {
    try {
      setSharingPdf(true);

      const categoriesHtml = groupedItems
        .map(
          (group) => `
            <div style="margin-bottom: 18px;">
              <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #B45309; border-left: 4px solid #D97706; padding-left: 10px;">
                ${escapeHtml(group.category)}
              </div>
              ${group.items.map((item) => `
                <div style="padding: 10px 12px; border: 1px solid #FEF3C7; border-radius: 10px; margin-bottom: 8px; background: #FFFBEB; display: flex; justify-content: space-between; align-items: center;">
                  <div style="font-size: 14px; font-weight: 600; color: #111827;">${escapeHtml(item.productName)}</div>
                  <div style="font-size: 14px; font-weight: bold; color: #B45309; background: #FEF3C7; padding: 2px 10px; border-radius: 20px;">${escapeHtml(item.pedir)}</div>
                </div>
              `).join('')}
            </div>
          `
        )
        .join('');

      const html = `
        <html>
          <head>
            <meta charset="utf-8" />
            <style>
              body { font-family: Arial, sans-serif; padding: 24px; color: #111827; background: #fff; }
              .header { border-left: 5px solid #D97706; padding-left: 16px; margin-bottom: 24px; }
              .brand { font-size: 13px; color: #D97706; font-weight: bold; margin-bottom: 4px; }
              .title { font-size: 26px; font-weight: bold; margin-bottom: 4px; }
              .meta { font-size: 13px; color: #6B7280; margin-bottom: 2px; }
              .section-title { font-size: 18px; font-weight: bold; margin: 24px 0 14px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="brand">🦁 El Viejo León</div>
              <div class="title">Pedido — ${escapeHtml(order.providerName)}</div>
              <div class="meta">📅 ${escapeHtml(formatCreatedAt(order.createdAt))}</div>
              <div class="meta">👤 ${escapeHtml(order.createdByName || 'Sin dato')}</div>
            </div>
            <div class="section-title">Productos pedidos</div>
            ${categoriesHtml}
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      const canShare = await Sharing.isAvailableAsync();

      if (!canShare) {
        Alert.alert('Ojo', 'Este dispositivo no permite compartir archivos.');
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Pedido - ${order.providerName}`,
        UTI: 'com.adobe.pdf',
      });
    } catch (error) {
      console.log('Error compartiendo PDF:', error);
      Alert.alert('Error', 'No se pudo generar o compartir el PDF.');
    } finally {
      setSharingPdf(false);
    }
  }

  async function handleShareText() {
    try {
      setSharingText(true);
      await Share.share({
        message: whatsappText,
        title: `Pedido - ${order.providerName}`,
      });
    } catch (error) {
      console.log('Error compartiendo texto:', error);
      Alert.alert('Error', 'No se pudo compartir el texto.');
    } finally {
      setSharingText(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <View style={styles.headerAccentBar} />
        <View style={styles.headerContent}>
          <Text style={styles.title}>{order.providerName}</Text>
          <Text style={styles.subtitle}>📅 {formatCreatedAt(order.createdAt)}</Text>
          <View style={styles.itemCountBadge}>
            <Text style={styles.itemCountText}>
              {order.items?.length || 0} producto{(order.items?.length || 0) !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Resumen del pedido</Text>

      <FlatList
        data={groupedItems}
        keyExtractor={(item) => item.category}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryDot} />
              <Text style={styles.categoryTitle}>{item.category}</Text>
            </View>

            {item.items.map((product) => (
              <View key={product.productId} style={styles.productRow}>
                <Text style={styles.productName}>{product.productName}</Text>
                <View style={styles.orderBadge}>
                  <Text style={styles.orderBadgeText}>{product.pedir}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      />

      <View style={[styles.buttonsBox, { paddingBottom: insets.bottom }]}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            sharingPdf && styles.buttonDisabled,
            pressed && !sharingPdf && styles.primaryButtonPressed,
          ]}
          onPress={handleSharePdf}
          disabled={sharingPdf}
        >
          <Text style={styles.primaryButtonText}>
            {sharingPdf ? 'Generando PDF...' : '📄  Compartir PDF'}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.whatsappButton,
            sharingText && styles.buttonDisabled,
            pressed && !sharingText && styles.whatsappButtonPressed,
          ]}
          onPress={handleShareText}
          disabled={sharingText}
        >
          <Text style={styles.whatsappButtonText}>
            {sharingText ? 'Abriendo...' : '💬  Compartir texto'}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.secondaryButtonText}>Volver</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 16,
  },
  headerCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  headerAccentBar: {
    height: 5,
    backgroundColor: COLORS.accent,
  },
  headerContent: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  itemCountBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.accentLight,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  itemCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accentDark,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  listContent: {
    paddingBottom: 8,
  },
  categoryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    marginRight: 8,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textTransform: 'capitalize',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardAlt,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 6,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  orderBadge: {
    backgroundColor: COLORS.accentLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  orderBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.accentDark,
  },
  buttonsBox: {
    gap: 10,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: COLORS.accentDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonPressed: {
    backgroundColor: COLORS.accentDark,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  whatsappButton: {
    backgroundColor: '#16a34a',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  whatsappButtonPressed: {
    backgroundColor: '#15803d',
  },
  whatsappButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  secondaryButtonPressed: {
    backgroundColor: COLORS.cardAlt,
  },
  secondaryButtonText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
