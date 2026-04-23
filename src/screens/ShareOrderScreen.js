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
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

function formatCreatedAt(createdAt) {
  if (!createdAt) return 'Sin fecha';

  if (typeof createdAt === 'string') {
    const date = new Date(createdAt);
    if (!isNaN(date.getTime())) {
      return date.toLocaleString('es-AR');
    }
    return createdAt;
  }

  if (createdAt?.toDate) {
    return createdAt.toDate().toLocaleString('es-AR');
  }

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
  const [sharingPdf, setSharingPdf] = useState(false);
  const [sharingText, setSharingText] = useState(false);

  const groupedItems = useMemo(() => {
    const groups = {};

    (order.items || []).forEach((item) => {
      const category = item.category?.trim() || 'Sin categoría';

      if (!groups[category]) {
        groups[category] = [];
      }

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
              <div style="
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 8px;
                color: #111827;
              ">
                ${escapeHtml(group.category)}
              </div>

              ${group.items
                .map(
                  (item) => `
                    <div style="
                      padding: 10px 12px;
                      border: 1px solid #e5e7eb;
                      border-radius: 10px;
                      margin-bottom: 8px;
                      background: #f9fafb;
                    ">
                      <div style="
                        font-size: 15px;
                        font-weight: bold;
                        margin-bottom: 4px;
                        color: #111827;
                      ">
                        ${escapeHtml(item.productName)}
                      </div>

                      <div style="
                        font-size: 14px;
                        color: #374151;
                      ">
                        Pedir: ${escapeHtml(item.pedir)}
                      </div>
                    </div>
                  `
                )
                .join('')}
            </div>
          `
        )
        .join('');

      const html = `
        <html>
          <head>
            <meta charset="utf-8" />
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 24px;
                color: #111827;
              }
              .brand {
                font-size: 14px;
                color: #6b7280;
                margin-bottom: 6px;
              }
              .title {
                font-size: 28px;
                font-weight: bold;
                margin-bottom: 6px;
              }
              .subtitle {
                font-size: 14px;
                color: #6b7280;
                margin-bottom: 4px;
              }
              .section-title {
                font-size: 20px;
                font-weight: bold;
                margin-top: 24px;
                margin-bottom: 14px;
              }
            </style>
          </head>
          <body>
            <div class="brand">El Viejo León</div>
            <div class="title">Pedido - ${escapeHtml(order.providerName)}</div>
            <div class="subtitle">Fecha: ${escapeHtml(
              formatCreatedAt(order.createdAt)
            )}</div>
            <div class="subtitle">Hecho por: ${escapeHtml(
              order.createdByName || 'Sin dato'
            )}</div>

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
        <Text style={styles.title}>Compartir pedido</Text>
        <Text style={styles.subtitle}>Proveedor: {order.providerName}</Text>
        <Text style={styles.subtitle}>
          Fecha: {formatCreatedAt(order.createdAt)}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Resumen del pedido</Text>

      <FlatList
        data={groupedItems}
        keyExtractor={(item) => item.category}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.categoryCard}>
            <Text style={styles.categoryTitle}>{item.category}</Text>

            {item.items.map((product) => (
              <View key={product.productId} style={styles.productCard}>
                <Text style={styles.productName}>{product.productName}</Text>
                <Text style={styles.orderText}>Pedir: {product.pedir}</Text>
              </View>
            ))}
          </View>
        )}
      />

      <View style={styles.buttonsBox}>
        <Pressable
          style={[styles.primaryButton, sharingPdf && styles.buttonDisabled]}
          onPress={handleSharePdf}
          disabled={sharingPdf}
        >
          <Text style={styles.primaryButtonText}>
            {sharingPdf ? 'Generando PDF...' : 'Compartir PDF'}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.whatsappButton, sharingText && styles.buttonDisabled]}
          onPress={handleShareText}
          disabled={sharingText}
        >
          <Text style={styles.whatsappButtonText}>
            {sharingText ? 'Abriendo...' : 'Compartir texto'}
          </Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
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
    backgroundColor: '#f6f7fb',
    padding: 16,
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
    fontSize: 14,
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
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },
  productCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  orderText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '700',
  },
  buttonsBox: {
    gap: 10,
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
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
  whatsappButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  secondaryButtonText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});