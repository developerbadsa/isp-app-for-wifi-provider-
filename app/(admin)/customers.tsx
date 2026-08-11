import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../src/store';
import { lightTheme, darkTheme } from '../../src/utils/theme';
import { Card } from '../../src/components/Card';
import { Header } from '../../src/components/Header';
import { StatusPill } from '../../src/components/StatusPill';
import { mockUsers } from '../../src/utils/mockData';

export default function AdminCustomers() {
  const router = useRouter();
  const { theme } = useAppStore();
  const colors = theme === 'light' ? lightTheme : darkTheme;
  const [search, setSearch] = useState('');

  const filteredUsers = mockUsers.filter(user => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      user.name.toLowerCase().includes(q) ||
      user.phone.includes(q) ||
      user.loginId.toLowerCase().includes(q) ||
      user.clientCode.toLowerCase().includes(q)
    );
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.colors.background }]}>
      <Header title="Customers" showNotifications={false} />

      <View style={styles.content}>
        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: colors.colors.surface, borderColor: colors.colors.border }]}>
          <Ionicons name="search-outline" size={18} color={colors.colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.colors.text }]}
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, phone, ID..."
            placeholderTextColor={colors.colors.textSecondary}
            autoCapitalize="none"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={[styles.countText, { color: colors.colors.textSecondary }]}>
          {filteredUsers.length} customer{filteredUsers.length !== 1 ? 's' : ''}
        </Text>

        {/* Customer List */}
        <ScrollView style={styles.list}>
          {filteredUsers.map(user => (
            <Card key={user.id} style={styles.userCard}>
              <TouchableOpacity
                style={styles.userHeader}
                onPress={() => router.push(`/customer/${user.id}`)}
              >
                <View style={[styles.avatar, { backgroundColor: colors.colors.primary }]}>
                  <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: colors.colors.text }]}>
                    {user.name}
                  </Text>
                  <Text style={[styles.userMeta, { color: colors.colors.textSecondary }]}>
                    {user.loginId} • {user.phone}
                  </Text>
                  <Text style={[styles.userPackage, { color: colors.colors.primary }]}>
                    {user.packageName} • {user.speed} Mbps • ৳{user.price}
                  </Text>
                </View>
                <StatusPill status={user.status} type="connection" />
              </TouchableOpacity>

              <View style={[styles.cardFooter, { borderTopColor: colors.colors.border }]}>
                <Text style={[styles.expiryText, { color: colors.colors.textSecondary }]}>
                  Expires: {user.expiryDate}
                </Text>
                <TouchableOpacity
                  style={[styles.viewButton, { borderColor: colors.colors.primary }]}
                  onPress={() => router.push(`/customer/${user.id}`)}
                >
                  <Text style={[styles.viewButtonText, { color: colors.colors.primary }]}>
                    View Details
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.colors.primary} />
                </TouchableOpacity>
              </View>
            </Card>
          ))}

          {filteredUsers.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={40} color={colors.colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.colors.textSecondary }]}>
                No customers found
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 16 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, padding: 0 },
  countText: { fontSize: 12, marginBottom: 12 },
  list: { flex: 1 },
  userCard: { marginBottom: 12, padding: 16 },
  userHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  userInfo: { flex: 1, marginRight: 8 },
  userName: { fontSize: 16, fontWeight: '600' },
  userMeta: { fontSize: 12, marginTop: 2 },
  userPackage: { fontSize: 12, marginTop: 4, fontWeight: '500' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  expiryText: { fontSize: 12 },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewButtonText: { fontSize: 13, fontWeight: '600', marginRight: 2 },
  emptyState: { alignItems: 'center', marginTop: 48 },
  emptyText: { fontSize: 14, marginTop: 8 },
});
