import React, { useState } from 'react';
import { 
  View, TextInput, Text, TouchableOpacity, StyleSheet, 
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { supabase } from '../services/supabase';
// icone de olho para mostrar/ocultar senha
import { MaterialCommunityIcons } from '@expo/vector-icons'; 

export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // controla se a senha está visível ou não
  const [showPassword, setShowPassword] = useState(false);

  const validateInputs = () => { 
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos obrigatórios', 'Por favor, preencha o e-mail e a senha.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('E-mail inválido', 'Por favor, insira um endereço válido.');
      return false;
    }
    if (password.length < 8) {
      Alert.alert('Senha muito curta', 'A senha deve ter pelo menos 8 caracteres.');
      return false;
    }
    return true; 
  };

  async function signInWithEmail() { 
    if (!validateInputs()) return;
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({ 
      email: email.trim(), 
      password 
    });
    
    if (error) Alert.alert('Erro ao entrar', error.message);
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.headerContainer}>
        <Text style={styles.title}>FitMind</Text>
        <Text style={styles.subtitle}>Entrar</Text>
      </View>

      <View style={styles.formContainer}> 
        {/* Campo de E-mail */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Seu e-mail"
            placeholderTextColor="#94A3B8"
            value={email}
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
          />
        </View>

        {/* campo de senha */}
        <View style={styles.inputWrapper}> 
          <TextInput
            style={styles.input}
            placeholder="Sua senha"
            placeholderTextColor="#94A3B8"
            value={password}
            secureTextEntry={!showPassword} // Inverte a segurança dependendo do estado
            onChangeText={setPassword}
          />
          <TouchableOpacity 
            style={styles.eyeIcon} 
            onPress={() => setShowPassword(!showPassword)} // Troca o estado ao clicar
          >
            <MaterialCommunityIcons 
              name={showPassword ? 'eye-off' : 'eye'} // Troca o ícone (olho aberto/fechado)
              size={24} 
              color="#94A3B8" 
            />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 20 }} /> /* Indicador de carregamento */
        ) : (
          <>
            <TouchableOpacity style={styles.primaryButton} onPress={signInWithEmail}> 
              <Text style={styles.primaryButtonText}>Entrar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={() => navigation.navigate('Cadastro')} 
            >
              <Text style={styles.secondaryButtonText}>Criar nova conta</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    justifyContent: 'flex-start',
    padding: 24,
    paddingTop: 120, 
  },
  headerContainer: {
    marginBottom: 30, 
    alignItems: 'center', 
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: -1,
    marginBottom: 120, 
  },
  subtitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row', // Alinha o texto e o ícone na mesma linha
    alignItems: 'center', // Centraliza verticalmente
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    flex: 1, // Faz o campo de texto ocupar todo o espaço possível
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 16,
    color: '#1E293B',
  },
  eyeIcon: {
    padding: 15, 
  },
  primaryButton: {
    backgroundColor: '#10B981',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryButtonText: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '600',
  },
});