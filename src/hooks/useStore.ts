import { useState, useEffect } from 'react';
import { store } from '../utils/store';

export const useAppStore = () => {
  const [state, setState] = useState(store.getState());
  
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setState(store.getState());
    });
    return unsubscribe;
  }, []);
  
  return {
    ...state,
    login: store.login,
    logout: store.logout,
    setTheme: store.setTheme,
    setLanguage: store.setLanguage,
    setConnectionStatus: store.setConnectionStatus,
    updateExpiryDate: store.updateExpiryDate,
    initialize: store.initialize,
  };
};