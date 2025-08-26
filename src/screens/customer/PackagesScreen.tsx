import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store';
import { lightTheme, darkTheme } from '../../utils/theme';
import { translations } from '../../utils/i18n';
import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';
import { Header } from '../../components/Header';
import { mockPackages } from '../../utils/mockData';

export const PackagesScreen: React.FC = () => {
  const { theme, language, updateExpiryDate } = useAppStore();
  const colors = theme === 'light' ? lightTheme : darkTheme;
  const t = translations[language];
  
  const [selectedSpeed, setSelectedSpeed] = useState<number | null>(null);
  const [selectedValidity, setSelectedValidity] = useState<number | null>(null);
  
  const speedFilters = [20, 50, 100];
  const validityFilters = [7, 15, 30];
  
  const filteredPackages = mockPackages.filter(pkg => {
    if (selectedSpeed && pkg.speed !== selectedSpeed) return false;
    if (selectedValidity && pkg.validity !== selectedValidity) return false;
    return true;
  });
  
  const handleBuyPackage = (pkg: any) => {
    Alert.alert(
      'Confirm Purchase',
      `Buy ${pkg.name} package for ${t.currency}${pkg.price}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Buy Now', 
          onPress: () => {
            // Mock checkout success
            const newExpiryDate = new Date();
            newExpiryDate.setDate(newExpiryDate.getDate() + pkg.validity);
            updateExpiryDate(newExpiryDate.toISOString().split('T')[0]);
            Alert.alert('Success', 'Package purchased successfully!');
          }
        },
      ]
    );
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.colors.background }]}>
      <Header title={t.packages} />
      
      <ScrollView style={styles.content}>
        {/* Filters */}
        <View style={styles.filtersContainer}>
          <Text style={[styles.filterTitle, { color: colors.colors.text }]}>
            Speed (Mbps)
          </Text>
          <View style={styles.filterRow}>
            {speedFilters.map(speed => (
              <Chip
                key={speed}
                label={`${speed} Mbps`}
                selected={selectedSpeed === speed}
                onPress={() => setSelectedSpeed(selectedSpeed === speed ? null : speed)}
              />
            ))}
          </View>
          
          <Text style={[styles.filterTitle, { color: colors.colors.text }]}>
            Validity (Days)
          </Text>
          <View style={styles.filterRow}>
            {validityFilters.map(validity => (
              <Chip
                key={validity}
                label={`${validity} Days`}
                selected={selectedValidity === validity}
                onPress={() => setSelectedValidity(selectedValidity === validity ? null : validity)}
              />
            ))}
          </View>
        </View>
        
        {/* Package List */}
        <View style={styles.packagesList}>
          {filteredPackages.map(pkg => (
            <Card key={pkg.id} style={styles.packageCard}>
              <View style={styles.packageHeader}>
                <View>
                  <Text style={[styles.packageName, { color: colors.colors.text }]}>
                    {pkg.name}
                  </Text>
                  <Text style={[styles.packageSpeed, { color: colors.colors.primary }]}>
                    {pkg.speed} Mbps
                  </Text>
                </View>
                <View style={styles.packageTags}>
                  {pkg.isPopular && (
                    <Chip label="Popular" variant="success" />
                  )}
                  {pkg.isNew && (
                    <Chip label="New" variant="warning" />
                  )}
                </View>
              </View>
              
              <View style={styles.packageDetails}>
                <Text style={[styles.packagePrice, { color: colors.colors.text }]}>
                  {t.currency}{pkg.price}
                  <Text style={[styles.packageValidity, { color: colors.colors.textSecondary }]}>
                    /{pkg.validity} days
                  </Text>
                </Text>
              </View>
              
              <View style={styles.packageFeatures}>
                {pkg.features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Ionicons 
                      name="checkmark-circle" 
                      size={16} 
                      color={colors.colors.success} 
                    />
                    <Text style={[styles.featureText, { color: colors.colors.textSecondary }]}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>
              
              <View style={styles.packageActions}>
                <TouchableOpacity 
                  style={[styles.buyButton, { backgroundColor: colors.colors.primary }]}
                  onPress={() => handleBuyPackage(pkg)}
                >
                  <Text style={styles.buyButtonText}>Buy Now</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.viewButton, { borderColor: colors.colors.border }]}
                >
                  <Text style={[styles.viewButtonText, { color: colors.colors.text }]}>
                    View Details
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 16 },
  filtersContainer: { marginBottom: 24 },
  filterTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  packagesList: { gap: 16 },
  packageCard: { padding: 16 },
  packageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  packageName: { fontSize: 18, fontWeight: '600' },
  packageSpeed: { fontSize: 14, fontWeight: '500', marginTop: 2 },
  packageTags: { flexDirection: 'row', gap: 8 },
  packageDetails: { marginBottom: 12 },
  packagePrice: { fontSize: 20, fontWeight: 'bold' },
  packageValidity: { fontSize: 14, fontWeight: 'normal' },
  packageFeatures: { marginBottom: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  featureText: { fontSize: 13, marginLeft: 8 },
  packageActions: { flexDirection: 'row', gap: 12 },
  buyButton: { flex: 1, borderRadius: 8, padding: 12, alignItems: 'center' },
  buyButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  viewButton: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 12, alignItems: 'center' },
  viewButtonText: { fontSize: 14, fontWeight: '500' },
});