import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Package } from 'lucide-react-native';

export default function ResidentialRoutesScreen() {
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      <View style={styles.content}>
        <Package size={64} color={colors.textSecondary} />
        <Text style={[styles.title, { color: colors.text }]}>Residential Routes</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Residential trash pickup routes and schedules will be managed here.
        </Text>
        <Text style={[styles.comingSoon, { color: colors.primary }]}>Coming Soon</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginTop: 24,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    textAlign: 'center' as const,
    marginBottom: 24,
    lineHeight: 24,
  },
  comingSoon: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
});
