import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
} from '@react-navigation/drawer';

import HomeScreen from '../screens/HomeScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import {
  getCurrentUser,
  getUserProfile,
  signOutUser,
} from '../services/authService';
import { COLORS } from '../theme';

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) return;

      const userProfile = await getUserProfile(currentUser.uid);
      setProfile(userProfile);
    } catch (error) {
      console.log('Error cargando perfil:', error);
    }
  }

  async function handleLogout() {
    try {
      await signOutUser();
    } catch (error) {
      console.log('Error cerrando sesión:', error);
      Alert.alert('Error', 'No se pudo cerrar sesión.');
    }
  }

  function formatRole(role) {
    if (role === 'jefe') return 'Jefe';
    if (role === 'empleado') return 'Empleado';
    return 'Usuario';
  }

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.drawerContainer}
    >
      <View>
        <View style={styles.headerBox}>
          <Text style={styles.brandEmoji}>🦁</Text>
          <Text style={styles.headerTitle}>El Viejo León</Text>
          <Text style={styles.headerSubtitle}>Menú principal</Text>

          {!!profile && (
            <View style={styles.userBox}>
              <Text style={styles.userName}>
                {profile.name || 'Sin nombre'}
              </Text>

              {!!profile.username && (
                <Text style={styles.userMeta}>@{profile.username}</Text>
              )}

              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{formatRole(profile.role)}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.menuSection}>
          <Pressable
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            onPress={() => props.navigation.navigate('Inicio')}
          >
            <Text style={styles.itemIcon}>🏠</Text>
            <Text style={styles.itemText}>Inicio</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            onPress={() => props.navigation.navigate('Historial')}
          >
            <Text style={styles.itemIcon}>📋</Text>
            <Text style={styles.itemText}>Historial</Text>
          </Pressable>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
      </Pressable>
    </DrawerContentScrollView>
  );
}

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="Inicio"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerTitleAlign: 'center',
        drawerPosition: 'left',
        drawerType: 'slide',
        sceneStyle: { backgroundColor: COLORS.bg },
        headerStyle: {
          backgroundColor: COLORS.card,
        },
        headerTitleStyle: {
          fontWeight: '800',
          color: COLORS.textPrimary,
        },
      }}
    >
      <Drawer.Screen
        name="Inicio"
        component={HomeScreen}
        options={{ title: 'El Viejo León' }}
      />
      <Drawer.Screen
        name="Historial"
        component={OrderHistoryScreen}
        options={{ title: 'Historial' }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  headerBox: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 22,
    marginBottom: 10,
  },
  brandEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 14,
  },
  userBox: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    padding: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 2,
  },
  userMeta: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  roleBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  menuSection: {
    paddingHorizontal: 10,
    paddingTop: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 6,
    borderRadius: 14,
    backgroundColor: COLORS.card,
  },
  itemPressed: {
    backgroundColor: COLORS.accentLight,
  },
  itemIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  itemText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  logoutButton: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: COLORS.textPrimary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutButtonPressed: {
    opacity: 0.8,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
