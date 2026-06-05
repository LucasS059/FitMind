import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainBottomTabs from './MainBottomTabs';
import Details from '../screens/app/Details';
import Tracking from '../screens/app/Tracking';
import Tips from '../screens/app/Tips';

const Stack = createNativeStackNavigator();

export default function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainBottomTabs} />
      <Stack.Screen name="Details" component={Details} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Tracking" component={Tracking} options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
      <Stack.Screen name="Tips" component={Tips} options={{ animation: 'slide_from_right' }} />
    </Stack.Navigator>
  );
}