import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ProviderScreen from '../screens/ProviderScreen';
import NewOrderScreen from '../screens/NewOrderScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerTitleAlign: 'center',
          contentStyle: { backgroundColor: '#f6f7fb' },
        }}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: 'Ingresar' }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'El Viejo León' }}
        />
        <Stack.Screen
          name="Provider"
          component={ProviderScreen}
          options={{ title: 'Proveedor' }}
        />
        <Stack.Screen
          name="NewOrder"
          component={NewOrderScreen}
          options={{ title: 'Nuevo pedido' }}
        />
        <Stack.Screen
          name="OrderHistory"
          component={OrderHistoryScreen}
          options={{ title: 'Historial' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}