import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Alert, LogBox } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { supabase } from './src/services/supabase';
import { ThemeProvider } from './src/contexts/ThemeContext';
import AppRoutes from './src/routes/AppRoutes';
import { recoveryState } from './src/services/authRecovery';

LogBox.ignoreLogs([
  'Network request failed',
  'AuthRetryableFetchError',
]);

const setSessionWithRetry = async (tokens, retries = 2) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const { error } = await supabase.auth.setSession(tokens);
    if (!error) return { error: null };

    const isNetworkError =
      error.name === 'AuthRetryableFetchError' || /network/i.test(error.message || '');

    if (!isNetworkError || attempt === retries) return { error };

    console.log(`[DeepLink] Falha de rede, tentando de novo (${attempt + 1}/${retries})...`);
    await new Promise((res) => setTimeout(res, 800 * (attempt + 1)));
  }
};

export default function App() {
  const navigationRef = useNavigationContainerRef();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().finally(() => setReady(true));
  }, []);

  useEffect(() => {
    const handleDeepLink = async (url) => {
      if (!url) return;
      console.log('[DeepLink] URL recebida:', url);

      const { params, errorCode } = QueryParams.getQueryParams(url);

      if (errorCode || params?.error) {
        console.warn('[DeepLink] Erro no link:', errorCode, params?.error_description);
        Alert.alert(
          'Link inválido ou expirado',
          (params?.error_description || '').replace(/\+/g, ' ') ||
            'Este link de redefinição de senha não é mais válido. Solicite um novo.'
        );
        return;
      }

      const { access_token, refresh_token, type } = params || {};
      if (!access_token) {
        console.log('[DeepLink] Sem access_token. Params recebidos:', params);
        return;
      }

      try {
        if (type === 'recovery') {
          recoveryState.isRecovering = true;
        }

        const { error } = await setSessionWithRetry({ access_token, refresh_token });
        if (error) throw error;

        setTimeout(() => {
          if (type === 'recovery' && navigationRef.isReady()) {
            navigationRef.navigate('ResetPasswordLogged');
          }
        }, 300);
      } catch (error) {
        recoveryState.isRecovering = false;
        console.warn('Erro ao processar Deep Link de autenticação:', error);
        Alert.alert('Erro', 'Não foi possível validar o link de recuperação. Solicite um novo.');
      }
    };

    const sub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
    Linking.getInitialURL().then(handleDeepLink).catch((err) => console.warn('Erro no URL Inicial:', err));

    return () => sub.remove();
  }, [navigationRef]);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B1120' }}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <NavigationContainer ref={navigationRef}>
        <AppRoutes />
      </NavigationContainer>
    </ThemeProvider>
  );
}