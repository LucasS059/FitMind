import React, { useState, useContext } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, 
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, StatusBar 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase';
import { ThemeContext } from '../../contexts/ThemeContext';

export default function SignUp({ navigation }) {
  const { isDark, colors } = useContext(ThemeContext);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!nome.trim() || !email.trim() || !password) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Senha curta', 'Use pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { full_name: nome.trim() } },
      });

      if (error) {
        Alert.alert('Erro', error.message);
        return;
      }

      if (!data.session) {
        Alert.alert('Confirme seu e-mail', 'Conta criada! Verifique sua caixa de entrada para ativar.');
        navigation.navigate('Login');
      }
    } catch (err) {
      Alert.alert('Erro', 'Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: colors.text }]}>Criar Conta</Text>
          <Text style={[styles.subtitle, { color: colors.sub }]}>Comece sua jornada fitness agora</Text>

          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder="Nome completo"
            placeholderTextColor={colors.sub}
            value={nome}
            onChangeText={setNome}
            autoCapitalize="words"
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder="E-mail"
            placeholderTextColor={colors.sub}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder="Senha (mín. 6 caracteres)"
            placeholderTextColor={colors.sub}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.accent, opacity: loading ? 0.6 : 1 }]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Cadastrar</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={[styles.backText, { color: colors.sub }]}>Já tenho conta · Entrar</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 34, fontWeight: '900', marginBottom: 8 },
  subtitle: { fontSize: 15, fontWeight: '500', marginBottom: 36 },
  input: { height: 60, borderRadius: 18, paddingHorizontal: 16, marginBottom: 14, borderWidth: 1, fontSize: 16 },
  btn: { height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  backBtn: { marginTop: 24, alignItems: 'center' },
  backText: { fontSize: 14, fontWeight: '600' },
});