import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function CompanySelectionScreen() {
  const { selectCompany, isLoading, availableCompanies } = useTheme();
  const router = useRouter();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const handleSelectCompany = async (companyId: string) => {
    setSelectedId(companyId);
    await selectCompany(companyId);
    router.replace('/login' as any);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#B00000" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Your Company</Text>
          <Text style={styles.subtitle}>Choose your company to continue</Text>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.companiesContainer}
        >
          {availableCompanies.map((company) => (
            <TouchableOpacity
              key={company.id}
              style={[
                styles.companyCard,
                selectedId === company.id && styles.companyCardSelected,
              ]}
              onPress={() => handleSelectCompany(company.id)}
              disabled={selectedId !== null}
              activeOpacity={0.7}
            >
              <View style={styles.logoContainer}>
                <Image
                  source={{ uri: company.logo }}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.companyName}>{company.name}</Text>
              {selectedId === company.id && (
                <ActivityIndicator size="small" color={company.primaryColor} style={styles.loader} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#000000',
    marginTop: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
    marginTop: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  companiesContainer: {
    paddingBottom: 32,
    gap: 24,
  },
  companyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  companyCardSelected: {
    borderColor: '#000000',
    borderWidth: 3,
  },
  logoContainer: {
    width: 240,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  companyName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  loader: {
    marginTop: 16,
  },
});
