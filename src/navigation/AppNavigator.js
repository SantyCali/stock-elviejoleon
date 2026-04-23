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
import { observeAuthState } from '../services/authService';
import AddProductScreen from '../screens/AddProductScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';

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
          contentStyle: { backgroundColor: '#f6f7fb' },
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTitleStyle: {
            fontWeight: '800',
            color: '#111827',
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
              name="OrderDetail"
              component={OrderDetailScreen}
              options={{ title: 'Detalle del pedido' }}
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
    backgroundColor: '#f6f7fb',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    marginTop: 6,
  },
  backText: {
    fontSize: 30,
    lineHeight: 32,
    color: '#111827',
    fontWeight: '700',
    marginTop: -2,
  },
});