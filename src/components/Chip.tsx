import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { useAppStore } from '../store';
import { lightTheme, darkTheme } from '../utils/theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  variant?: 'default' | 'success' | 'warning' | 'error';
  style?: ViewStyle;
}

export const Chip: React.FC<ChipProps> = ({ 
  label, 
  selected = false, 
  onPress, 
  variant = 'default',
  style 
}) => {
  const theme = useAppStore(state => state.theme);
  const colors = theme === 'light' ? lightTheme : darkTheme;
  
  const getVariantColors = () => {
    switch (variant) {
      case 'success':
        return { bg: colors.colors.success, text: '#FFFFFF' };
      case 'warning':
        return { bg: colors.colors.warning, text: '#FFFFFF' };
      case 'error':
        return { bg: colors.colors.error, text: '#FFFFFF' };
      default:
        return selected 
          ? { bg: colors.colors.primary, text: '#FFFFFF' }
          : { bg: colors.colors.surface, text: colors.colors.text };
    }
  };
  
  const variantColors = getVariantColors();
  
  const chipStyle = [
    styles.chip,
    {
      backgroundColor: variantColors.bg,
      borderRadius: colors.borderRadius.xl,
      paddingHorizontal: colors.spacing.md,
      paddingVertical: colors.spacing.xs,
    },
    style,
  ];
  
  const textStyle = [
    styles.text,
    {
      color: variantColors.text,
      fontSize: colors.fontSize.sm,
    },
  ];
  
  return (
    <TouchableOpacity style={chipStyle} onPress={onPress}>
      <Text style={textStyle}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '500',
  },
});