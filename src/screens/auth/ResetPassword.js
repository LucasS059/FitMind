import React, { useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  ActivityIndicator, StyleSheet, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase';
import { ThemeContext } from '../../contexts/ThemeContext';

export default function ResetPassword() {
  const { isDark } = useContext(ThemeContext);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const C = {
    bg:     isDark ? '#0B1120' : '#F8FAFC',
    card:   isDark ? '#1E293B' : '#FFFFFF',
    text:   isDark ? '#F1F5F9' : '#0F172A',
    sub:    isDark ? '#94A3B8' : '#64748B',
    accent: '#10B981',
    border: isDark ? '#334155' : '#E2E8F0',
  };

  const salvarSenha = async () => {
    if (!password || password.length < 6) {
      Alert.alert('Senha fraca', 'Use pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        Alert.alert('Erro', error.message);
        return;
      }

      Alert.alert('Senha alterada!', 'Faça login com sua nova senha.', [
        {
          text: 'OK',
          onPress: async () => {
            await supabase.auth.signOut();
          },
        },
      ]);
    } catch (err) {
      Alert.alert('Erro inesperado', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.content}>
        <Text style={[styles.title, { color: C.text }]}>Nova Senha</Text>
        <Text style={[styles.subtitle, { color: C.sub }]}>
          Escolha uma senha com pelo menos 6 caracteres.
        </Text>

        <TextInput
          style={[styles.input, { backgroundColor: C.card, color: C.text, borderColor: C.border }]}
          placeholder="Nova senha"
          placeholderTextColor={C.sub}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          returnKeyType="done"
          onSubmitEditing={salvarSenha}
        />

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: C.accent, opacity: loading ? 0.65 : 1 }]}
          onPress={salvarSenha}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.btnText}>Salvar senha</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 32, fontWeight: '900', marginBottom: 8, letterSpacing: -1 },
  subtitle: { fontSize: 15, fontWeight: '500', marginBottom: 32 },
  input: { height: 60, borderRadius: 18, paddingHorizontal: 16, borderWidth: 1, fontSize: 16, marginBottom: 16 },
  btn: { height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
});