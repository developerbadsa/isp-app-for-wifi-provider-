import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../src/store';
import { lightTheme, darkTheme } from '../../src/utils/theme';
import { translations } from '../../src/utils/i18n';
import { Card } from '../../src/components/Card';
import { Header } from '../../src/components/Header';

export default function AdminDashboard() {
  const router = useRouter();
  const { theme, language } = useAppStore();
  const colors = theme === 'light' ? lightTheme : darkTheme;
  const t = translations[language];
  
  const kpiCards = [
    { title: 'Active Subscribers', value: '1,234', icon: 'people-outline', color: colors.colors.success },
    { title: 'Monthly Revenue', value: '৳1,23,450', icon: 'trending-up-outline', color: colors.colors.primary },
    { title: "Today's Payments", value: '৳45,600', icon: 'card-outline', color: colors.colors.accent },
    { title: 'Past Due', value: '23', icon: 'warning-outline', color: colors.colors.error },
  ];
  
  const menuItems = [
    { title: 'Customers', icon: 'people-outline', route: '/customers', color: colors.colors.primary },
    { title: 'Subscriptions', icon: 'wifi-outline', route: '/subscriptions', color: colors.colors.success },
    { title: 'Tickets', icon: 'help-circle-outline', route: '/tickets', color: colors.colors.warning },
    { title: 'Invoices', icon: 'receipt-outline', route: '/invoices', color: colors.colors.accent },
    { title: 'Settings', icon: 'settings-outline', route: '/settings', color: colors.colors.muted },
  ];
  
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
            <View style={styles.activityItem}>
              <View style={[styles.activityDot, { backgroundColor: colors.colors.success }]} />
              <Text style={[styles.activityText, { color: colors.colors.text }]}>
                New customer registration: John Doe
              </Text>
              <Text style={[styles.activityTime, { color: colors.colors.textSecondary }]}>
                2h ago
              </Text>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityDot, { backgroundColor: colors.colors.warning }]} />
              <Text style={[styles.activityText, { color: colors.colors.text }]}>
                Payment received: ৳950
              </Text>
              <Text style={[styles.activityTime, { color: colors.colors.textSecondary }]}>
                4h ago
              </Text>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityDot, { backgroundColor: colors.colors.error }]} />
              <Text style={[styles.activityText, { color: colors.colors.text }]}>
                New support ticket: #234
              </Text>
              <Text style={[styles.activityTime, { color: colors.colors.textSecondary }]}>
                6h ago
              </Text>
            </View>
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