import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useAppStore } from '../src/store';

export default function RootLayout() {
  const { initialize, isAuthenticated, user } = useAppStore();
  
  useEffect(() => {
    initialize();
  }, []);
  
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth/customer" />
      <Stack.Screen name="auth/admin" />
      <Stack.Screen name="(customer)" />
      <Stack.Screen name="(admin)" />
    </Stack>
  );
}