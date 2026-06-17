import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainBottomTabs from './MainBottomTabs';
import Tracking from '../screens/app/Tracking';
import GuiasList from '../screens/app/GuiasList'; 
import GuiaDetalhe from '../screens/app/GuiaDetalhe';
import ResetPassword from '../screens/auth/ResetPassword';

const Stack = createNativeStackNavigator();

export default function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainBottomTabs} />
      <Stack.Screen name="Tracking" component={Tracking} options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
      <Stack.Screen name="GuiasList" component={GuiasList} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="GuiaDetalhe" component={GuiaDetalhe} />
      
      <Stack.Screen 
        name="ResetPasswordLogged" 
        component={ResetPassword} 
        options={{ 
          headerShown: true, 
          title: 'Definir Nova Senha',
          headerLeft: () => null, 
          gestureEnabled: false 
        }} 
      />
    </Stack.Navigator>
  );
}