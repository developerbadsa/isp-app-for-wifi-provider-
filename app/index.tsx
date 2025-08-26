import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAppStore } from '../src/store';
import { WelcomeScreen } from '../src/screens/WelcomeScreen';

export default function Index() {
  const { isAuthenticated, user } = useAppStore();
  
  if (isAuthenticated && user) {
    if (user.role === 'customer') {
      return <Redirect href="/(customer)" />;
    } else if (user.role === 'admin') {
      return <Redirect href="/(admin)" />;
    }
  }
  
  return <WelcomeScreen />;
}