import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { refreshPresenceNow, subscribePresence } from '../services/presenceService';
import { STALE_PRESENCE_MS } from '../config/storeLocation';
import { COLORS } from '../theme';

const STATUS_INFO = {
  presente: { label: 'Presente', color: COLORS.success, bg: '#ECFDF5', border: '#6EE7B7' },
  llegando: { label: 'Llegando', color: '#B45309', bg: '#FFFBEB', border: '#FCD34D' },
  ausente: { label: 'Ausente', color: COLORS.textSecondary, bg: COLORS.cardAlt, border: COLORS.border },
};

function formatRole(role) {
  if (role === 'jefe') return 'Jefe';
  if (role === 'empleado') return 'Empleado';
  return 'Usuario';
}

function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function minutesAgo(iso) {
  if (!iso) return null;
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}

function resolveStatus(person) {
  const lastSeenMinutes = minutesAgo(person.lastSeen);
  const isStale =
    lastSeenMinutes !== null && Date.now() - new Date(person.lastSeen).getTime() > STALE_PRESENCE_MS;

  if (isStale && person.status !== 'ausente') {
    return { status: 'ausente', stale: true, lastSeenMinutes };
  }
  return { status: person.status || 'ausente', stale: false, lastSeenMinutes };
}

export default function PresenceScreen() {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribePresence((data) => {
      setPeople(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function handleRefresh() {
    try {
      setRefreshing(true);
      await refreshPresenceNow();
    } catch (error) {
      console.log('Error actualizando presencia:', error);
      if (error?.message === 'LOCATION_SERVICES_DISABLED') {
        Alert.alert('Ubicación desactivada', 'Activá el GPS del celular e intentá de nuevo.');
      } else if (error?.message === 'LOCATION_TIMEOUT') {
        Alert.alert('No se pudo obtener tu ubicación', 'Probá salir a un lugar con mejor señal GPS e intentá de nuevo.');
      } else if (error?.message === 'PERMISSION_DENIED') {
        Alert.alert('Permiso necesario', 'Activá tu ubicación primero.');
      } else {
        Alert.alert('Error', 'No se pudo actualizar tu estado.');
      }
    } finally {
      setRefreshing(false);
    }
  }

  const presentCount = people.filter((p) => resolveStatus(p).status === 'presente').length;

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loaderText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={people}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryCount}>{presentCount}</Text>
              <Text style={styles.summaryLabel}>
                {presentCount === 1 ? 'persona presente' : 'personas presentes'} en el negocio
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [styles.refreshBox, pressed && styles.refreshBoxPressed]}
              onPress={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <ActivityIndicator size={16} color={COLORS.accent} />
              ) : (
                <Ionicons name="refresh-outline" size={16} color={COLORS.accent} />
              )}
              <Text style={styles.refreshText}>Actualizar mi estado ahora</Text>
            </Pressable>

            <Text style={styles.sectionLabel}>Personal</Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🧑‍🤝‍🧑</Text>
            <Text style={styles.emptyTitle}>Todavía no hay datos</Text>
            <Text style={styles.emptySubtitle}>
              Cuando alguien tenga la app instalada y la ubicación permitida va a aparecer acá.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const resolved = resolveStatus(item);
          const info = STATUS_INFO[resolved.status] || STATUS_INFO.ausente;

          return (
            <View style={[styles.card, { backgroundColor: info.bg, borderColor: info.border }]}>
              <View style={styles.cardTop}>
                <Text style={styles.cardName}>{item.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: info.color }]}>
                  <Text style={styles.statusBadgeText}>{info.label}</Text>
                </View>
              </View>
              <Text style={styles.cardRole}>{formatRole(item.role)}</Text>
              {resolved.status === 'presente' && !!item.since && (
                <Text style={styles.cardMeta}>Desde las {formatTime(item.since)}</Text>
              )}
              {resolved.status === 'llegando' && (
                <Text style={styles.cardMeta}>Llegó recién, confirmando...</Text>
              )}
              {resolved.status === 'ausente' && resolved.lastSeenMinutes !== null && (
                <Text style={styles.cardMeta}>
                  {resolved.lastSeenMinutes < 1
                    ? 'Visto recién'
                    : `Visto hace ${resolved.lastSeenMinutes} min`}
                </Text>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
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
    backgroundColor: COLORS.bg,
    padding: 16,
  },
  listContent: {
    paddingBottom: 30,
  },
  summaryBox: {
    backgroundColor: COLORS.accent,
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 14,
  },
  summaryCount: {
    fontSize: 40,
    fontWeight: '800',
    color: '#fff',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  refreshBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.accentLight,
    borderRadius: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  refreshBoxPressed: { backgroundColor: '#FDE9C4' },
  refreshText: {
    color: COLORS.accentDark,
    fontWeight: '700',
    fontSize: 13,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  emptyBox: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    marginTop: 16,
  },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardName: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  cardRole: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});
