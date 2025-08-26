// Fix for zustand import issue - create store without external dependency
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole, ConnectionStatus, Language } from '../types';

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  
  // UI
  theme: 'light' | 'dark';
  language: Language;
  
  // Data
  connectionStatus: ConnectionStatus;
  expiryDate: string;
}

class SimpleStore {
  private state: AppState = {
    user: null,
    isAuthenticated: false,
    theme: 'light',
    language: 'en',
    connectionStatus: 'connected',
    expiryDate: '2024-02-15',
  };
  
  private listeners: Array<() => void> = [];
  
  getState = () => this.state;
  
  setState = (updater: Partial<AppState> | ((state: AppState) => Partial<AppState>)) => {
    const updates = typeof updater === 'function' ? updater(this.state) : updater;
    this.state = { ...this.state, ...updates };
    this.listeners.forEach(listener => listener());
  };
  
  subscribe = (listener: () => void) => {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) this.listeners.splice(index, 1);
    };
  };
  
  login = (user: User) => {
    this.setState({ user, isAuthenticated: true });
  };
  
  logout = () => {
    this.setState({ user: null, isAuthenticated: false });
  };
  
  setTheme = async (theme: 'light' | 'dark') => {
    this.setState({ theme });
    await AsyncStorage.setItem('theme', theme);
  };
  
  setLanguage = async (language: Language) => {
    this.setState({ language });
    await AsyncStorage.setItem('language', language);
  };
  
  setConnectionStatus = (status: ConnectionStatus) => {
    this.setState({ connectionStatus: status });
  };
  
  updateExpiryDate = (date: string) => {
    this.setState({ expiryDate: date });
  };
  
  initialize = async () => {
    try {
      const [theme, language] = await Promise.all([
        AsyncStorage.getItem('theme'),
        AsyncStorage.getItem('language'),
      ]);
      
      this.setState({
        theme: (theme as 'light' | 'dark') || 'light',
        language: (language as Language) || 'en',
      });
    } catch (error) {
      console.error('Failed to initialize app state:', error);
    }
  };
}

export const store = new SimpleStore();