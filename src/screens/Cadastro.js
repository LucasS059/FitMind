import React, { useState } from 'react';
import { 
  View, TextInput, Text, TouchableOpacity, StyleSheet, 
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { supabase } from '../services/supabase';

// Recebe a propriedade 'navigation' para podermos trocar de tela
export default function Cadastro({ navigation }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validateInputs = () => { //Validação dos campos de nome, email, senha e confirmação
    if (!nome.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Campos obrigatórios', 'Por favor, preencha todos os campos.');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Senhas diferentes', 'A senha e a confirmação não coincidem.');
      return false;
    }
    if (password.length < 8) {
      Alert.alert('Senha muito curta', 'A senha deve ter pelo menos 8 caracteres.');
      return false;
    }
    return true;
  };

  async function handleSignUp() {
    if (!validateInputs()) return;
    setLoading(true);

    // Cria o usuário na Autenticação do Supabase
    // O Supabase permite passar metadados (como o nome) durante a criação
    const { data, error } = await supabase.auth.signUp({ 
      email: email.trim(), 
      password: password,
      options: {
        data: {
          nome: nome.trim(), // Salva o nome nos metadados do usuário
        }
      }
    });

    if (error) {
      Alert.alert('Erro no cadastro', error.message);
    } else {
      Alert.alert('Sucesso', 'Conta criada! Você já pode entrar.');
      navigation.goBack(); // Volta para a tela de Login automaticamente
    }
    
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Criar Conta</Text>
          <Text style={styles.subtitle}>Junte-se ao FitMind</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Seu nome"
              placeholderTextColor="#94A3B8"
              value={nome}
              autoCapitalize="words"
              onChangeText={setNome}
            />
          </View>

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

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Sua senha (mín. 8 caracteres)"
              placeholderTextColor="#94A3B8"
              value={password}
              secureTextEntry
              onChangeText={setPassword}
            />
          </View>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Confirme sua senha"
              placeholderTextColor="#94A3B8"
              value={confirmPassword}
              secureTextEntry
              onChangeText={setConfirmPassword}
            />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 20 }} />
          ) : (
            <>
              <TouchableOpacity style={styles.primaryButton} onPress={handleSignUp}>
                <Text style={styles.primaryButtonText}>Cadastrar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
                <Text style={styles.secondaryButtonText}>Voltar para o Login</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Reutilizando os mesmos estilos do Login.js para manter a identidade
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  headerContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
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