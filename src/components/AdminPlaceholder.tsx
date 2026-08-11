import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppStore } from '../store';
import { lightTheme, darkTheme } from '../utils/theme';

interface AdminPlaceholderProps {
  title: string;
  icon: string;
}

export const AdminPlaceholder: React.FC<AdminPlaceholderProps> = ({ title, icon }) => {
  const router = useRouter();
  const { theme } = useAppStore();
  const colors = theme === 'light' ? lightTheme : darkTheme;

  return (
    <View style={[styles.container, { backgroundColor: colors.colors.background }]}>
      <View style={[styles.navHeader, { backgroundColor: colors.colors.primary }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.colors.text }]}>{title}</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.body}>
        <View style={[styles.iconCircle, { backgroundColor: `${colors.colors.primary}20` }]}>
          <Ionicons name={icon as any} size={40} color={colors.colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.colors.text }]}>{title}</Text>
        <Text style={[styles.message, { color: colors.colors.textSecondary }]}>
          This section is coming soon.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 45,
    paddingBottom: 12,
    paddingHorizontal: 8,
  },
  backButton: { width: 40, alignItems: 'center' },
  navTitle: { fontSize: 17, fontWeight: '600' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  message: { fontSize: 14, textAlign: 'center' },
});
