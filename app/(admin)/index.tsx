import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../src/store';
import { lightTheme, darkTheme } from '../../src/utils/theme';
import { translations } from '../../src/utils/i18n';
import { Card } from '../../src/components/Card';
import { Header } from '../../src/components/Header';
import { mockActivityLogs, mockUsers } from '../../src/utils/mockData';
import type { ActivityLog } from '../../src/types';

const currency = '\u09F3';

const formatNumber = (value: number) => value.toLocaleString('en-US');

const formatCurrency = (value: number) => `${currency}${formatNumber(value)}`;

const getPaymentAmount = (activity: ActivityLog) => {
  const amount = activity.detail?.match(/[\d,]+/)?.[0];
  return amount ? Number(amount.replace(/,/g, '')) : 0;
};

const getActivityTime = (timestamp: string, referenceTime: number) => {
  const diffMs = Math.max(referenceTime - new Date(timestamp).getTime(), 0);
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

export default function AdminDashboard() {
  const router = useRouter();
  const { theme, language } = useAppStore();
  const colors = theme === 'light' ? lightTheme : darkTheme;
  const t = translations[language];

  const activeSubscribers = mockUsers.filter(user => user.status !== 'suspended').length;
  const monthlyRevenue = mockUsers
    .filter(user => user.status !== 'suspended')
    .reduce((total, user) => total + user.price, 0);
  const pastDueCustomers = mockUsers.filter(user => user.status === 'past_due').length;
  const successfulPayments = mockActivityLogs.filter(
    activity => activity.type === 'payment' && activity.level === 'success',
  );
  const latestPaymentDate = successfulPayments
    .map(activity => activity.timestamp.slice(0, 10))
    .sort()
    .at(-1);
  const todaysPayments = successfulPayments
    .filter(activity => activity.timestamp.startsWith(latestPaymentDate ?? ''))
    .reduce((total, activity) => total + getPaymentAmount(activity), 0);
  const latestActivityTime = Math.max(
    ...mockActivityLogs.map(activity => new Date(activity.timestamp).getTime()),
  );
  const recentActivities = [...mockActivityLogs]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 3);

  const kpiCards = [
    { title: 'Active Subscribers', value: formatNumber(activeSubscribers), icon: 'people-outline', color: colors.colors.success },
    { title: 'Monthly Revenue', value: formatCurrency(monthlyRevenue), icon: 'trending-up-outline', color: colors.colors.primary },
    { title: "Today's Payments", value: formatCurrency(todaysPayments), icon: 'card-outline', color: colors.colors.accent },
    { title: 'Past Due', value: formatNumber(pastDueCustomers), icon: 'warning-outline', color: colors.colors.error },
  ];

  const menuItems = [
    { title: 'Customers', icon: 'people-outline', route: '/customers', color: colors.colors.primary },
    { title: 'Subscriptions', icon: 'wifi-outline', route: '/subscriptions', color: colors.colors.success },
    { title: 'Tickets', icon: 'help-circle-outline', route: '/tickets', color: colors.colors.warning },
    { title: 'Invoices', icon: 'receipt-outline', route: '/invoices', color: colors.colors.accent },
    { title: 'Settings', icon: 'settings-outline', route: '/settings', color: colors.colors.muted },
  ];

  const getActivityColor = (activity: ActivityLog) => {
    if (activity.level === 'success') return colors.colors.success;
    if (activity.level === 'warning') return colors.colors.warning;
    if (activity.level === 'error') return colors.colors.error;
    return colors.colors.primary;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.colors.background }]}>
      <Header title="Admin Dashboard" />

      <ScrollView style={styles.content}>
        {/* KPI Cards */}
        <View style={styles.kpiGrid}>
          {kpiCards.map((kpi, index) => (
            <Card key={index} style={styles.kpiCard}>
              <View style={styles.kpiContent}>
                <View style={[styles.kpiIcon, { backgroundColor: `${kpi.color}20` }]}>
                  <Ionicons name={kpi.icon as any} size={24} color={kpi.color} />
                </View>
                <Text style={[styles.kpiValue, { color: colors.colors.text }]}>
                  {kpi.value}
                </Text>
                <Text style={[styles.kpiTitle, { color: colors.colors.textSecondary }]}>
                  {kpi.title}
                </Text>
              </View>
            </Card>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: colors.colors.text }]}>
          Quick Actions
        </Text>
        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => router.push(item.route as any)}
            >
              <Card style={styles.menuCard}>
                <View style={styles.menuContent}>
                  <View style={[styles.menuIcon, { backgroundColor: `${item.color}20` }]}>
                    <Ionicons name={item.icon as any} size={28} color={item.color} />
                  </View>
                  <Text style={[styles.menuTitle, { color: colors.colors.text }]}>
                    {item.title}
                  </Text>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Activity */}
        <Card style={styles.activityCard}>
          <Text style={[styles.sectionTitle, { color: colors.colors.text }]}>
            Recent Activity
          </Text>
          <View style={styles.activityList}>
            {recentActivities.map(activity => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={[styles.activityDot, { backgroundColor: getActivityColor(activity) }]} />
                <Text style={[styles.activityText, { color: colors.colors.text }]}>
                  {activity.detail ? `${activity.title}: ${activity.detail}` : activity.title}
                </Text>
                <Text style={[styles.activityTime, { color: colors.colors.textSecondary }]}>
                  {getActivityTime(activity.timestamp, latestActivityTime)}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 16 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  kpiCard: { width: '47%', padding: 16 },
  kpiContent: { alignItems: 'center' },
  kpiIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  kpiValue: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  kpiTitle: { fontSize: 12, textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  menuCard: { width: '47%', padding: 20 },
  menuContent: { alignItems: 'center' },
  menuIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  menuTitle: { fontSize: 14, fontWeight: '500', textAlign: 'center' },
  activityCard: { marginBottom: 16 },
  activityList: { gap: 12 },
  activityItem: { flexDirection: 'row', alignItems: 'center' },
  activityDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  activityText: { flex: 1, fontSize: 14 },
  activityTime: { fontSize: 12 },
});
