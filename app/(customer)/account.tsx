import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../src/store';
import { lightTheme, darkTheme } from '../../src/utils/theme';
import { translations } from '../../src/utils/i18n';
import { Card } from '../../src/components/Card';
import { Header } from '../../src/components/Header';
import { mockCustomerProfile, mockInvoices } from '../../src/utils/mockData';

export default function CustomerAccount() {
  const router = useRouter();
  const { theme, language, user, setTheme, setLanguage, logout } = useAppStore();
  const colors = theme === 'light' ? lightTheme : darkTheme;
  const t = translations[language];
  
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/');
          }
        },
      ]
    );
  };
  
  const profileItems = [
    { label: 'Client Code', value: mockCustomerProfile.clientCode },
    { label: 'Mobile', value: mockCustomerProfile.mobile },
    { label: 'Joining Date', value: mockCustomerProfile.joiningDate },
    { label: 'Uptime', value: mockCustomerProfile.uptime },
    { label: 'MAC Address', value: mockCustomerProfile.mac },
    { label: 'Current IP', value: mockCustomerProfile.ip },
    { label: 'Zone', value: mockCustomerProfile.zone },
  ];
  
  return (
    <View style={[styles.container, { backgroundColor: colors.colors.background }]}>
      <Header title={t.account} />
      
      <ScrollView style={styles.content}>
        {/* Profile Header */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0) || 'U'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.colors.text }]}>
                {user?.name}
              </Text>
              <Text style={[styles.profileId, { color: colors.colors.textSecondary }]}>
                {user?.loginId}
              </Text>
              <Text style={[styles.profilePackage, { color: colors.colors.primary }]}>
                Standard Package - 50 Mbps
              </Text>
            </View>
          </View>
          
          <View style={styles.profileActions}>
            <TouchableOpacity style={[styles.actionButton, { borderColor: colors.colors.border }]}>
              <Text style={[styles.actionButtonText, { color: colors.colors.text }]}>
                Change Password
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { borderColor: colors.colors.border }]}>
              <Text style={[styles.actionButtonText, { color: colors.colors.text }]}>
                Change Number
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
        
        {/* Profile Details */}
        <Card style={styles.detailsCard}>
          <Text style={[styles.sectionTitle, { color: colors.colors.text }]}>
            Account Details
          </Text>
          {profileItems.map((item, index) => (
            <View key={index} style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.colors.textSecondary }]}>
                {item.label}
              </Text>
              <Text style={[styles.detailValue, { color: colors.colors.text }]}>
                {item.value}
              </Text>
            </View>
          ))}
        </Card>
        
        {/* Payment History */}
        <Card style={styles.paymentCard}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.colors.text }]}>
              {t.paymentHistory}
            </Text>
            <TouchableOpacity>
              <Text style={[styles.viewAllText, { color: colors.colors.primary }]}>
                View All
              </Text>
            </TouchableOpacity>
          </View>
          
          {mockInvoices.slice(0, 3).map(invoice => (
            <View key={invoice.id} style={styles.invoiceRow}>
              <View style={styles.invoiceInfo}>
                <Text style={[styles.invoiceId, { color: colors.colors.text }]}>
                  {invoice.id}
                </Text>
                <Text style={[styles.invoiceDate, { color: colors.colors.textSecondary }]}>
                  {invoice.dueDate}
                </Text>
              </View>
              <View style={styles.invoiceAmount}>
                <Text style={[styles.amount, { color: colors.colors.text }]}>
                  {t.currency}{invoice.amount}
                </Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: invoice.status === 'paid' ? colors.colors.success : colors.colors.warning }
                ]}>
                  <Text style={styles.statusText}>
                    {invoice.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </Card>
        
        {/* Settings */}
        <Card style={styles.settingsCard}>
          <Text style={[styles.sectionTitle, { color: colors.colors.text }]}>
            {t.settings}
          </Text>
          
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.colors.text }]}>
              Language
            </Text>
            <View style={styles.languageButtons}>
              <TouchableOpacity
                style={[
                  styles.languageButton,
                  { 
                    backgroundColor: language === 'en' ? colors.colors.primary : 'transparent',
                    borderColor: colors.colors.border
                  }
                ]}
                onPress={() => setLanguage('en')}
              >
                <Text style={[
                  styles.languageText,
                  { color: language === 'en' ? '#FFFFFF' : colors.colors.text }
                ]}>
                  EN
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.languageButton,
                  { 
                    backgroundColor: language === 'bn' ? colors.colors.primary : 'transparent',
                    borderColor: colors.colors.border
                  }
                ]}
                onPress={() => setLanguage('bn')}
              >
                <Text style={[
                  styles.languageText,
                  { color: language === 'bn' ? '#FFFFFF' : colors.colors.text }
                ]}>
                  BN
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.colors.text }]}>
              Dark Mode
            </Text>
            <Switch
              value={theme === 'dark'}
              onValueChange={(value) => setTheme(value ? 'dark' : 'light')}
              trackColor={{ false: colors.colors.border, true: colors.colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={colors.colors.error} />
            <Text style={[styles.logoutText, { color: colors.colors.error }]}>
              {t.logout}
            </Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 16 },
  profileCard: { marginBottom: 16 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '600' },
  profileId: { fontSize: 14, marginTop: 2 },
  profilePackage: { fontSize: 12, marginTop: 4, fontWeight: '500' },
  profileActions: { flexDirection: 'row', gap: 12 },
  actionButton: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 12, alignItems: 'center' },
  actionButtonText: { fontSize: 14, fontWeight: '500' },
  detailsCard: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  detailLabel: { fontSize: 14 },
  detailValue: { fontSize: 14, fontWeight: '500' },
  paymentCard: { marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  viewAllText: { fontSize: 14, fontWeight: '500' },
  invoiceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  invoiceInfo: { flex: 1 },
  invoiceId: { fontSize: 14, fontWeight: '500' },
  invoiceDate: { fontSize: 12, marginTop: 2 },
  invoiceAmount: { alignItems: 'flex-end' },
  amount: { fontSize: 14, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginTop: 4 },
  statusText: { color: '#FFFFFF', fontSize: 10, fontWeight: '600' },
  settingsCard: { marginBottom: 16 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  settingLabel: { fontSize: 14, fontWeight: '500' },
  languageButtons: { flexDirection: 'row', gap: 8 },
  languageButton: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6 },
  languageText: { fontSize: 12, fontWeight: '500' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, paddingVertical: 12 },
  logoutText: { fontSize: 16, fontWeight: '500', marginLeft: 8 },
});