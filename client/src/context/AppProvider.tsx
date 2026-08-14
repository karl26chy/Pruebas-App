import React from 'react';
import { AppContext } from './app-context';
import { useAppState } from '../hooks/useAppState';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = useAppState();
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
