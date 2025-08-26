import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppStore } from '../store';
import { lightTheme, darkTheme } from '../utils/theme';
import { ConnectionStatus, TicketStatus, InvoiceStatus } from '../types';

interface StatusPillProps {
  status: ConnectionStatus | TicketStatus | InvoiceStatus;
  type: 'connection' | 'ticket' | 'invoice';
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, type }) => {
  const theme = useAppStore(state => state.theme);
  const colors = theme === 'light' ? lightTheme : darkTheme;
  
  const getStatusColor = () => {
    if (type === 'connection') {
      switch (status as ConnectionStatus) {
        case 'connected': return colors.colors.success;
        case 'expiring': return colors.colors.warning;
        case 'past_due': return '#FB923C';
        case 'suspended': return colors.colors.error;
        default: return colors.colors.muted;
      }
    }
    
    if (type === 'ticket') {
      switch (status as TicketStatus) {
        case 'pending': return colors.colors.warning;
        case 'resolved': return colors.colors.success;
        case 'cancelled': return colors.colors.muted;
        default: return colors.colors.muted;
      }
    }
    
    if (type === 'invoice') {
      switch (status as InvoiceStatus) {
        case 'paid': return colors.colors.success;
        case 'open': return colors.colors.warning;
        case 'overdue': return colors.colors.error;
        default: return colors.colors.muted;
      }
    }
    
    return colors.colors.muted;
  };
  
  const statusColor = getStatusColor();
  
  const pillStyle = [
    styles.pill,
    {
      backgroundColor: `${statusColor}20`,
      borderRadius: colors.borderRadius.xl,
      paddingHorizontal: colors.spacing.sm,
      paddingVertical: colors.spacing.xs,
    },
  ];
  
  const textStyle = [
    styles.text,
    {
      color: statusColor,
      fontSize: colors.fontSize.xs,
    },
  ];
  
  return (
    <View style={pillStyle}>
      <Text style={textStyle}>{status.replace('_', ' ').toUpperCase()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});