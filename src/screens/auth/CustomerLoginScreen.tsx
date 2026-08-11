import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../store';
import { lightTheme, darkTheme } from '../../utils/theme';
import { translations } from '../../utils/i18n';
import { Card } from '../../components/Card';
import { customerDemoCredentials, isDemoLoginEnabled } from '../../config/demoLogin';

export const CustomerLoginScreen: React.FC = () => {
  const router = useRouter();
  const { theme, language, login } = useAppStore();
  const colors = theme === 'light' ? lightTheme : darkTheme;
  const t = translations[language];
  
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState(isDemoLoginEnabled ? customerDemoCredentials.phone : '');
  const [otp, setOtp] = useState(isDemoLoginEnabled ? customerDemoCredentials.otp : '');
  const [error, setError] = useState('');
  
  const handlePhoneSubmit = () => {
    if (phone === customerDemoCredentials.phone) {
      setStep('otp');
      setError('');
    } else {
      setError(`Invalid phone number. Use test account: ${customerDemoCredentials.phone}`);
    }
  };
  
  const handleOtpSubmit = () => {
    if (otp === customerDemoCredentials.otp) {
      const user = {
        id: '1',
        role: 'customer' as const,
        name: 'Rahim Badsa',
        phone: phone,
        loginId: 'SKY001234',
        avatar: 'https://lh3.googleusercontent.com/a/ACg8ocLUy4YSsdIhgBg3rbDu-gX1njvVbw4tfz7Woehae_69YhsOPIP4=s288-c-no',
      };
      login(user);
      router.replace('/(customer)');
    } else {
      setError(`Invalid OTP. Use test OTP: ${customerDemoCredentials.otp}`);
    }
  };
  
  const useTestAccount = () => {
    setPhone(customerDemoCredentials.phone);
    setOtp(customerDemoCredentials.otp);
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.colors.primary }]}>
          {t.customer} {t.login}
        </Text>
        
        <Card style={styles.formCard}>
          {step === 'phone' ? (
            <>
              <Text style={[styles.label, { color: colors.colors.text }]}>
                {t.phone}
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.colors.surface,
                  color: colors.colors.text,
                  borderColor: colors.colors.border,
                }]}
                value={phone}
                onChangeText={setPhone}
                placeholder={customerDemoCredentials.phone}
                placeholderTextColor={colors.colors.textSecondary}
                keyboardType="phone-pad"
              />
              
              {error ? (
                <Text style={[styles.error, { color: colors.colors.error }]}>
                  {error}
                </Text>
              ) : null}
              
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.colors.primary }]}
                onPress={handlePhoneSubmit}
              >
                <Text style={styles.buttonText}>Send OTP</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[styles.label, { color: colors.colors.text }]}>
                {t.otp}
              </Text>
              <Text style={[styles.subtitle, { color: colors.colors.textSecondary }]}>
                Enter the OTP sent to {phone}
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.colors.surface,
                  color: colors.colors.text,
                  borderColor: colors.colors.border,
                }]}
                value={otp}
                onChangeText={setOtp}
                placeholder={customerDemoCredentials.otp}
                placeholderTextColor={colors.colors.textSecondary}
                keyboardType="number-pad"
                maxLength={6}
              />
              
              {error ? (
                <Text style={[styles.error, { color: colors.colors.error }]}>
                  {error}
                </Text>
              ) : null}
              
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.colors.primary }]}
                onPress={handleOtpSubmit}
              >
                <Text style={styles.buttonText}>Verify & Login</Text>
              </TouchableOpacity>
            </>
          )}
          
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
  subtitle: { fontSize: 14, marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16 },
  button: { borderRadius: 8, padding: 16, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  testButton: { borderWidth: 1, borderRadius: 8, padding: 12, alignItems: 'center' },
  testButtonText: { fontSize: 14, fontWeight: '500' },
  error: { fontSize: 14, marginBottom: 16 },
});
