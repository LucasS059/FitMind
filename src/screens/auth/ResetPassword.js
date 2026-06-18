import React, { useState, useContext, useEffect } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase';
import { ThemeContext } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { recoveryState } from '../../services/authRecovery';


export default function ResetPassword() {
  const { isDark, colors } = useContext(ThemeContext);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const backAction = () => {
      Alert.alert('Atenção', 'Você precisa definir uma nova senha para continuar.');
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  const salvarSenha = async () => {
    if (!password || password.length < 6) {
      Alert.alert('Senha fraca', 'Use pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Atenção', 'As senhas não coincidem. Verifique e tente novamente.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        Alert.alert('Erro', error.message);
        return;
      }

      Alert.alert('Sucesso!', 'Sua senha foi alterada com segurança.', [
        {
          text: 'Fazer Login',
          onPress: async () => {
            recoveryState.isRecovering = false;
            await supabase.auth.signOut();
          },
        },
      ]);
    } catch (err) {
      Alert.alert('Erro inesperado', err?.message ?? 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Text style={[styles.title, { color: colors.text }]}>Nova Senha</Text>
        <Text style={[styles.subtitle, { color: colors.sub }]}>
          Escolha uma senha com pelo menos 6 caracteres.
        </Text>

        <View style={styles.inputWrapper}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                color: colors.text,
                borderColor: colors.border,
                flex: 1,
              },
            ]}
            placeholder="Digite a nova senha"
            placeholderTextColor={colors.sub}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            returnKeyType="next"
          />
          <TouchableOpacity
            style={[styles.eyeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowPassword(v => !v)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={colors.sub}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                color: colors.text,
                borderColor: colors.border,
                flex: 1,
              },
            ]}
            placeholder="Confirme a nova senha"
            placeholderTextColor={colors.sub}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirm}
            returnKeyType="done"
            onSubmitEditing={salvarSenha}
          />
          <TouchableOpacity
            style={[styles.eyeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowConfirm(v => !v)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={colors.sub}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.accent, opacity: loading ? 0.65 : 1 }]}
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 32, fontWeight: '900', marginBottom: 8, letterSpacing: -1 },
  subtitle: { fontSize: 15, fontWeight: '500', marginBottom: 32 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  input: {
    height: 60,
    borderRadius: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    fontSize: 16,
  },
  eyeBtn: {
    width: 60,
    height: 60,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btn: {
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
});