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

              <Text style={styles.userRole}>
                Rol: {formatRole(profile.role)}
              </Text>
            </View>
          )}
        </View>

        <Pressable
          style={styles.item}
          onPress={() => props.navigation.navigate('Inicio')}
        >
          <Text style={styles.itemText}>Inicio</Text>
        </Pressable>

        <Pressable
          style={styles.item}
          onPress={() => props.navigation.navigate('Historial')}
        >
          <Text style={styles.itemText}>Historial</Text>
        </Pressable>
      </View>

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
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
        sceneStyle: { backgroundColor: '#f6f7fb' },
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTitleStyle: {
          fontWeight: '800',
          color: '#111827',
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
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 14,
  },
  userBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  userMeta: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  item: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginHorizontal: 10,
    marginBottom: 8,
    borderRadius: 14,
    backgroundColor: '#fff',
  },
  itemText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  logoutButton: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});