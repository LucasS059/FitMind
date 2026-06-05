import React, { useState, useContext } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, 
  StyleSheet, KeyboardAvoidingView, Platform, StatusBar 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { supabase } from '../../services/supabase';
import { ThemeContext } from '../../contexts/ThemeContext';

export default function ForgotPassword({ navigation }) {
  const { isDark } = useContext(ThemeContext);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const C = {
    bg:     isDark ? '#0B1120' : '#F8FAFC',
    card:   isDark ? '#1E293B' : '#FFFFFF',
    text:   isDark ? '#F1F5F9' : '#0F172A',
    sub:    isDark ? '#94A3B8' : '#64748B',
    accent: '#10B981',
    border: isDark ? '#334155' : '#E2E8F0',
  };

  const enviarEmail = async () => {
    if (!email.trim()) {
      Alert.alert('Atenção', 'Informe seu e-mail.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { 
        redirectTo: Linking.createURL('reset-password') 
      });

      if (error) {
        Alert.alert('Erro', error.message);
      } else {
        Alert.alert('Sucesso', 'Verifique seu e-mail para recuperar a senha.');
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert('Erro', 'Falha na conexão.');
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
        <Text style={[styles.title, { color: C.text }]}>Recuperar Senha</Text>
        <Text style={[styles.subtitle, { color: C.sub }]}>
          Enviaremos um link de recuperação para seu e-mail.
        </Text>

        <TextInput 
          style={[styles.input, { backgroundColor: C.card, color: C.text, borderColor: C.border }]}
          placeholder="Seu e-mail"
          placeholderTextColor={C.sub}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: C.accent, opacity: loading ? 0.6 : 1 }]}
          onPress={enviarEmail}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.btnText}>Enviar link</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: C.sub }]}>Voltar ao Login</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 30, fontWeight: '900', marginBottom: 8 },
  subtitle: { fontSize: 15, fontWeight: '500', marginBottom: 32 },
  input: { height: 60, borderRadius: 18, paddingHorizontal: 16, marginBottom: 16, borderWidth: 1, fontSize: 16 },
  btn: { height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  backBtn: { marginTop: 24, alignItems: 'center' },
  backText: { fontSize: 14, fontWeight: '600' },
});