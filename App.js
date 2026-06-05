import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack'; 
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from './src/services/supabase';

import Home from './src/screens/Home';
import Explorar from './src/screens/Explorar';
import Perfil from './src/screens/Perfil';
import Login from './src/screens/Login';
import Cadastro from './src/screens/Cadastro';
import Dicas from './src/screens/Dicas';

// DECLARE AS VARIÁVEIS AQUI, FORA DAS FUNÇÕES
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator(); 
const HomeStack = createNativeStackNavigator();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Dashboard" component={Home} /> 
      <HomeStack.Screen name="AtividadeDetalhes" component={Dicas} />
    </HomeStack.Navigator>
  );
} 

export default function App() {
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

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E293B' }}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {session ? (
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: { backgroundColor: '#1E293B', borderTopWidth: 0, height: 65, paddingBottom: 10 },
            tabBarActiveTintColor: '#10B981',
            tabBarInactiveTintColor: '#94A3B8',
            tabBarIcon: ({ color, size }) => {
              let iconName;
              if (route.name === 'Início') iconName = 'home-variant';
              else if (route.name === 'Explorar') iconName = 'map-marker-radius';
              else if (route.name === 'Perfil') iconName = 'account-circle';
              return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Inicio" component={HomeStackNavigator} />
          <Tab.Screen name="Explorar" component={Explorar} />
          <Tab.Screen name="Perfil" component={Perfil} />
        </Tab.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Cadastro" component={Cadastro} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}