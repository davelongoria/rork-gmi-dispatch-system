import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useData } from '@/contexts/DataContext';
import { trpc } from '@/lib/trpc';
import Slider from '@react-native-community/slider';
import { MapPin, Calendar, Clock, Navigation } from 'lucide-react-native';
import type { LocationHistory } from '@/types';

export default function DriverLocationHistoryScreen() {
  const { driverId } = useLocalSearchParams<{ driverId: string }>();
  const { theme } = useTheme();
  const { drivers } = useData();
  const colors = theme.colors;
  const styles = createStyles(colors);

  const driver = drivers.find(d => d.id === driverId);

  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);


  const [sliderValue, setSliderValue] = useState<number>(0);
  const [currentLocation, setCurrentLocation] = useState<LocationHistory | null>(null);

  const { data: locationHistory, isLoading } = trpc.location.getHistory.useQuery({
    driverId: driverId || '',
    startDate: startOfDay.toISOString(),
    endDate: endOfDay.toISOString(),
    limit: 5000,
  }, {
    enabled: !!driverId,
    refetchInterval: 30000,
  });

  const sortedHistory: LocationHistory[] = React.useMemo(() => {
    if (!locationHistory) return [];
    return [...locationHistory].sort((a: any, b: any) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    ) as LocationHistory[];
  }, [locationHistory]);

  useEffect(() => {
    if (sortedHistory.length > 0) {
      const index = Math.floor((sliderValue / 100) * (sortedHistory.length - 1));
      setCurrentLocation(sortedHistory[index] as LocationHistory);
    }
  }, [sliderValue, sortedHistory]);

  const handleOpenInMaps = () => {
    if (!currentLocation) return;

    const { latitude, longitude } = currentLocation;
    const label = driver?.name || 'Driver Location';
    
    const url = Platform.OS === 'ios'
      ? `maps://maps.apple.com/?q=${latitude},${longitude}&ll=${latitude},${longitude}`
      : `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(label)})`;
    
    Linking.openURL(url).catch(err => {
      Alert.alert('Error', 'Unable to open maps application');
      console.error('Failed to open maps:', err);
    });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!driver) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Driver Not Found' }} />
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Driver not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: `${driver.name} - Location History` }} />

      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading location history...</Text>
        </View>
      ) : sortedHistory.length === 0 ? (
        <View style={styles.centerContent}>
          <MapPin size={64} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>No Location History</Text>
          <Text style={styles.emptyText}>
            No location data found for today. Location tracking will begin when the driver logs in.
          </Text>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MapPin size={24} color={colors.primary} />
              <Text style={styles.cardTitle}>Current Position on Timeline</Text>
            </View>

            {currentLocation && (
              <>
                <View style={styles.infoRow}>
                  <Calendar size={18} color={colors.textSecondary} />
                  <Text style={styles.infoLabel}>Date:</Text>
                  <Text style={styles.infoValue}>{formatDate(currentLocation.timestamp)}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Clock size={18} color={colors.textSecondary} />
                  <Text style={styles.infoLabel}>Time:</Text>
                  <Text style={styles.infoValue}>{formatTime(currentLocation.timestamp)}</Text>
                </View>

                <View style={styles.infoRow}>
                  <MapPin size={18} color={colors.textSecondary} />
                  <Text style={styles.infoLabel}>Coordinates:</Text>
                  <Text style={styles.infoValue}>
                    {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                  </Text>
                </View>

                {currentLocation.speed !== null && currentLocation.speed !== undefined && (
                  <View style={styles.infoRow}>
                    <Navigation size={18} color={colors.textSecondary} />
                    <Text style={styles.infoLabel}>Speed:</Text>
                    <Text style={styles.infoValue}>
                      {(currentLocation.speed * 2.237).toFixed(1)} mph
                    </Text>
                  </View>
                )}
              </>
            )}

            <TouchableOpacity
              style={styles.mapButton}
              onPress={handleOpenInMaps}
              disabled={!currentLocation}
            >
              <MapPin size={20} color={colors.background} />
              <Text style={styles.mapButtonText}>Open in Maps</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.timelineCard}>
            <Text style={styles.timelineTitle}>Timeline</Text>
            <Text style={styles.timelineSubtitle}>
              {sortedHistory.length} location points recorded today
            </Text>

            <View style={styles.timelineLabels}>
              <View style={styles.timelineLabel}>
                <Text style={styles.timelineLabelText}>Start</Text>
                <Text style={styles.timelineLabelTime}>
                  {formatTime(sortedHistory[0].timestamp)}
                </Text>
              </View>
              <View style={[styles.timelineLabel, styles.timelineLabelEnd]}>
                <Text style={styles.timelineLabelText}>Current</Text>
                <Text style={styles.timelineLabelTime}>
                  {formatTime(sortedHistory[sortedHistory.length - 1].timestamp)}
                </Text>
              </View>
            </View>

            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              value={sliderValue}
              onValueChange={setSliderValue}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />

            <View style={styles.progressContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { width: `${sliderValue}%`, backgroundColor: colors.primary }
                ]} 
              />
            </View>
          </View>

          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Today's Statistics</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{sortedHistory.length}</Text>
                <Text style={styles.statLabel}>Data Points</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {Math.floor(
                    (new Date(sortedHistory[sortedHistory.length - 1].timestamp).getTime() - 
                     new Date(sortedHistory[0].timestamp).getTime()) / (1000 * 60 * 60)
                  )}h
                </Text>
                <Text style={styles.statLabel}>Duration</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {currentLocation?.accuracy ? `${currentLocation.accuracy.toFixed(0)}m` : 'N/A'}
                </Text>
                <Text style={styles.statLabel}>Accuracy</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 24,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.error,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 24,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 20,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
  },
  infoRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  infoValue: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  mapButton: {
    marginTop: 16,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
  },
  mapButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.background,
  },
  timelineCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 4,
  },
  timelineSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  timelineLabels: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 12,
  },
  timelineLabel: {
    alignItems: 'flex-start' as const,
  },
  timelineLabelEnd: {
    alignItems: 'flex-end' as const,
  },
  timelineLabelText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  timelineLabelTime: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  progressContainer: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden' as const,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  statsCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
  },
  statItem: {
    alignItems: 'center' as const,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
