import React, { createContext, useState } from 'react';
import { useColorScheme } from 'react-native';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemTheme = useColorScheme() === 'dark';
  const [isDark, setIsDark] = useState(systemTheme);

  return (
    <ThemeContext.Provider value={{ isDark, setIsDark }}>
      {children}
    </ThemeContext.Provider>
  );
};