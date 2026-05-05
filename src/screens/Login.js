import React, { useState } from 'react';
import { 
  View, TextInput, Text, TouchableOpacity, StyleSheet, 
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { supabase } from '../services/supabase';

// Recebe a propriedade 'navigation' para podermos trocar de tela
export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validateInputs = () => { //Validação dos campos de email e senha
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos obrigatórios', 'Por favor, preencha o e-mail e a senha.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('E-mail inválido', 'Por favor, insira um endereço válido.');
      return false;
    }
    // Senha com mínimo de 8 caracteres
    if (password.length < 8) {
      Alert.alert('Senha muito curta', 'A senha deve ter pelo menos 8 caracteres.');
      return false;
    }
    return true; 
  };

  async function signInWithEmail() { 
    if (!validateInputs()) return;
    setLoading(true);
    const { error } = await supabase.login.signInWithPassword({ 
      email: email.trim(), 
      password 
    });
    if (error) Alert.alert('Erro ao entrar', error.message);
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView // Evita que o teclado cubra os campos de input
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.headerContainer}>
        <Text style={styles.title}>FitMind</Text>
        <Text style={styles.subtitle}>Entrar</Text>
      </View>

      {/* Formulário de login */}
      <View style={styles.formContainer}> 
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

        <View style={styles.inputWrapper}> //Campo de senha
          <TextInput
            style={styles.input}
            placeholder="Sua senha"
            placeholderTextColor="#94A3B8"
            value={password}
            secureTextEntry
            onChangeText={setPassword}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 20 }} /> //Indicador de carregamento
        ) : (
          <>
            <TouchableOpacity style={styles.primaryButton} onPress={signInWithEmail}> 
              <Text style={styles.primaryButtonText}>Entrar</Text>
            </TouchableOpacity>

            <TouchableOpacity //Botão para navegar para a tela de Cadastro
              style={styles.secondaryButton} 
              onPress={() => navigation.navigate('Cadastro')} //Navega para a tela de Cadastro
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
    justifyContent: 'flex-start', // No topo
    padding: 24,
    paddingTop: 120, //Distância da barra de status
  },
  headerContainer: {
    marginBottom: 30, // Distância entre o header e o formulário
    alignItems: 'center', // Centralizado
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: -1,
    marginBottom: 120, // Espaço entre o título e o subtítulo
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
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 16,
    color: '#1E293B',
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