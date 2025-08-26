import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../store';
import { lightTheme, darkTheme } from '../../utils/theme';
import { translations } from '../../utils/i18n';
import { Card } from '../../components/Card';

export const AdminLoginScreen: React.FC = () => {
  const router = useRouter();
  const { theme, language, login } = useAppStore();
  const colors = theme === 'light' ? lightTheme : darkTheme;
  const t = translations[language];
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const handleLogin = () => {
    if (email === 'admin@demo.isp' && password === 'admin123') {
      const user = {
        id: 'admin1',
        role: 'admin' as const,
        name: 'Admin User',
        email: email,
        avatar: 'https://via.placeholder.com/100x100/F59E0B/FFFFFF?text=A',
      };
      login(user);
      router.replace('/(admin)');
    } else {
      setError('Invalid credentials. Use test account: admin@demo.isp / admin123');
    }
  };
  
  const useTestAccount = () => {
    setEmail('admin@demo.isp');
    setPassword('admin123');
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.colors.text }]}>
          {t.admin} {t.login}
        </Text>
        
        <Card style={styles.formCard}>
          <Text style={[styles.label, { color: colors.colors.text }]}>
            {t.email}
          </Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.colors.surface,
              color: colors.colors.text,
              borderColor: colors.colors.border,
            }]}
            value={email}
            onChangeText={setEmail}
            placeholder="admin@demo.isp"
            placeholderTextColor={colors.colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <Text style={[styles.label, { color: colors.colors.text }]}>
            {t.password}
          </Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.colors.surface,
              color: colors.colors.text,
              borderColor: colors.colors.border,
            }]}
            value={password}
            onChangeText={setPassword}
            placeholder="admin123"
            placeholderTextColor={colors.colors.textSecondary}
            secureTextEntry
          />
          
          {error ? (
            <Text style={[styles.error, { color: colors.colors.error }]}>
              {error}
            </Text>
          ) : null}
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.colors.primary }]}
            onPress={handleLogin}
          >
            <Text style={styles.buttonText}>{t.login}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.testButton, { borderColor: colors.colors.border }]}
            onPress={useTestAccount}
          >
            <Text style={[styles.testButtonText, { color: colors.colors.primary }]}>
              Use Test Account
            </Text>
          </TouchableOpacity>
        </Card>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 32 },
  formCard: { marginBottom: 0 },
  label: { fontSize: 16, fontWeight: '500', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16 },
  button: { borderRadius: 8, padding: 16, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  testButton: { borderWidth: 1, borderRadius: 8, padding: 12, alignItems: 'center' },
  testButtonText: { fontSize: 14, fontWeight: '500' },
  error: { fontSize: 14, marginBottom: 16 },
});