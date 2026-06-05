import React, { createContext, useState } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  const colors = {
    bg: isDark ? '#0B1120' : '#F8FAFC',
    card: isDark ? '#1E293B' : '#FFFFFF',
    text: isDark ? '#F1F5F9' : '#0F172A',
    sub: isDark ? '#94A3B8' : '#64748B',
    accent: '#10B981', // Verde principal
    aiPurple: isDark ? '#6366F1' : '#4F46E5', 
    border: isDark ? '#334155' : '#E2E8F0',
    divider: isDark ? '#334155' : '#F1F5F9',
  };

  return (
    <ThemeContext.Provider value={{ isDark, setIsDark, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};