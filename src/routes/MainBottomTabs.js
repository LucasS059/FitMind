import React, { useContext } from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeContext } from '../contexts/ThemeContext';

import Home from '../screens/app/Home';
import Explore from '../screens/app/Explore';
import Details from '../screens/app/Details';
import Profile from '../screens/app/Profile';

const Tab = createBottomTabNavigator();

export default function MainBottomTabs() {
  const { isDark } = useContext(ThemeContext);
  const C = {
    bg: isDark ? '#1E293B' : '#FFFFFF',
    border: isDark ? '#334155' : '#E2E8F0',
    active: '#10B981',
    inactive: '#64748B',
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.active,
        tabBarInactiveTintColor: C.inactive,
        tabBarStyle: {
          backgroundColor: C.bg,
          borderTopColor: C.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          height: Platform.OS === 'ios' ? 84 : 66,
        },
      }}
    >
      <Tab.Screen name="Home" component={Home} options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="home-outline" color={color} size={size} /> }} />
      <Tab.Screen name="Explore" component={Explore} options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="map-search-outline" color={color} size={size} /> }} />
      <Tab.Screen name="Details" component={Details} options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="basketball" color={color} size={size} /> }} />
      <Tab.Screen name="Profile" component={Profile} options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account-outline" color={color} size={size} /> }} />
    </Tab.Navigator>
  );
}