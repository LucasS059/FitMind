import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ThemeProvider } from '../contexts/ThemeContext'; 

import Login from '../screens/Login';
import MainBottomTabs from './MainBottomTabs'; 
import Tracking from '../screens/Tracking';

const Stack = createNativeStackNavigator();

export default function AppRoutes() {
  return (
    <ThemeProvider> 
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="MainTabs" component={MainBottomTabs} />
        <Stack.Screen name="Tracking" component={Tracking} />
      </Stack.Navigator>
    </ThemeProvider>
  );
}