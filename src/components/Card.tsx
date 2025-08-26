import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useAppStore } from '../store';
import { lightTheme, darkTheme } from '../utils/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: keyof typeof lightTheme.spacing;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  style, 
  padding = 'md' 
}) => {
  const theme = useAppStore(state => state.theme);
  const colors = theme === 'light' ? lightTheme : darkTheme;
  
  const cardStyle = [
    styles.card,
    {
      backgroundColor: colors.colors.card,
      padding: colors.spacing[padding],
      borderRadius: colors.borderRadius.lg,
      shadowColor: colors.colors.shadow,
    },
    style,
  ];
  
  return (
    <View style={cardStyle}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});