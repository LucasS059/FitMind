import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import * as Linking from 'expo-linking';

export default function ForgotPassword({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const enviarEmail = async () => {
    const emailTrim = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrim)) {
      Alert.alert('E-mail invalido', 'Informe um e-mail valido.');
      return;
    }

    setLoading(true);
    const redirectTo = Linking.createURL('reset-password');

    const { error } = await supabase.auth.resetPasswordForEmail(emailTrim, { redirectTo });
    setLoading(false);

    if (error) {
      Alert.alert('Erro', 'Nao foi possivel enviar o e-mail.');
      return;
    }

    Alert.alert('Verifique seu e-mail', 'Enviamos um link para redefinir sua senha.');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Text style={styles.title}>Recuperar senha</Text>
        <Text style={styles.subtitle}>Informe o e-mail da sua conta.</Text>

        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder="Seu e-mail"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <TouchableOpacity
          style={[styles.btn, { opacity: loading ? 0.7 : 1 }]}
          activeOpacity={0.85}
          onPress={enviarEmail}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Enviar link</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.linkText}>Voltar</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 26, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#64748B', marginBottom: 24 },
  inputWrap: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#E2E8F0' },
  input: { height: 56, paddingHorizontal: 16, fontSize: 16, color: '#0F172A' },
  btn: { height: 56, borderRadius: 18, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  linkBtn: { alignItems: 'center', marginTop: 16 },
  linkText: { color: '#64748B', fontSize: 14, fontWeight: '600' },
});
