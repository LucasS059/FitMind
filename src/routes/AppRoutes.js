import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { supabase } from '../services/supabase';
import AuthStack from './AuthStack';
import AppStack from './AppStack';
import { recoveryState } from '../services/authRecovery';

export default function AppRoutes() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B1120' }}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (!session) return <AuthStack />;

  return <AppStack initialRouteName={recoveryState.isRecovering ? 'ResetPasswordLogged' : undefined} />;
}