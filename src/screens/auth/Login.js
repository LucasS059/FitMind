import React, { useState, useContext } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, StatusBar 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase';
import { ThemeContext } from '../../contexts/ThemeContext';

export default function Login({ navigation }) {
  const { isDark } = useContext(ThemeContext);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const C = {
    bg:     isDark ? '#0B1120' : '#F8FAFC',
    card:   isDark ? '#1E293B' : '#FFFFFF',
    text:   isDark ? '#F1F5F9' : '#0F172A',
    sub:    isDark ? '#94A3B8' : '#64748B',
    accent: '#10B981',
    border: isDark ? '#334155' : '#E2E8F0',
  };

  const fazerLogin = async () => {
    if (!email.trim() || !senha.trim()) {
      Alert.alert('Atenção', 'Preencha e-mail e senha.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: senha,
      });

      if (error) {
        Alert.alert('Erro', error.message === 'Invalid login credentials' 
          ? 'E-mail ou senha incorretos.' 
          : error.message);
      }
    } catch (err) {
      Alert.alert('Erro', 'Falha na conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView 
        style={styles.content} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Text style={[styles.title, { color: C.text }]}>FitMind</Text>
        
        <View style={styles.form}>
          <TextInput 
            style={[styles.input, { backgroundColor: C.card, color: C.text, borderColor: C.border }]}
            placeholder="Seu e-mail"
            placeholderTextColor={C.sub}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          
          <TextInput 
            style={[styles.input, { backgroundColor: C.card, color: C.text, borderColor: C.border }]}
            placeholder="Sua senha"
            placeholderTextColor={C.sub}
            secureTextEntry
            value={senha}
            onChangeText={setSenha}
          />

          <TouchableOpacity 
            style={[styles.btn, { backgroundColor: C.accent, opacity: loading ? 0.6 : 1 }]}
            onPress={fazerLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.btnText}>Entrar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={[styles.secondaryText, { color: C.sub }]}>Criar nova conta</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={[styles.linkText, { color: C.accent }]}>Esqueci minha senha</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 34, fontWeight: '900', textAlign: 'center', marginBottom: 48 },
  form: { gap: 14 },
  input: { height: 60, borderRadius: 18, paddingHorizontal: 16, borderWidth: 1, fontSize: 16 },
  btn: { height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  secondaryText: { textAlign: 'center', fontSize: 14, fontWeight: '600', marginTop: 12 },
  linkText: { textAlign: 'center', fontSize: 14, fontWeight: '700', marginTop: 10 },
});