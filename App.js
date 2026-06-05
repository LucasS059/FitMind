import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { supabase } from './src/services/supabase';
import { ThemeProvider } from './src/contexts/ThemeContext';
import AppRoutes from './src/routes/AppRoutes';

export default function App() {
  const navigationRef = useNavigationContainerRef();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().finally(() => setReady(true));
  }, []);

  useEffect(() => {
    const handleDeepLink = async (url) => {
      if (!url) return;
      const params = parseAuthParams(url);
      if (!params?.accessToken) return;

      try {
        await supabase.auth.setSession({ access_token: params.accessToken, refresh_token: params.refreshToken });
        if (params.type === 'recovery' && navigationRef.isReady()) {
          navigationRef.navigate('AuthStack', { screen: 'ResetPassword' });
        }
      } catch (e) {}
    };

    const sub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
    Linking.getInitialURL().then(handleDeepLink).catch(() => {});
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

function parseAuthParams(url) {
  try {
    const q = Linking.parse(url)?.queryParams || {};
    if (q.access_token) return { accessToken: String(q.access_token), refreshToken: String(q.refresh_token), type: q.type || null };
    if (url.includes('#')) {
      const h = new URLSearchParams(url.split('#')[1] || '');
      if (h.get('access_token')) return { accessToken: h.get('access_token'), refreshToken: h.get('refresh_token'), type: h.get('type') };
    }
  } catch (e) {}
  return null;
}