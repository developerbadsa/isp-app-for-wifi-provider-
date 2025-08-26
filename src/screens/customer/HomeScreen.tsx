import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store';
import { lightTheme, darkTheme } from '../../utils/theme';
import { translations } from '../../utils/i18n';
import { Card } from '../../components/Card';
import { StatusPill } from '../../components/StatusPill';
import { Header } from '../../components/Header';

export const HomeScreen: React.FC = () => {
  const { theme, language, user, connectionStatus, expiryDate } = useAppStore();
  const colors = theme === 'light' ? lightTheme : darkTheme;
  const t = translations[language];
  
  const [refreshing, setRefreshing] = React.useState(false);
  
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  }, []);
  
  const quickActions = [
    { icon: 'card-outline', label: t.recharge, color: colors.colors.success },
    { icon: 'swap-horizontal-outline', label: t.changePackage, color: colors.colors.primary },
    { icon: 'time-outline', label: 'Extend Time', color: colors.colors.warning },
    { icon: 'help-circle-outline', label: t.createTicket, color: colors.colors.accent },
  ];
  
  const secondaryActions = [
    { icon: 'wifi-outline', label: 'Internet Packages' },
    { icon: 'receipt-outline', label: t.paymentHistory },
    { icon: 'speedometer-outline', label: t.speedTest },
    { icon: 'newspaper-outline', label: 'News & Events' },
  ];
  
  return (
    <View style={[styles.container, { backgroundColor: colors.colors.background }]}>
      <Header title={t.home} />
      
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* User Status Panel */}
        <Card style={styles.statusCard}>
          <View style={styles.userInfo}>
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: colors.colors.text }]}>
                {/* {user?.name} */}

                Rahim Badsa
              </Text>
              <Text style={[styles.loginId, { color: colors.colors.textSecondary }]}>
                ID: {user?.loginId}
              </Text>
            </View>
            <StatusPill status={connectionStatus} type="connection" />
          </View>
        </Card>
        
        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: colors.colors.primary }]}>
          Quick Actions
        </Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity key={index} style={styles.actionItem}>
              <Card style={styles.actionCard}>
                <View style={[styles.actionIcon, { backgroundColor: `${action.color}20` }]}>
                  <Ionicons name={action.icon as any} size={24} color={action.color} />
                </View>
                <Text style={[styles.actionLabel, { color: colors.colors.text }]}>
                  {action.label}
                </Text>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Info Cards */}
        <View style={styles.infoCards}>
          <Card style={styles.infoCard}>
            <Text style={[styles.infoTitle, { color: colors.colors.text }]}>
              Billing Info
            </Text>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.colors.textSecondary }]}>
                Monthly Bill
              </Text>
              <Text style={[styles.infoValue, { color: colors.colors.text }]}>
                {t.currency}950
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.colors.textSecondary }]}>
                Expiry Date
              </Text>
              <Text style={[styles.infoValue, { color: colors.colors.text }]}>
                {expiryDate}
              </Text>
            </View>
          </Card>
          
          <Card style={styles.infoCard}>
            <Text style={[styles.infoTitle, { color: colors.colors.text }]}>
              Network Info
            </Text>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.colors.textSecondary }]}>
                Uptime
              </Text>
              <Text style={[styles.infoValue, { color: colors.colors.success }]}>
                99.8%
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.colors.textSecondary }]}>
                Current IP
              </Text>
              <Text style={[styles.infoValue, { color: colors.colors.text }]}>
                192.168.1.100
              </Text>
            </View>
          </Card>
        </View>
        
        {/* Secondary Actions */}
        <View style={styles.secondaryActions}>
          {secondaryActions.map((action, index) => (
            <TouchableOpacity key={index} style={styles.secondaryAction}>
              <Ionicons 
                name={action.icon as any} 
                size={20} 
                color={colors.colors.textSecondary} 
              />
              <Text style={[styles.secondaryLabel, { color: colors.colors.textSecondary }]}>
                {action.label}
              </Text>
              <Ionicons 
                name="chevron-forward" 
                size={16} 
                color={colors.colors.textSecondary} 
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 16 },
  statusCard: { marginBottom: 24 },
  userInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userDetails: { flex: 1 },
  userName: { fontSize: 18, fontWeight: '600' },
  loginId: { fontSize: 14, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  actionItem: { width: '47%' },
  actionCard: { alignItems: 'center', padding: 16 },
  actionIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 12, textAlign: 'center', fontWeight: '500' },
  infoCards: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  infoCard: { flex: 1 },
  infoTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  infoLabel: { fontSize: 12 },
  infoValue: { fontSize: 12, fontWeight: '500' },
  secondaryActions: { gap: 1 },
  secondaryAction: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'transparent' },
  secondaryLabel: { flex: 1, marginLeft: 12, fontSize: 14 },
});