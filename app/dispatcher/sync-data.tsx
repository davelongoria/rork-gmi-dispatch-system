import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Upload, Download, RefreshCw } from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
import { useData } from '@/contexts/DataContext';
import Colors from '@/constants/colors';

const STORAGE_KEYS = {
  DRIVERS: '@gmi_drivers',
  TRUCKS: '@gmi_trucks',
  DUMP_SITES: '@gmi_dump_sites',
  YARDS: '@gmi_yards',
  CUSTOMERS: '@gmi_customers',
  JOBS: '@gmi_jobs',
  ROUTES: '@gmi_routes',
  TIME_LOGS: '@gmi_time_logs',
  DVIRS: '@gmi_dvirs',
  FUEL_LOGS: '@gmi_fuel_logs',
  DUMP_TICKETS: '@gmi_dump_tickets',
  MESSAGES: '@gmi_messages',
  GPS_BREADCRUMBS: '@gmi_gps_breadcrumbs',
  MILEAGE_LOGS: '@gmi_mileage_logs',
  DISPATCHER_SETTINGS: '@gmi_dispatcher_settings',
  REPORTS: '@gmi_reports',
  RECURRING_JOBS: '@gmi_recurring_jobs',
  LAST_SYNC: '@gmi_last_sync',
};

export default function SyncDataScreen() {
  const { backendAvailable } = useData();
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [uploadLog, setUploadLog] = useState<string[]>([]);
  const [downloadLog, setDownloadLog] = useState<string[]>([]);

  const syncMutation = trpc.data.sync.useMutation();
  const getAllQuery = trpc.data.getAll.useQuery();

  React.useEffect(() => {
    loadLastSync();
  }, []);

  const loadLastSync = async () => {
    const sync = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    setLastSync(sync);
  };

  const uploadLocalDataToBackend = async () => {
    try {
      setIsUploading(true);
      setUploadLog(['Starting upload...']);
      
      const [
        driversData, trucksData, dumpSitesData, yardsData, customersData,
        jobsData, routesData, timeLogsData, dvirsData, fuelLogsData,
        dumpTicketsData, messagesData, gpsData, mileageLogsData, settingsData,
        reportsData, recurringJobsData
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.DRIVERS),
        AsyncStorage.getItem(STORAGE_KEYS.TRUCKS),
        AsyncStorage.getItem(STORAGE_KEYS.DUMP_SITES),
        AsyncStorage.getItem(STORAGE_KEYS.YARDS),
        AsyncStorage.getItem(STORAGE_KEYS.CUSTOMERS),
        AsyncStorage.getItem(STORAGE_KEYS.JOBS),
        AsyncStorage.getItem(STORAGE_KEYS.ROUTES),
        AsyncStorage.getItem(STORAGE_KEYS.TIME_LOGS),
        AsyncStorage.getItem(STORAGE_KEYS.DVIRS),
        AsyncStorage.getItem(STORAGE_KEYS.FUEL_LOGS),
        AsyncStorage.getItem(STORAGE_KEYS.DUMP_TICKETS),
        AsyncStorage.getItem(STORAGE_KEYS.MESSAGES),
        AsyncStorage.getItem(STORAGE_KEYS.GPS_BREADCRUMBS),
        AsyncStorage.getItem(STORAGE_KEYS.MILEAGE_LOGS),
        AsyncStorage.getItem(STORAGE_KEYS.DISPATCHER_SETTINGS),
        AsyncStorage.getItem(STORAGE_KEYS.REPORTS),
        AsyncStorage.getItem(STORAGE_KEYS.RECURRING_JOBS),
      ]);

      const payload: any = {};
      
      if (driversData && driversData !== 'null') {
        payload.drivers = JSON.parse(driversData);
      }
      if (trucksData && trucksData !== 'null') {
        payload.trucks = JSON.parse(trucksData);
      }
      if (dumpSitesData && dumpSitesData !== 'null') {
        payload.dumpSites = JSON.parse(dumpSitesData);
      }
      if (yardsData && yardsData !== 'null') {
        payload.yards = JSON.parse(yardsData);
      }
      if (customersData && customersData !== 'null') {
        payload.customers = JSON.parse(customersData);
      }
      if (jobsData && jobsData !== 'null') {
        payload.jobs = JSON.parse(jobsData);
      }
      if (routesData && routesData !== 'null') {
        payload.routes = JSON.parse(routesData);
      }
      if (timeLogsData && timeLogsData !== 'null') {
        payload.timeLogs = JSON.parse(timeLogsData);
      }
      if (dvirsData && dvirsData !== 'null') {
        payload.dvirs = JSON.parse(dvirsData);
      }
      if (fuelLogsData && fuelLogsData !== 'null') {
        payload.fuelLogs = JSON.parse(fuelLogsData);
      }
      if (dumpTicketsData && dumpTicketsData !== 'null') {
        payload.dumpTickets = JSON.parse(dumpTicketsData);
      }
      if (messagesData && messagesData !== 'null') {
        payload.messages = JSON.parse(messagesData);
      }
      if (gpsData && gpsData !== 'null') {
        payload.gpsBreadcrumbs = JSON.parse(gpsData);
      }
      if (mileageLogsData && mileageLogsData !== 'null') {
        payload.mileageLogs = JSON.parse(mileageLogsData);
      }
      if (settingsData && settingsData !== 'null') {
        payload.dispatcherSettings = JSON.parse(settingsData);
      }
      if (reportsData && reportsData !== 'null') {
        payload.reports = JSON.parse(reportsData);
      }
      if (recurringJobsData && recurringJobsData !== 'null') {
        payload.recurringJobs = JSON.parse(recurringJobsData);
      }

      const logEntries: string[] = [
        'Data collected from device:',
        `- Drivers: ${payload.drivers?.length || 0}`,
        `- Trucks: ${payload.trucks?.length || 0}`,
        `- Customers: ${payload.customers?.length || 0}`,
        `- Yards: ${payload.yards?.length || 0}`,
        `- Dump Sites: ${payload.dumpSites?.length || 0}`,
        `- Jobs: ${payload.jobs?.length || 0}`,
        `- Routes: ${payload.routes?.length || 0}`,
        `- Time Logs: ${payload.timeLogs?.length || 0}`,
        `- DVIRs: ${payload.dvirs?.length || 0}`,
        `- Fuel Logs: ${payload.fuelLogs?.length || 0}`,
        `- Dump Tickets: ${payload.dumpTickets?.length || 0}`,
        `- Messages: ${payload.messages?.length || 0}`,
        `- GPS Breadcrumbs: ${payload.gpsBreadcrumbs?.length || 0}`,
        `- Mileage Logs: ${payload.mileageLogs?.length || 0}`,
        `- Reports: ${payload.reports?.length || 0}`,
        `- Recurring Jobs: ${payload.recurringJobs?.length || 0}`,
      ];
      setUploadLog(logEntries);
      console.log('Uploading local data to backend:', Object.keys(payload));
      console.log('Payload sample:', {
        driversCount: payload.drivers?.length,
        trucksCount: payload.trucks?.length,
        jobsCount: payload.jobs?.length,
      });
      
      setUploadLog(prev => [...prev, 'Uploading to backend...']);
      await syncMutation.mutateAsync(payload);
      
      setUploadLog(prev => [...prev, '✓ Upload complete!']);
      
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
      await loadLastSync();
      
      Alert.alert('Success', `Upload complete!\n\nUploaded:\n${logEntries.slice(1).join('\n')}\n\nAll devices will sync automatically.`);
      
    } catch (error) {
      console.error('Upload error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', 'Failed to sync to backend: ' + errorMessage + '\n\nPlease ensure backend is enabled and running.');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadBackendData = async () => {
    try {
      setIsDownloading(true);
      setDownloadLog(['Starting download...']);
      
      setDownloadLog(prev => [...prev, 'Fetching from backend...']);
      await getAllQuery.refetch();
      
      if (!getAllQuery.data) {
        Alert.alert('Error', 'No data received from backend');
        return;
      }

      const data = getAllQuery.data;
      
      const logEntries: string[] = [
        'Data received from backend:',
        `- Drivers: ${data.drivers?.length || 0}`,
        `- Trucks: ${data.trucks?.length || 0}`,
        `- Customers: ${data.customers?.length || 0}`,
        `- Yards: ${data.yards?.length || 0}`,
        `- Dump Sites: ${data.dumpSites?.length || 0}`,
        `- Jobs: ${data.jobs?.length || 0}`,
        `- Routes: ${data.routes?.length || 0}`,
      ];
      setDownloadLog(logEntries);
      
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(data.drivers || [])),
        AsyncStorage.setItem(STORAGE_KEYS.TRUCKS, JSON.stringify(data.trucks || [])),
        AsyncStorage.setItem(STORAGE_KEYS.DUMP_SITES, JSON.stringify(data.dumpSites || [])),
        AsyncStorage.setItem(STORAGE_KEYS.YARDS, JSON.stringify(data.yards || [])),
        AsyncStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(data.customers || [])),
        AsyncStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(data.jobs || [])),
        AsyncStorage.setItem(STORAGE_KEYS.ROUTES, JSON.stringify(data.routes || [])),
        AsyncStorage.setItem(STORAGE_KEYS.TIME_LOGS, JSON.stringify(data.timeLogs || [])),
        AsyncStorage.setItem(STORAGE_KEYS.DVIRS, JSON.stringify(data.dvirs || [])),
        AsyncStorage.setItem(STORAGE_KEYS.FUEL_LOGS, JSON.stringify(data.fuelLogs || [])),
        AsyncStorage.setItem(STORAGE_KEYS.DUMP_TICKETS, JSON.stringify(data.dumpTickets || [])),
        AsyncStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(data.messages || [])),
        AsyncStorage.setItem(STORAGE_KEYS.GPS_BREADCRUMBS, JSON.stringify(data.gpsBreadcrumbs || [])),
        AsyncStorage.setItem(STORAGE_KEYS.MILEAGE_LOGS, JSON.stringify(data.mileageLogs || [])),
        AsyncStorage.setItem(STORAGE_KEYS.DISPATCHER_SETTINGS, JSON.stringify(data.dispatcherSettings)),
        AsyncStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(data.reports || [])),
        AsyncStorage.setItem(STORAGE_KEYS.RECURRING_JOBS, JSON.stringify(data.recurringJobs || [])),
        AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString()),
      ]);
      
      await loadLastSync();
      
      setDownloadLog(prev => [...prev, '✓ Download complete!']);
      
      Alert.alert('Success', `Download complete!\n\nDownloaded:\n${logEntries.slice(1).join('\n')}\n\nPlease restart the app to see the changes.`, [
        { text: 'OK' }
      ]);
      
    } catch (error) {
      console.error('Download error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', 'Failed to download from backend: ' + errorMessage + '\n\nPlease ensure backend is enabled and running.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleUpload = () => {
    Alert.alert(
      'Upload Local Data',
      'This will upload all data from this device to the backend server. Other devices will receive this data automatically.\n\nAre you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upload', style: 'destructive', onPress: uploadLocalDataToBackend }
      ]
    );
  };

  const handleDownload = () => {
    Alert.alert(
      'Download Backend Data',
      'This will replace all local data with data from the backend server. Any unsaved local changes will be lost.\n\nAre you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Download', style: 'destructive', onPress: downloadBackendData }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Sync Data',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: '#fff',
        }}
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Data Synchronization</Text>
          <Text style={styles.infoText}>
            Use this screen to sync data between devices. Upload your phone data to the backend, then all other devices will automatically receive it.
          </Text>
          
          <View style={[styles.statusBadge, backendAvailable ? styles.statusOnline : styles.statusOffline]}>
            <View style={[styles.statusDot, backendAvailable ? styles.dotOnline : styles.dotOffline]} />
            <Text style={styles.statusText}>
              Backend: {backendAvailable ? 'Connected' : 'Offline (Local mode)'}
            </Text>
          </View>
          
          {!backendAvailable && (
            <Text style={styles.warningText}>
              The app is running in local mode. Data will be saved to your device only. To enable sync, ensure you&apos;re running the app with &apos;npm start&apos; or &apos;bun start&apos; and check the console logs for connection details.
            </Text>
          )}
          
          {lastSync && (
            <Text style={styles.lastSyncText}>
              Last sync: {new Date(lastSync).toLocaleString()}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.actionButton, (isUploading || !backendAvailable) && styles.buttonDisabled]}
          onPress={handleUpload}
          disabled={isUploading || isDownloading || !backendAvailable}
        >
          {isUploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Upload color="#fff" size={24} />
          )}
          <Text style={styles.buttonText}>Upload Phone Data to Backend</Text>
          <Text style={styles.buttonSubtext}>
            Send all data from this device to the server
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.downloadButton, (isDownloading || !backendAvailable) && styles.buttonDisabled]}
          onPress={handleDownload}
          disabled={isUploading || isDownloading || !backendAvailable}
        >
          {isDownloading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Download color="#fff" size={24} />
          )}
          <Text style={styles.buttonText}>Download Backend Data</Text>
          <Text style={styles.buttonSubtext}>
            Replace local data with server data
          </Text>
        </TouchableOpacity>

        {uploadLog.length > 0 && (
          <View style={styles.logCard}>
            <Text style={styles.logTitle}>Upload Log:</Text>
            {uploadLog.map((log, idx) => (
              <Text key={idx} style={styles.logText}>{log}</Text>
            ))}
          </View>
        )}

        {downloadLog.length > 0 && (
          <View style={styles.logCard}>
            <Text style={styles.logTitle}>Download Log:</Text>
            {downloadLog.map((log, idx) => (
              <Text key={idx} style={styles.logText}>{log}</Text>
            ))}
          </View>
        )}

        {backendAvailable && (
          <View style={styles.noteCard}>
            <RefreshCw color={Colors.primary} size={20} />
            <Text style={styles.noteText}>
              Data is automatically synced when you make changes. Use these buttons to force a manual sync if needed.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    gap: 12,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  infoText: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  lastSyncText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600' as const,
    marginTop: 8,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  downloadButton: {
    backgroundColor: '#2196F3',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700' as const,
    marginTop: 8,
  },
  buttonSubtext: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    textAlign: 'center',
  },
  noteCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  logCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  logText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: 'Courier',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
    marginTop: 12,
  },
  statusOnline: {
    backgroundColor: '#E8F5E9',
  },
  statusOffline: {
    backgroundColor: '#FFF3E0',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotOnline: {
    backgroundColor: '#4CAF50',
  },
  dotOffline: {
    backgroundColor: '#FF9800',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  warningText: {
    fontSize: 13,
    color: '#E65100',
    lineHeight: 20,
    marginTop: 8,
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
  },
});
