import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import AppRoutes from './src/routes/AppRoutes';
import { supabase } from './src/services/supabase';

export default function App() {
  const navigationRef = useNavigationContainerRef();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // ... (seu useEffect e estado de carregamento permanecem iguais)
  useEffect(() => { 
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleDeepLink = async (url) => {
      if (!url) return;
      const params = parseAuthParams(url);
      if (!params?.accessToken || !params?.refreshToken) return;

      try {
        await supabase.auth.setSession({
          access_token: params.accessToken,
          refresh_token: params.refreshToken,
        });

        if (params.type === 'recovery' && navigationRef.isReady()) {
          navigationRef.navigate('ResetPassword');
        }
      } catch (error) {
        console.warn('Erro ao processar link de auth:', error.message);
      }
    };

    const onUrl = ({ url }) => handleDeepLink(url);
    const subscription = Linking.addEventListener('url', onUrl);

    Linking.getInitialURL().then(handleDeepLink).catch(() => undefined);

    return () => subscription.remove();
  }, [navigationRef]);

  const parseAuthParams = (url) => {
    try {
      const parsed = Linking.parse(url);
      const queryParams = parsed?.queryParams || {};

      if (queryParams.access_token && queryParams.refresh_token) {
        return {
          accessToken: String(queryParams.access_token),
          refreshToken: String(queryParams.refresh_token),
          type: queryParams.type ? String(queryParams.type) : null,
        };
      }

      if (url.includes('#')) {
        const hash = url.split('#')[1] || '';
        const hashParams = new URLSearchParams(hash);
        if (hashParams.get('access_token') && hashParams.get('refresh_token')) {
          return {
            accessToken: hashParams.get('access_token'),
            refreshToken: hashParams.get('refresh_token'),
            type: hashParams.get('type'),
          };
        }
      }
    } catch (error) {
      console.warn('Erro ao ler params do link:', error.message);
    }
    return null;
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E293B' }}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <AppRoutes />
    </NavigationContainer>
  );
}