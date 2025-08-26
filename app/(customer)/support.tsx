import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../src/store';
import { lightTheme, darkTheme } from '../../src/utils/theme';
import { translations } from '../../src/utils/i18n';
import { Card } from '../../src/components/Card';
import { Chip } from '../../src/components/Chip';
import { StatusPill } from '../../src/components/StatusPill';
import { Header } from '../../src/components/Header';
import { mockTickets } from '../../src/utils/mockData';

export default function CustomerSupport() {
  const { theme, language } = useAppStore();
  const colors = theme === 'light' ? lightTheme : darkTheme;
  const t = translations[language];
  
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'open' | 'closed'>('all');
  
  const filters = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'closed', label: 'Closed' },
  ];
  
  const filteredTickets = mockTickets.filter(ticket => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'open') return ticket.status === 'pending';
    if (selectedFilter === 'closed') return ticket.status !== 'pending';
    return true;
  });
  
  const handleCreateTicket = () => {
    Alert.alert('Create Ticket', 'Ticket creation form would open here');
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.colors.background }]}>
      <Header title={t.support} />
      
      <View style={styles.content}>
        {/* Filters */}
        <View style={styles.filtersContainer}>
          {filters.map(filter => (
            <Chip
              key={filter.key}
              label={filter.label}
              selected={selectedFilter === filter.key}
              onPress={() => setSelectedFilter(filter.key as any)}
            />
          ))}
        </View>
        
        {/* Tickets List */}
        <ScrollView style={styles.ticketsList}>
          {filteredTickets.map(ticket => (
            <Card key={ticket.id} style={styles.ticketCard}>
              <View style={styles.ticketHeader}>
                <View style={styles.ticketInfo}>
                  <Text style={[styles.ticketTitle, { color: colors.colors.text }]}>
                    {ticket.title}
                  </Text>
                  <Text style={[styles.ticketNumber, { color: colors.colors.textSecondary }]}>
                    {ticket.number} • {ticket.date}
                  </Text>
                </View>
                <StatusPill status={ticket.status} type="ticket" />
              </View>
              
              <View style={styles.ticketMeta}>
                <Chip label={ticket.category} />
                <Chip label={ticket.priority} variant={ticket.priority === 'high' ? 'error' : 'default'} />
              </View>
              
              <View style={styles.ticketActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={[styles.actionText, { color: colors.colors.primary }]}>
                    Details
                  </Text>
                </TouchableOpacity>
                {ticket.status === 'pending' && (
                  <TouchableOpacity style={styles.actionButton}>
                    <Text style={[styles.actionText, { color: colors.colors.error }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          ))}
        </ScrollView>
        
        {/* Create Ticket FAB */}
        <TouchableOpacity 
          style={[styles.fab, { backgroundColor: colors.colors.primary }]}
          onPress={handleCreateTicket}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 16 },
  filtersContainer: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  ticketsList: { flex: 1 },
  ticketCard: { marginBottom: 12 },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  ticketInfo: { flex: 1 },
  ticketTitle: { fontSize: 16, fontWeight: '600' },
  ticketNumber: { fontSize: 12, marginTop: 4 },
  ticketMeta: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  ticketActions: { flexDirection: 'row', gap: 16 },
  actionButton: { paddingVertical: 4 },
  actionText: { fontSize: 14, fontWeight: '500' },
  fab: { position: 'absolute', bottom: 16, right: 16, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8 },
});