import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { registerUser } from '../services/authService';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('empleado');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!name.trim() || !username.trim() || !email.trim() || !password.trim()) {
      Alert.alert(
        'Faltan datos',
        'Completá nombre, nombre de usuario, email y contraseña.'
      );
      return;
    }

    try {
      setLoading(true);

      await registerUser({
        name,
        username,
        email,
        password,
        role,
      });

      Alert.alert('Cuenta creada', 'La cuenta se creó correctamente.');
    } catch (error) {
      console.log(error);

      if (error.message === 'USERNAME_ALREADY_EXISTS') {
        Alert.alert('Error', 'Ese nombre de usuario ya existe.');
        return;
      }

      Alert.alert('Error', 'No se pudo crear la cuenta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Crear cuenta</Text>

        <TextInput
          placeholder="Nombre"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <TextInput
          placeholder="Nombre de usuario"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
          autoCapitalize="none"
        />

        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry
        />

        <Text style={styles.roleLabel}>Rol</Text>

        <View style={styles.roleRow}>
          <Pressable
            style={[
              styles.roleButton,
              role === 'empleado' && styles.roleButtonActive,
            ]}
            onPress={() => setRole('empleado')}
          >
            <Text
              style={[
                styles.roleButtonText,
                role === 'empleado' && styles.roleButtonTextActive,
              ]}
            >
              Empleado
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.roleButton,
              role === 'jefe' && styles.roleButtonActive,
            ]}
            onPress={() => setRole('jefe')}
          >
            <Text
              style={[
                styles.roleButtonText,
                role === 'jefe' && styles.roleButtonTextActive,
              ]}
            >
              Jefe
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Creando...' : 'Crear cuenta'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7fb',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    marginTop: 4,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  roleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  roleButtonText: {
    color: '#111827',
    fontWeight: '700',
  },
  roleButtonTextActive: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});