import React, { useState, useContext } from 'react';
import {
  View, Text, StyleSheet, TextInput, Alert, ActivityIndicator,
  TouchableOpacity, StatusBar, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { ThemeContext } from '../contexts/ThemeContext';

export default function Login({ navigation }) {
  const { isDark } = useContext(ThemeContext);

  const [email, setEmail] = useState('lucas@fitmind.com');
  const [senha, setSenha] = useState('12345678');
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [loading, setLoading] = useState(false);

  const C = {
    bg:     isDark ? '#0B1120' : '#F8FAFC',
    card:   isDark ? '#1E293B' : '#FFFFFF',
    text:   isDark ? '#F1F5F9' : '#0F172A',
    sub:    isDark ? '#94A3B8' : '#64748B',
    accent: '#10B981',
    border: isDark ? '#334155' : '#E2E8F0',
  };

  const validarCredenciais = () => {
    if (!email.trim() || !senha) {
      Alert.alert('Atenção', 'Preencha o e-mail e a senha.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('E-mail inválido', 'Informe um e-mail válido.');
      return false;
    }
    if (senha.length < 8) {
      Alert.alert('Senha inválida', 'A senha deve ter pelo menos 8 caracteres.');
      return false;
    }
    return true;
  };

  const fazerLogin = async () => {
    if (!validarCredenciais()) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: senha,
    });
    setLoading(false);
    if (error) {
      const mensagem = error.message?.toLowerCase().includes('email')
        ? 'Verifique o e-mail e a senha.'
        : 'Não foi possível entrar. Tente novamente.';
      Alert.alert('Erro ao entrar', mensagem);
    } else {
      navigation.replace('MainTabs');
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />
      <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>

          <View style={styles.header}>
      
            <Text style={[styles.title, { color: C.text }]}>FitMind</Text>
          </View>

          <View style={styles.form}>
            <View style={[styles.inputWrap, { backgroundColor: C.card, borderColor: C.border }]}>
              <MaterialCommunityIcons name="email-outline" size={20} color={C.sub} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: C.text }]}
                placeholder="Seu e-mail"
                placeholderTextColor={C.sub}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={[styles.inputWrap, { backgroundColor: C.card, borderColor: C.border }]}>
              <MaterialCommunityIcons name="lock-outline" size={20} color={C.sub} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: C.text }]}
                placeholder="Sua senha"
                placeholderTextColor={C.sub}
                secureTextEntry={!senhaVisivel}
                value={senha}
                onChangeText={setSenha}
              />
              <TouchableOpacity onPress={() => setSenhaVisivel(!senhaVisivel)} style={{ padding: 8 }}>
                <MaterialCommunityIcons
                  name={senhaVisivel ? 'eye-off-outline' : 'eye-outline'}
                  size={20} color={C.sub}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: C.accent, opacity: loading ? 0.7 : 1 }]}
              activeOpacity={0.85}
              onPress={fazerLogin}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#FFF" />
                : <>
                    <Text style={styles.btnText}>Entrar</Text>
                  </>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Cadastro')}
              disabled={loading}
            >
              <Text style={[styles.secondaryText, { color: C.sub }]}>Criar nova conta</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('ForgotPassword')}
              disabled={loading}
            >
              <Text style={[styles.linkText, { color: C.accent }]}>Esqueci minha senha</Text>
            </TouchableOpacity>
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  header: { alignItems: 'center', marginBottom: 48 },
  logoCircle: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center', marginBottom: 20, elevation: 2 },
  title: { fontSize: 34, fontWeight: '900', letterSpacing: -1, marginBottom: 6 },
  subtitle: { fontSize: 16, fontWeight: '500' },
  form: { gap: 14 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 18, paddingHorizontal: 16, height: 60 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, fontWeight: '500' },
  btn: { flexDirection: 'row', height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 8, shadowColor: '#10B981', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { height: 6, width: 0 }, elevation: 6 },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  secondaryBtn: { alignItems: 'center', marginTop: 12 },
  secondaryText: { fontSize: 14, fontWeight: '600' },
  linkBtn: { alignItems: 'center', marginTop: 10 },
  linkText: { fontSize: 14, fontWeight: '700' },
});