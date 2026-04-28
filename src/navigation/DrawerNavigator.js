import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
} from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import ProvidersListScreen from '../screens/ProvidersListScreen';
import ProviderScreen from '../screens/ProviderScreen';
import StockScreen from '../screens/StockScreen';
import NewOrderScreen from '../screens/NewOrderScreen';
import AddProductScreen from '../screens/AddProductScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import ShareOrderScreen from '../screens/ShareOrderScreen';
import ProviderOrderHistoryScreen from '../screens/ProviderOrderHistoryScreen';
import SendNotificationScreen from '../screens/SendNotificationScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';

import {
  getCurrentUser,
  getUserProfile,
  signOutUser,
} from '../services/authService';
import { COLORS } from '../theme';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

// ── Stack con todas las pantallas ────────────────────────────────────────────

function AppStack({ navigation: drawerNav }) {
  const openDrawer = () => drawerNav.openDrawer();

  return (
    <Stack.Navigator
      screenOptions={({ navigation }) => ({
        headerTitleAlign: 'center',
        contentStyle: { backgroundColor: COLORS.bg },
        headerStyle: { backgroundColor: COLORS.card },
        headerTitleStyle: { fontWeight: '800', color: COLORS.textPrimary },
        headerBackVisible: false,
        headerLeft: () =>
          navigation.canGoBack() ? (
            Platform.OS === 'ios' ? (
              <Pressable
                onPress={() => navigation.goBack()}
                style={({ pressed }) => [styles.backBtnIos, pressed && styles.backBtnIosPressed]}
              >
                <Text style={styles.backTextIos}>‹</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => navigation.goBack()}
                style={styles.backBtn}
              >
                <Text style={styles.backText}>‹</Text>
              </Pressable>
            )
          ) : null,
        headerRight: () =>
          Platform.OS === 'ios' ? (
            <Pressable
              onPress={openDrawer}
              style={({ pressed }) => [styles.menuBtnIos, pressed && styles.menuBtnIosPressed]}
            >
              <View style={styles.menuBtnIosInner}>
                <Ionicons name="menu-outline" size={20} color="#fff" />
              </View>
            </Pressable>
          ) : (
            <Pressable
              onPress={openDrawer}
              style={({ pressed }) => [styles.menuBtn, pressed && styles.menuBtnPressed]}
            >
              <Ionicons name="menu-outline" size={22} color="#fff" />
            </Pressable>
          ),
      })}
    >
        <Stack.Screen
          name="Inicio"
          component={HomeScreen}
          options={{ title: 'El Viejo León' }}
        />
        <Stack.Screen
          name="Historial"
          component={OrderHistoryScreen}
          options={{ title: 'Historial' }}
        />
        <Stack.Screen
          name="ProvidersList"
          component={ProvidersListScreen}
          options={{ title: 'Ver proveedores' }}
        />
        <Stack.Screen
          name="Provider"
          component={ProviderScreen}
          options={{ title: 'Proveedor' }}
        />
        <Stack.Screen
          name="AddProduct"
          component={AddProductScreen}
          options={{ title: 'Agregar artículo' }}
        />
        <Stack.Screen
          name="Stock"
          component={StockScreen}
          options={{ title: 'Cargar stock' }}
        />
        <Stack.Screen
          name="NewOrder"
          component={NewOrderScreen}
          options={{ title: 'Nuevo pedido' }}
        />
        <Stack.Screen
          name="OrderDetail"
          component={OrderDetailScreen}
          options={{ title: 'Detalle del pedido' }}
        />
        <Stack.Screen
          name="ShareOrder"
          component={ShareOrderScreen}
          options={{ title: 'Compartir pedido' }}
        />
        <Stack.Screen
          name="ProviderOrderHistory"
          component={ProviderOrderHistoryScreen}
          options={{ title: 'Últimos 5 pedidos' }}
        />
        <Stack.Screen
          name="SendNotification"
          component={SendNotificationScreen}
          options={{ title: 'Enviar notificación' }}
        />
        <Stack.Screen
          name="ChangePassword"
          component={ChangePasswordScreen}
          options={{ title: 'Cambiar contraseña' }}
        />
    </Stack.Navigator>
  );
}

// ── Contenido del drawer ──────────────────────────────────────────────────────

const SANTI_EMAIL = 'santipiedrabuena@gmail.com';

function CustomDrawerContent(props) {
  const [profile, setProfile] = useState(null);

  // Email is available synchronously — drawer only renders when user is authenticated
  const currentUserEmail = getCurrentUser()?.email || '';
  const isSanti = currentUserEmail === SANTI_EMAIL;

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

  function goTo(screen) {
    props.navigation.navigate('App', { screen });
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
            onPress={() => goTo('Inicio')}
          >
            <Text style={styles.itemIcon}>🏠</Text>
            <Text style={styles.itemText}>Inicio</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            onPress={() => goTo('Historial')}
          >
            <Text style={styles.itemIcon}>📋</Text>
            <Text style={styles.itemText}>Historial</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            onPress={() => goTo('ChangePassword')}
          >
            <Text style={styles.itemIcon}>🔑</Text>
            <Text style={styles.itemText}>Cambiar contraseña</Text>
          </Pressable>

          {isSanti && (
            <Pressable
              style={({ pressed }) => [styles.item, styles.itemNotif, pressed && styles.itemNotifPressed]}
              onPress={() => goTo('SendNotification')}
            >
              <Text style={styles.itemIcon}>📣</Text>
              <Text style={styles.itemText}>Enviar notificación</Text>
            </Pressable>
          )}
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

// ── DrawerNavigator ───────────────────────────────────────────────────────────

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerPosition: 'right',
        drawerType: 'slide',
        sceneStyle: { backgroundColor: COLORS.bg },
      }}
    >
      <Drawer.Screen name="App" component={AppStack} />
    </Drawer.Navigator>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Back button — Android
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    marginTop: 4,
  },
  backText: {
    fontSize: 30,
    lineHeight: 32,
    color: COLORS.textPrimary,
    fontWeight: '700',
    marginTop: -2,
  },

  // Back button — iOS liquid glass
  backBtnIos: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(120,120,128,0.12)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 14,
  },
  backBtnIosPressed: {
    backgroundColor: 'rgba(120,120,128,0.22)',
  },
  backTextIos: {
    fontSize: 28,
    color: COLORS.accent,
    fontWeight: '300',
    lineHeight: 36,
    textAlign: 'center',
    width: 36,
    marginTop: -1,
  },

  // Menu button — Android
  menuBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  menuBtnPressed: {
    backgroundColor: COLORS.accentDark,
  },

  // Menu button — iOS liquid glass (naranja con brillo)
  menuBtnIos: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.accent,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
  },
  menuBtnIosPressed: {
    backgroundColor: COLORS.accentDark,
  },
  menuBtnIosInner: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Drawer content
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
  itemNotif: {
    backgroundColor: COLORS.accentLight,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
  },
  itemNotifPressed: {
    backgroundColor: COLORS.accent,
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
