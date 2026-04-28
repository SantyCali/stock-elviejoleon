import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DrawerNavigator from './DrawerNavigator';
import { observeAuthState } from '../services/authService';
import { savePushToken } from '../services/pushTokenService';
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
      if (firebaseUser) {
        savePushToken(firebaseUser.uid);
      }
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
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={({ navigation }) => ({
                headerShown: true,
                title: 'Crear cuenta',
                headerTitleAlign: 'center',
                headerStyle: { backgroundColor: COLORS.card },
                headerTitleStyle: { fontWeight: '800', color: COLORS.textPrimary },
                headerBackVisible: false,
                headerLeft: () => <BackArrow navigation={navigation} />,
              })}
            />
          </>
        ) : (
          <Stack.Screen name="Main" component={DrawerNavigator} />
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
  },
  backText: {
    fontSize: 30,
    lineHeight: 32,
    color: COLORS.textPrimary,
    fontWeight: '700',
    marginTop: -2,
  },
});
