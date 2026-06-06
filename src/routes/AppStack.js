import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainBottomTabs from './MainBottomTabs';
import History from '../screens/app/History';
import Tracking from '../screens/app/Tracking';
import Tips from '../screens/app/Tips';
import GuiasList from '../screens/app/GuiasList'; 
import GuiaDetalhe from '../screens/app/GuiaDetalhe';

const Stack = createNativeStackNavigator();

export default function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainBottomTabs} />
      <Stack.Screen name="History" component={History} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Tracking" component={Tracking} options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
      <Stack.Screen name="Tips" component={Tips} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="GuiasList" component={GuiasList} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="GuiaDetalhe" component={GuiaDetalhe} />
    </Stack.Navigator>
  );
}

