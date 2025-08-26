import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store';
import { lightTheme, darkTheme } from '../utils/theme';
import { translations } from '../utils/i18n';
import { Card } from '../components/Card';

export const WelcomeScreen: React.FC = () => {
  const router = useRouter();
  const { theme, language } = useAppStore();
  const colors = theme === 'light' ? lightTheme : darkTheme;
  const t = translations[language];
  
  const handleRoleSelect = (role: 'customer' | 'admin') => {
    router.push(`/auth/${role}`);
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.colors.background }]}>
      <View style={styles.content}>

        {/* Heading */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.colors.primary }]}>
            {t.welcome}
          </Text>
          <Text style={[styles.subtitle, { color: colors.colors.textSecondary }]}>
            Choose your role to continue
          </Text>
        </View>
        
        <View style={styles.roleContainer}>
          <TouchableOpacity onPress={() => handleRoleSelect('customer')}>
            <Card style={styles.roleCard}>
              <View style={styles.roleContent}>
                <View style={[styles.iconContainer, { backgroundColor: `${colors.colors.primary}20` }]}>
                  <Ionicons 
                    name="person-outline" 
                    size={32} 
                    color={colors.colors.primary} 
                  />
                </View>
                <Text style={[styles.roleTitle, { color: colors.colors.text }]}>
                  {t.customer}
                </Text>
                <Text style={[styles.roleDescription, { color: colors.colors.textSecondary }]}>
                  Access your account, packages, and support
                </Text>
              </View>
            </Card>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => handleRoleSelect('admin')}>
            <Card style={styles.roleCard}>
              <View style={styles.roleContent}>
                <View style={[styles.iconContainer, { backgroundColor: `${colors.colors.accent}20` }]}>
                  <Ionicons 
                    name="shield-outline" 
                    size={32} 
                    color={colors.colors.accent} 
                  />
                </View>
                <Text style={[styles.roleTitle, { color: colors.colors.text }]}>
                  {t.admin}
                </Text>
                <Text style={[styles.roleDescription, { color: colors.colors.textSecondary }]}>
                  Manage customers, subscriptions, and settings
                </Text>
              </View>
            </Card>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  roleContainer: {
    gap: 16,
  },
  roleCard: {
    marginBottom: 0,
  },
  roleContent: {
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});