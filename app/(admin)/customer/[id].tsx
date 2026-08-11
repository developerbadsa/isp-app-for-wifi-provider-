import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppStore } from '../../../src/store';
import { lightTheme, darkTheme } from '../../../src/utils/theme';
import { Card } from '../../../src/components/Card';
import { StatusPill } from '../../../src/components/StatusPill';
import { mockUsers, mockActivityLogs } from '../../../src/utils/mockData';
import { ActivityLog } from '../../../src/types';

const LOG_ICONS: Record<ActivityLog['type'], { icon: string; color: string }> = {
  login: { icon: 'log-in-outline', color: '#10B981' },
  logout: { icon: 'log-out-outline', color: '#6B7280' },
  payment: { icon: 'card-outline', color: '#2563EB' },
  package: { icon: 'swap-horizontal-outline', color: '#F59E0B' },
  connection: { icon: 'wifi-outline', color: '#EF4444' },
  ticket: { icon: 'help-circle-outline', color: '#F59E0B' },
  admin: { icon: 'shield-checkmark-outline', color: '#6B7280' },
};

const LEVEL_COLORS: Record<ActivityLog['level'], string> = {
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#6B7280',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatTimestamp = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function AdminCustomerDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useAppStore();
  const colors = theme === 'light' ? lightTheme : darkTheme;

  const user = mockUsers.find(u => u.id === id);
  const logs = mockActivityLogs
    .filter(log => log.userId === id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.colors.background }]}>
        <View style={[styles.navHeader, { backgroundColor: colors.colors.primary }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={colors.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: colors.colors.text }]}>Customer Details</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="person-remove-outline" size={40} color={colors.colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.colors.textSecondary }]}>
            Customer not found
          </Text>
        </View>
      </View>
    );
  }

  const profileRows = [
    { label: 'Phone', value: user.phone },
    { label: 'Email', value: user.email || '—' },
    { label: 'Client Code', value: user.clientCode },
    { label: 'Login ID', value: user.loginId },
    { label: 'Zone / Subzone', value: `${user.zone}${user.subzone ? ` / ${user.subzone}` : ''}` },
    { label: 'Address', value: user.address || '—' },
    { label: 'Joining Date', value: user.joiningDate },
  ];

  const subscriptionRows = [
    { label: 'Package', value: `${user.packageName} • ${user.speed} Mbps` },
    { label: 'Monthly Bill', value: `৳${user.price}` },
    { label: 'Expiry Date', value: user.expiryDate },
    { label: 'Uptime', value: user.uptime },
    { label: 'Last Login', value: user.lastLogin ? formatTimestamp(user.lastLogin) : '—' },
  ];

  const deviceRows = [
    { label: 'MAC Address', value: user.mac || '—' },
    { label: 'Current IP', value: user.ip || '—' },
    { label: 'Device Vendor', value: user.deviceVendor || '—' },
  ];

  const renderInfoRow = (row: { label: string; value: string }, index: number) => (
    <View key={index} style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.colors.textSecondary }]}>{row.label}</Text>
      <Text style={[styles.infoValue, { color: colors.colors.text }]}>{row.value}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.colors.background }]}>
      {/* Nav header */}
      <View style={[styles.navHeader, { backgroundColor: colors.colors.primary }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.colors.text }]}>Customer Details</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content}>
        {/* Profile */}
        <Card style={styles.sectionCard}>
          <View style={styles.profileHeader}>
            <View style={[styles.avatar, { backgroundColor: colors.colors.primary }]}>
              <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.colors.text }]}>{user.name}</Text>
              <Text style={[styles.profileId, { color: colors.colors.textSecondary }]}>
                {user.loginId}
              </Text>
            </View>
            <StatusPill status={user.status} type="connection" />
          </View>
          {profileRows.map(renderInfoRow)}
        </Card>

        {/* Subscription */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="wifi-outline" size={18} color={colors.colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.colors.text }]}>Subscription</Text>
          </View>
          {subscriptionRows.map(renderInfoRow)}
        </Card>

        {/* Device */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="hardware-chip-outline" size={18} color={colors.colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.colors.text }]}>Device / Network</Text>
          </View>
          {deviceRows.map(renderInfoRow)}
        </Card>

        {/* Logs */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list-outline" size={18} color={colors.colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.colors.text }]}>Activity Logs</Text>
            <Text style={[styles.logCount, { color: colors.colors.textSecondary }]}>
              {logs.length} entries
            </Text>
          </View>

          {logs.length === 0 ? (
            <Text style={[styles.noLogs, { color: colors.colors.textSecondary }]}>
              No activity recorded for this customer.
            </Text>
          ) : (
            <View style={styles.logList}>
              {logs.map(log => {
                const meta = LOG_ICONS[log.type];
                return (
                  <View key={log.id} style={styles.logItem}>
                    <View style={[styles.logIcon, { backgroundColor: `${meta.color}20` }]}>
                      <Ionicons name={meta.icon as any} size={18} color={meta.color} />
                    </View>
                    <View style={styles.logContent}>
                      <View style={styles.logTitleRow}>
                        <Text style={[styles.logTitle, { color: colors.colors.text }]}>
                          {log.title}
                        </Text>
                        <View
                          style={[
                            styles.logDot,
                            { backgroundColor: LEVEL_COLORS[log.level] },
                          ]}
                        />
                      </View>
                      {log.detail ? (
                        <Text style={[styles.logDetail, { color: colors.colors.textSecondary }]}>
                          {log.detail}
                        </Text>
                      ) : null}
                      <Text style={[styles.logTime, { color: colors.colors.textSecondary }]}>
                        {formatTimestamp(log.timestamp)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

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
  content: { flex: 1, padding: 16 },
  sectionCard: { marginBottom: 16 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '600' },
  profileId: { fontSize: 13, marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginLeft: 8, flex: 1 },
  logCount: { fontSize: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: '500', flex: 1, textAlign: 'right', marginLeft: 16 },
  logList: { gap: 16 },
  logItem: { flexDirection: 'row' },
  logIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logContent: { flex: 1 },
  logTitleRow: { flexDirection: 'row', alignItems: 'center' },
  logTitle: { fontSize: 14, fontWeight: '600', flex: 1 },
  logDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },
  logDetail: { fontSize: 12, marginTop: 2 },
  logTime: { fontSize: 11, marginTop: 4 },
  noLogs: { fontSize: 13 },
  emptyState: { alignItems: 'center', marginTop: 64 },
  emptyText: { fontSize: 14, marginTop: 8 },
});
