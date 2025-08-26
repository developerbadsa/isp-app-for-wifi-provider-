import { Stack } from 'expo-router';
import { useAppStore } from '../../src/store';

export default function AdminLayout() {
  const { user } = useAppStore();
  
  // Role guard - redirect if not admin
  if (user?.role !== 'admin') {
    return null; // This will be handled by the auth flow
  }
  
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="customers" />
      <Stack.Screen name="tickets" />
      <Stack.Screen name="invoices" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}