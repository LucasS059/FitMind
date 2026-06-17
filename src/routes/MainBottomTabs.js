import React, { useContext } from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeContext } from '../contexts/ThemeContext';

import Home from '../screens/app/Home';
import Explore from '../screens/app/Explore';
import History from '../screens/app/History';
import Profile from '../screens/app/Profile';
import Tips from '../screens/app/Tips';

const Tab = createBottomTabNavigator();

export default function MainBottomTabs() {
  const { isDark, colors } = useContext(ThemeContext);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.sub,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          height: Platform.OS === 'ios' ? 84 : 66,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={Home}
        options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="home-outline" color={color} size={size} /> }}
      />

      <Tab.Screen
        name="Explore"
        component={Explore}
        options={{ tabBarLabel: 'Explorar', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="map-search-outline" color={color} size={size} /> }}
      />

      <Tab.Screen
        name="History"
        component={History}
        options={{ tabBarLabel: 'Histórico', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="history" color={color} size={size} /> }}
      />

      <Tab.Screen
        name="Tips"
        component={Tips}
        options={{ tabBarLabel: 'Dicas', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="lightbulb-on-outline" color={color} size={size} /> }}
      />

      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{ tabBarLabel: 'Perfil', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account-outline" color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}