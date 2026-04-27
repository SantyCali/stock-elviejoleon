import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DrawerNavigator from './DrawerNavigator';
import ProvidersListScreen from '../screens/ProvidersListScreen';
import ProviderScreen from '../screens/ProviderScreen';
import StockScreen from '../screens/StockScreen';
import NewOrderScreen from '../screens/NewOrderScreen';
import AddProductScreen from '../screens/AddProductScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import ShareOrderScreen from '../screens/ShareOrderScreen';
import ProviderOrderHistoryScreen from '../screens/ProviderOrderHistoryScreen';
import { observeAuthState } from '../services/authService';
import { COLORS } from '../theme';

const Stack = createNativeStackNavigator();

function BackArrow({ navigation }) {
  return (
    <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
      <Text style={styles.backText}>‹</Text>
    </Pressable>
  );
}

export default function AppNavigator() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = observeAuthState((firebaseUser) => {
      setUser(firebaseUser);
      setCheckingAuth(false);
    });

    return unsubscribe;
  }, []);

  if (checkingAuth) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={({ navigation }) => ({
          headerTitleAlign: 'center',
          contentStyle: { backgroundColor: COLORS.bg },
          headerStyle: {
            backgroundColor: COLORS.card,
          },
          headerTitleStyle: {
            fontWeight: '800',
            color: COLORS.textPrimary,
          },
          headerBackVisible: false,
          headerLeft: () => <BackArrow navigation={navigation} />,
        })}
      >
        {!user ? (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ title: 'Crear cuenta' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Main"
              component={DrawerNavigator}
              options={{ headerShown: false }}
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    marginTop: 6,
  },
  backText: {
    fontSize: 30,
    lineHeight: 32,
    color: COLORS.textPrimary,
    fontWeight: '700',
    marginTop: -2,
  },
});