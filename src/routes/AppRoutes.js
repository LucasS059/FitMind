import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ThemeProvider } from '../contexts/ThemeContext'; 

import Login from '../screens/Login';
import Cadastro from '../screens/Cadastro';
import ForgotPassword from '../screens/ForgotPassword';
import ResetPassword from '../screens/ResetPassword';
import MainBottomTabs from './MainBottomTabs'; 
import Tracking from '../screens/Tracking';
import Dicas from '../screens/Dicas';
import Perfil from '../screens/Perfil';
import ModalidadeDetalhe from '../screens/ModalidadeDetalhe';

const Stack = createNativeStackNavigator();

export default function AppRoutes() {
  return (
    <ThemeProvider> 
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Cadastro" component={Cadastro} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        <Stack.Screen name="ResetPassword" component={ResetPassword} />
        <Stack.Screen name="MainTabs" component={MainBottomTabs} />
        <Stack.Screen name="Tracking" component={Tracking} />
        <Stack.Screen name="Dicas" component={Dicas} />
        <Stack.Screen name="Perfil" component={Perfil} />
        <Stack.Screen name="ModalidadeDetalhe" component={ModalidadeDetalhe} />
      </Stack.Navigator>
    </ThemeProvider>
  );
}