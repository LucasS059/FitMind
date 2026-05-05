import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack'; 
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from './src/services/supabase';

// Telas logadas
import Home from './src/screens/Home';
import Explorar from './src/screens/Explorar';
import Perfil from './src/screens/Perfil';

// Telas não logadas
import Login from './src/screens/Login';
import Cadastro from './src/screens/Cadastro';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator(); 

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { //Verifica se o usuário já estava logado ao abrir o app
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);  //O array vazio garante que isso rode apenas uma vez, quando o app inicia

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E293B' }}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {session && session.user ? (
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: { 
              backgroundColor: '#1E293B', 
              borderTopWidth: 0,
              height: 65,
              paddingBottom: 10
            },
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
          <Tab.Screen name="Início" component={Home} />
          <Tab.Screen name="Explorar" component={Explorar} />
          <Tab.Screen name="Perfil" component={Perfil} />
        </Tab.Navigator>
      ) : (
        /* Pilha de autenticação */
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Cadastro" component={Cadastro} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}