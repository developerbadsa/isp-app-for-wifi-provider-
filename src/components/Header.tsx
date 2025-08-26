import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store';
import { lightTheme, darkTheme } from '../utils/theme';
import { translations } from '../utils/i18n';

interface HeaderProps {
  title?: string;
  showNotifications?: boolean;
  onNotificationPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  showNotifications = true,
  onNotificationPress 
}) => {
  const { theme, language, user } = useAppStore();
  const colors = theme === 'light' ? lightTheme : darkTheme;
  const t = translations[language];
  
  return (
    <View style={[styles.header, { backgroundColor: colors.colors.primary }]}>
      <View style={styles.left}>
        <Image 
          source={{ uri: 'https://via.placeholder.com/40x40/2563EB/FFFFFF?text=SL' }}
          style={styles.logo}
        />
        {title && (
          <Text style={[styles.title, { color: colors.colors.text }]}>
            {title}
          </Text>
        )}
      </View>
      
      <View style={styles.right}>
        {showNotifications && (
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={onNotificationPress}
          >
            <Ionicons 
              name="notifications-outline" 
              size={24} 
              color={colors.colors.text} 
            />
            <View style={[styles.badge, { backgroundColor: colors.colors.error }]} />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.avatar}>
          <Image 
            source={{ uri: user?.avatar || 'https://via.placeholder.com/32x32/6B7280/FFFFFF?text=U' }}
            style={styles.avatarImage}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 30,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginRight: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
});