import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../src/store';
import { lightTheme, darkTheme } from '../../src/utils/theme';
import { translations } from '../../src/utils/i18n';

export default function CustomerLayout() {
  const { theme, language } = useAppStore();
  const colors = theme === 'light' ? lightTheme : darkTheme;
  const t = translations[language];
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.colors.primary,
        tabBarInactiveTintColor: colors.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.colors.background,
          borderTopColor: colors.colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.home,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="packages"
        options={{
          title: t.packages,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wifi-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="support"
        options={{
          title: t.support,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="help-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: t.account,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}