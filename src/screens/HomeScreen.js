import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getProviders } from '../services/providerService';
import { hasOrderToday } from '../services/orderService';
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
  const [providers, setProviders] = useState([]);
  const [todayStatus, setTodayStatus] = useState([]); // [{ provider, done }]
  const [loading, setLoading] = useState(true);
  const [bellVisible, setBellVisible] = useState(false);

  const todayName = getTodayName();
  const todayLabel = getTodayLabel();

  // Animación del modal de campana
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // ── Cargar datos y actualizar notificaciones ────────────────────────────────

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    try {
      setLoading(true);
      const granted = await requestNotificationPermissions();
      if (granted) {
        const currentUser = getCurrentUser();
        if (currentUser) savePushToken(currentUser.uid);
      }

      const data = await getProviders();
      setProviders(data);

      const todayNorm = normalizeDayName(todayName);
      const providersToday = data.filter((p) =>
        (p.days || []).map(normalizeDayName).includes(todayNorm)
      );

      const statusList = await Promise.all(
        providersToday.map(async (provider) => ({
          provider,
          done: await hasOrderToday(provider.id),
        }))
      );

      setTodayStatus(statusList);

      const pending = statusList.filter((s) => !s.done);
      if (pending.length > 0) {
        await scheduleOrderReminders(pending.map((s) => s.provider.name));
      } else {
        await cancelAllReminders();
      }
    } catch (error) {
      console.log('Error cargando proveedores:', error);
    } finally {
      setLoading(false);
    }
  }

  // ── Actualizar header cuando cambia el conteo pendiente ────────────────────

  const pendingCount = useMemo(
    () => todayStatus.filter((s) => !s.done).length,
    [todayStatus]
  );

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
    scaleAnim.setValue(0.88);
    opacityAnim.setValue(0);
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 130, friction: 8 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start();
  }

  function closeBellModal() {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0.88, duration: 130, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 130, useNativeDriver: true }),
    ]).start(() => setBellVisible(false));
  }

  // ── Datos derivados ────────────────────────────────────────────────────────

  const providersToday = useMemo(() => {
    const todayNorm = normalizeDayName(todayName);
    return providers.filter((p) =>
      (p.days || []).map(normalizeDayName).includes(todayNorm)
    );
  }, [providers, todayName]);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
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
        extraData={todayStatus}
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
          const status = todayStatus.find((s) => s.provider.id === item.id);
          const done = status?.done ?? null;
          return (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => navigation.navigate('Provider', { provider: item })}
            >
              <View style={[styles.cardAccent, done === true && styles.cardAccentDone]} />
              <View style={styles.cardBody}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  {done === true && (
                    <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                  )}
                  {done === false && (
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
                  {done === false && (
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
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeBellModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeBellModal}>
          <Animated.View
            style={[
              styles.modalCard,
              { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
            ]}
          >
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
              {todayStatus.length === 0 ? (
                <View style={styles.modalEmpty}>
                  <Text style={styles.modalEmptyIcon}>📭</Text>
                  <Text style={styles.modalEmptyText}>No hay proveedores para hoy.</Text>
                </View>
              ) : (
                todayStatus.map(({ provider, done }) => (
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
                    <View style={[styles.modalItemDot, done && styles.modalItemDotDone]} />
                    <Text style={styles.modalItemName}>{provider.name}</Text>
                    <Ionicons
                      name={done ? 'checkmark-circle' : 'time-outline'}
                      size={20}
                      color={done ? '#16a34a' : COLORS.accent}
                    />
                  </Pressable>
                ))
              )}

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
          </Animated.View>
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
    paddingBottom: 16,
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
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
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
