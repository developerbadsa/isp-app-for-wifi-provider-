import { useState, useEffect, useRef } from 'react';
import { store } from '../utils/store';

type StoreState = ReturnType<typeof store.getState>;
type StoreActions = {
  login: typeof store.login;
  logout: typeof store.logout;
  setTheme: typeof store.setTheme;
  setLanguage: typeof store.setLanguage;
  setConnectionStatus: typeof store.setConnectionStatus;
  updateExpiryDate: typeof store.updateExpiryDate;
  initialize: typeof store.initialize;
};

const getStoreSnapshot = (): StoreState & StoreActions => ({
  ...store.getState(),
  login: store.login,
  logout: store.logout,
  setTheme: store.setTheme,
  setLanguage: store.setLanguage,
  setConnectionStatus: store.setConnectionStatus,
  updateExpiryDate: store.updateExpiryDate,
  initialize: store.initialize,
});

export function useAppStore(): StoreState & StoreActions;
export function useAppStore<T>(selector: (state: StoreState & StoreActions) => T): T;
export function useAppStore<T>(selector?: (state: StoreState & StoreActions) => T) {
  const selectorRef = useRef(selector);
  selectorRef.current = selector;
  
  const getSnapshot = () => {
    const snapshot = getStoreSnapshot();
    return selectorRef.current ? selectorRef.current(snapshot) : snapshot;
  };
  
  const [state, setState] = useState(getSnapshot);
  
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setState(getSnapshot());
    });
    return unsubscribe;
  }, []);
  
  return state;
}
