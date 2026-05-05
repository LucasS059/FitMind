import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ThemeContext } from '../contexts/ThemeContext';

import Home from '../screens/Home';
import Explorar from '../screens/Explorar';
import Perfil from '../screens/Perfil';

const Tab = createBottomTabNavigator();

export default function MainBottomTabs() {
  const { isDark } = useContext(ThemeContext);
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          borderTopColor: isDark ? '#334155' : '#E2E8F0',
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarActiveTintColor: '#10B981', 
        tabBarInactiveTintColor: isDark ? '#64748B' : '#94A3B8',
      }}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={Home} 
        options={{ tabBarLabel: 'Início', tabBarIcon: ({ color, size }) => (<MaterialCommunityIcons name="home-variant" color={color} size={size} />) }} 
      />
      <Tab.Screen 
        name="ExplorarTab" 
        component={Explorar} 
        options={{ tabBarLabel: 'Explorar', tabBarIcon: ({ color, size }) => (<MaterialCommunityIcons name="compass-outline" color={color} size={size} />) }} 
      />
      <Tab.Screen 
        name="PerfilTab" 
        component={Perfil} 
        options={{ tabBarLabel: 'Perfil', tabBarIcon: ({ color, size }) => (<MaterialCommunityIcons name="account-outline" color={color} size={size} />) }} 
      />
    </Tab.Navigator>
  );
}