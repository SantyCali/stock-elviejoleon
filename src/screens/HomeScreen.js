import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCachedProviders, subscribeProviders } from '../services/providerService';
import { warmProductsCache } from '../services/productService';
import { markOrderDoneToday } from '../services/orderService';
import {
  markOrderedLocally,
  subscribeTodayStatus,
} from '../services/todayStatusService';
import {
  cancelAllReminders,
  requestNotificationPermissions,
  scheduleOrderReminders,
} from '../services/notificationService';
import { savePushToken } from '../services/pushTokenService';
import { getCurrentUser } from '../services/authService';
import { getTodayLabel, getTodayName } from '../utils/dates';
import { COLORS } from '../theme';

function normalizeDayName(day) {
  return String(day || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export default function HomeScreen({ navigation }) {
  const [providers, setProviders] = useState(() => getCachedProviders() || []);
  const [providersReady, setProvidersReady] = useState(() => !!getCachedProviders());
  const [orderedIds, setOrderedIds] = useState(() => new Set());
  const [stockedIds, setStockedIds] = useState(() => new Set());
  const [statusReady, setStatusReady] = useState(false);
  const [bellVisible, setBellVisible] = useState(false);

  const todayName = getTodayName();
  const todayLabel = getTodayLabel();

  // ── Suscripciones en vivo (pintan de cache al instante) ─────────────────────

  useEffect(() => {
    // Empieza a traer el catálogo apenas se abre la app, no cuando se toca un
    // proveedor: así entrar a cualquiera ya no espera a la red.
    warmProductsCache();

    const unsubscribeProviders = subscribeProviders(
      (data) => {
        setProviders(data);
        setProvidersReady(true);
      },
      () => setProvidersReady(true)
    );

    const unsubscribeStatus = subscribeTodayStatus(({ ordered, stocked, ready }) => {
      setOrderedIds(ordered);
      setStockedIds(stocked);
      if (ready) setStatusReady(true);
    });

    return () => {
      unsubscribeProviders();
      unsubscribeStatus();
    };
  }, []);

  // Permisos y push token fuera del camino crítico: no bloquean el primer render.
  useEffect(() => {
    requestNotificationPermissions().then((granted) => {
      if (!granted) return;
      const currentUser = getCurrentUser();
      if (currentUser) savePushToken(currentUser.uid);
    });
  }, []);

  // ── Datos derivados ────────────────────────────────────────────────────────

  const providersToday = useMemo(() => {
    const todayNorm = normalizeDayName(todayName);
    return providers.filter((p) =>
      (p.days || []).map(normalizeDayName).includes(todayNorm)
    );
  }, [providers, todayName]);

  const todayStatus = useMemo(
    () =>
      providersToday.map((provider) => ({
        provider,
        done: orderedIds.has(provider.id),
      })),
    [providersToday, orderedIds]
  );

  const pendingStatus = useMemo(
    () => todayStatus.filter((s) => !s.done),
    [todayStatus]
  );

  const pendingCount = pendingStatus.length;

  // ── Recordatorios: solo se reprograman si cambió la lista de pendientes ────

  const lastReminderKey = useRef(null);

  useEffect(() => {
    if (!statusReady || !providersReady) return;

    const pendingNames = pendingStatus.map((s) => s.provider.name);
    const key = pendingNames.join('|');
    if (lastReminderKey.current === key) return;
    lastReminderKey.current = key;

    if (pendingNames.length > 0) {
      scheduleOrderReminders(pendingNames);
    } else {
      cancelAllReminders();
    }
  }, [pendingStatus, statusReady, providersReady]);

  function confirmMarkOrderDone(provider) {
    Alert.alert(
      'Pedido hecho',
      `¿Ya se hizo el pedido para ${provider.name}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí',
          onPress: () => handleMarkOrderDone(provider),
        },
      ]
    );
  }

  async function handleMarkOrderDone(provider) {
    // Pinta el verde al instante; Firestore confirma después.
    markOrderedLocally(provider.id);

    try {
      await markOrderDoneToday(provider);
    } catch (error) {
      console.log('Error marcando pedido como hecho:', error);
      Alert.alert('Error', 'No se pudo marcar el pedido como hecho.');
    }
  }

  // ── Actualizar header cuando cambia el conteo pendiente ────────────────────

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRight}>
          {/* Campana de notificaciones */}
          <Pressable
            onPress={() => openBellModal()}
            style={({ pressed }) => [
              styles.bellBtn,
              Platform.OS === 'ios' && styles.bellBtnIos,
              pressed && (Platform.OS === 'ios' ? styles.bellBtnIosPressed : styles.bellBtnPressed),
            ]}
          >
            <Ionicons
              name={pendingCount > 0 ? 'notifications' : 'notifications-outline'}
              size={20}
              color={Platform.OS === 'ios' ? COLORS.textPrimary : COLORS.textPrimary}
            />
            {pendingCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {pendingCount > 9 ? '9+' : pendingCount}
                </Text>
              </View>
            )}
          </Pressable>

          {/* Hamburguesa */}
          <Pressable
            onPress={() => navigation.getParent()?.openDrawer()}
            style={({ pressed }) => [
              styles.menuBtn,
              Platform.OS === 'ios' && styles.menuBtnIos,
              pressed && (Platform.OS === 'ios' ? styles.menuBtnIosPressed : styles.menuBtnPressed),
            ]}
          >
            <Ionicons name="menu-outline" size={22} color="#fff" />
          </Pressable>
        </View>
      ),
    });
  }, [pendingCount, navigation]);

  // ── Modal campana ──────────────────────────────────────────────────────────

  function openBellModal() {
    setBellVisible(true);
  }

  function closeBellModal() {
    setBellVisible(false);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!providersReady && providers.length === 0) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loaderText}>Cargando proveedores...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerArea}>
        <Text style={styles.title}>Pedidos del negocio</Text>
        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeText}>{todayLabel}</Text>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.providersButton,
          pressed && styles.providersButtonPressed,
        ]}
        onPress={() => navigation.navigate('ProvidersList')}
      >
        <Text style={styles.providersButtonText}>Ver todos los proveedores</Text>
      </Pressable>

      <Text style={styles.sectionLabel}>
        {providersToday.length > 0
          ? `${providersToday.length} proveedor${providersToday.length !== 1 ? 'es' : ''} hoy`
          : 'Proveedores de hoy'}
      </Text>

      <FlatList
        data={providersToday}
        keyExtractor={(item) => item.id}
        extraData={{ orderedIds, stockedIds, statusReady }}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No hay proveedores para hoy</Text>
            <Text style={styles.emptySubtitle}>
              Revisá la lista completa si necesitás hacer un pedido.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const done = statusReady ? orderedIds.has(item.id) : null;
          const stockLoaded = stockedIds.has(item.id);
          const showPink = stockLoaded && done !== true;
          return (
            <Pressable
              style={({ pressed }) => [
                styles.card,
                showPink && styles.cardStockBg,
                pressed && styles.cardPressed,
              ]}
              onPress={() => navigation.navigate('Provider', { provider: item })}
            >
              <View style={[
                styles.cardAccent,
                done === true && styles.cardAccentDone,
                showPink && styles.cardAccentStock,
              ]} />
              <View style={styles.cardBody}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  {done === true && (
                    <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                  )}
                  {showPink && (
                    <Ionicons name="cube-outline" size={18} color="#BE185D" />
                  )}
                  {done === false && !showPink && (
                    <Ionicons name="time-outline" size={18} color={COLORS.accent} />
                  )}
                </View>

                {!!item.alias?.length && (
                  <Text style={styles.cardText}>
                    También conocido como: {item.alias.join(', ')}
                  </Text>
                )}

                <View style={styles.cardFooter}>
                  <Text style={styles.cardChip}>{item.frequency}</Text>
                  {done === true && (
                    <Text style={[styles.cardChip, styles.cardChipDone]}>Pedido hecho ✓</Text>
                  )}
                  {showPink && (
                    <Text style={[styles.cardChip, styles.cardChipStock]}>Stock cargado</Text>
                  )}
                  {done === false && !showPink && (
                    <Text style={[styles.cardChip, styles.cardChipPending]}>Pedido pendiente</Text>
                  )}
                </View>
              </View>
            </Pressable>
          );
        }}
      />

      {/* ── Modal campana ────────────────────────────────────────────────── */}
      <Modal
        visible={bellVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeBellModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeBellModal}>
          <View style={styles.modalCard}>
            <Pressable onPress={() => {}}>
              {/* Header del modal */}
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Pedidos de hoy</Text>
                  <Text style={styles.modalSubtitle}>{todayLabel}</Text>
                </View>
                <Pressable
                  style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
                  onPress={closeBellModal}
                >
                  <Ionicons name="close" size={18} color={COLORS.textSecondary} />
                </Pressable>
              </View>

              {/* Lista */}
              <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {todayStatus.length === 0 ? (
                <View style={styles.modalEmpty}>
                  <Text style={styles.modalEmptyIcon}>📭</Text>
                  <Text style={styles.modalEmptyText}>No hay proveedores para hoy.</Text>
                </View>
              ) : pendingStatus.length === 0 ? (
                <View style={styles.modalEmpty}>
                  <Ionicons name="checkmark-circle" size={34} color="#16a34a" style={styles.modalEmptyIcon} />
                  <Text style={styles.modalEmptyText}>Todos los pedidos están hechos.</Text>
                </View>
              ) : (
                pendingStatus.map(({ provider }) => (
                  <Pressable
                    key={provider.id}
                    style={({ pressed }) => [
                      styles.modalItem,
                      pressed && styles.modalItemPressed,
                    ]}
                    onPress={() => {
                      closeBellModal();
                      setTimeout(() => navigation.navigate('Provider', { provider }), 180);
                    }}
                  >
                    <View style={styles.modalItemDot} />
                    <Text style={styles.modalItemName}>{provider.name}</Text>
                    <View style={styles.modalItemActions}>
                      <Ionicons name="time-outline" size={20} color={COLORS.accent} />
                      <Pressable
                        style={({ pressed }) => [
                          styles.markDoneBtn,
                          pressed && styles.markDoneBtnPressed,
                        ]}
                        onPress={(event) => {
                          event.stopPropagation?.();
                          confirmMarkOrderDone(provider);
                        }}
                        hitSlop={6}
                      >
                        <Ionicons name="checkmark" size={18} color="#16a34a" />
                      </Pressable>
                    </View>
                  </Pressable>
                ))
              )}
              </ScrollView>

              {/* Resumen */}
              {todayStatus.length > 0 && (
                <View style={styles.modalFooter}>
                  <Text style={styles.modalFooterText}>
                    {pendingCount === 0
                      ? '✅  Todos los pedidos están hechos'
                      : `🔔  ${pendingCount} pedido${pendingCount !== 1 ? 's' : ''} pendiente${pendingCount !== 1 ? 's' : ''}`}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  loaderText: {
    marginTop: 10,
    color: COLORS.textSecondary,
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.bg,
  },

  // ── Header de la pantalla ──────────────────────────────────────────────────
  headerArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 1,
  },
  dateBadge: {
    backgroundColor: COLORS.accentLight,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginLeft: 10,
  },
  dateBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accentDark,
    textTransform: 'capitalize',
  },

  // ── Botones del header de navegación ──────────────────────────────────────
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 14,
    marginTop: 4,
  },

  // Campana — Android
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBtnPressed: {
    backgroundColor: COLORS.accentLight,
  },

  // Campana — iOS
  bellBtnIos: {
    backgroundColor: 'rgba(120,120,128,0.12)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  bellBtnIosPressed: {
    backgroundColor: 'rgba(120,120,128,0.22)',
  },

  // Badge rojo
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: COLORS.card,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 12,
  },

  // Hamburguesa — Android
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBtnPressed: {
    backgroundColor: COLORS.accentDark,
  },

  // Hamburguesa — iOS
  menuBtnIos: {
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.45)',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
  },
  menuBtnIosPressed: {
    backgroundColor: COLORS.accentDark,
  },

  // ── Lista ──────────────────────────────────────────────────────────────────
  providersButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: COLORS.accentDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  providersButtonPressed: {
    backgroundColor: COLORS.accentDark,
  },
  providersButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingBottom: 120,
  },

  // Tarjeta proveedor
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardAccent: {
    width: 5,
    backgroundColor: COLORS.accent,
  },
  cardAccentDone: {
    backgroundColor: '#16a34a',
  },
  cardAccentStock: {
    backgroundColor: '#F472B6',
  },
  cardStockBg: {
    backgroundColor: '#FFF5FA',
  },
  cardBody: {
    flex: 1,
    padding: 14,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  cardText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  cardChip: {
    backgroundColor: COLORS.borderLight,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  cardChipDone: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
  },
  cardChipPending: {
    backgroundColor: COLORS.accentLight,
    color: COLORS.accentDark,
  },
  cardChipStock: {
    backgroundColor: '#FCE7F3',
    color: '#BE185D',
  },
  emptyBox: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Modal campana ──────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxHeight: '82%',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  modalList: {
    maxHeight: 360,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnPressed: {
    backgroundColor: COLORS.border,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: COLORS.cardAlt,
    borderRadius: 12,
    marginBottom: 8,
  },
  modalItemPressed: {
    opacity: 0.75,
  },
  modalItemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
  },
  modalItemDotDone: {
    backgroundColor: '#16a34a',
  },
  modalItemName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  markDoneBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markDoneBtnPressed: {
    backgroundColor: '#BBF7D0',
  },
  modalFooter: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    alignItems: 'center',
  },
  modalFooterText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  modalEmpty: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  modalEmptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  modalEmptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});
