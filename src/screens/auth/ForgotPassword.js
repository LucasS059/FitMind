import React, { useState, useContext } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createURL } from 'expo-linking';
import { supabase } from '../../services/supabase';
import { ThemeContext } from '../../contexts/ThemeContext';

const emailValido = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function ForgotPassword({ navigation }) {
  const { isDark, colors } = useContext(ThemeContext);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const enviarEmail = async () => {
    const emailLimpo = email.trim().toLowerCase();

    if (!emailLimpo) {
      Alert.alert('Atenção', 'Informe seu e-mail.');
      return;
    }
    if (!emailValido(emailLimpo)) {
      Alert.alert('E-mail inválido', 'Digite um endereço de e-mail válido.');
      return;
    }

    setLoading(true);
    try {
      const redirectUrl = createURL('reset-password');

      const { error } = await supabase.auth.resetPasswordForEmail(emailLimpo, {
        redirectTo: redirectUrl,
      });

      if (error) {
        Alert.alert('Erro', error.message);
      } else {
        Alert.alert('Sucesso', 'Verifique seu e-mail para recuperar a senha.');
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert('Erro', err?.message ?? 'Falha na conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Text style={[styles.title, { color: colors.text }]}>Recuperar Senha</Text>
        <Text style={[styles.subtitle, { color: colors.sub }]}>
          Enviaremos um link de recuperação para seu e-mail.
        </Text>

        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          placeholder="Seu e-mail"
          placeholderTextColor={colors.sub}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="emailAddress"
          returnKeyType="done"
          onSubmitEditing={enviarEmail}
          value={email}
          onChangeText={setEmail}
        />

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.accent, opacity: loading ? 0.6 : 1 }]}
          onPress={enviarEmail}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#FFF" />
            : <Text style={styles.btnText}>Enviar link</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Text style={[styles.backText, { color: colors.sub }]}>Voltar ao Login</Text>
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
  input: {
    height: 60,
    borderRadius: 18,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    fontSize: 16,
  },
  btn: {
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  backBtn: { marginTop: 24, alignItems: 'center' },
  backText: { fontSize: 14, fontWeight: '600' },
});