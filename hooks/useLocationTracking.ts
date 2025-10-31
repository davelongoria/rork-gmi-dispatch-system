import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { trpcClient } from '@/lib/trpc';

interface LocationTrackingOptions {
  driverId: string;
  enabled: boolean;
  onLocationUpdate: (latitude: number, longitude: number) => void;
  intervalMs?: number;
}

export function useLocationTracking({
  driverId,
  enabled,
  onLocationUpdate,
  intervalMs = 30000,
}: LocationTrackingOptions) {
  const intervalRef = useRef<any>(null);
  const lastLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    if (!enabled || !driverId) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const setupLocationTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Location permission not granted');
          return;
        }

        const updateLocation = async () => {
          try {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            
            const latitude = location.coords.latitude;
            const longitude = location.coords.longitude;

            const hasChanged =
              !lastLocationRef.current ||
              Math.abs(lastLocationRef.current.latitude - latitude) > 0.0001 ||
              Math.abs(lastLocationRef.current.longitude - longitude) > 0.0001;

            if (hasChanged) {
              lastLocationRef.current = { latitude, longitude };
              onLocationUpdate(latitude, longitude);
              console.log('Location updated for driver:', driverId, latitude, longitude);
              
              try {
                await trpcClient.location.addHistory.mutate({
                  driverId,
                  latitude,
                  longitude,
                  speed: location.coords.speed || undefined,
                  heading: location.coords.heading || undefined,
                  altitude: location.coords.altitude || undefined,
                  accuracy: location.coords.accuracy || undefined,
                  timestamp: new Date(location.timestamp).toISOString(),
                });
                console.log('Location history saved for driver:', driverId);
              } catch (error) {
                console.error('Failed to save location history:', error);
              }
            }
          } catch (error) {
            console.error('Failed to get location:', error);
          }
        };

        await updateLocation();

        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }

        intervalRef.current = setInterval(updateLocation, intervalMs);

      } catch (error) {
        console.error('Failed to setup location tracking:', error);
      }
    };

    setupLocationTracking();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, driverId, onLocationUpdate, intervalMs]);
}
