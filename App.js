import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Importando nossas telas
import Home from './src/screens/Home';
import Explorar from './src/screens/Explorar';
import Perfil from './src/screens/Perfil';     

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
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
    </NavigationContainer>
  );
}