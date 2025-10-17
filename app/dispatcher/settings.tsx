import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { useData } from '@/contexts/DataContext';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { Settings as SettingsIcon, Mail, Save, QrCode, Download, Send, RefreshCw, Database } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import * as FileSystem from 'expo-file-system';

export default function SettingsScreen() {
  const { dispatcherSettings, updateDispatcherSettings } = useData();
  const [reportEmail, setReportEmail] = useState<string>('');
  const [qrToken, setQrToken] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'settings' | 'sync'>('settings');
  const qrRef = useRef<any>(null);

  useEffect(() => {
    if (dispatcherSettings) {
      setReportEmail(dispatcherSettings.reportEmail || '');
      setQrToken(dispatcherSettings.qrToken || '');
    }
  }, [dispatcherSettings]);

  const handleSave = async () => {
    if (reportEmail && !reportEmail.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    await updateDispatcherSettings({
      reportEmail: reportEmail || undefined,
      qrToken: qrToken || undefined,
    });

    Alert.alert('Success', 'Settings saved successfully');
  };

  const generateQRCode = async () => {
    const newToken = `DISPATCHER-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    setQrToken(newToken);
    
    await updateDispatcherSettings({
      reportEmail: reportEmail || undefined,
      qrToken: newToken,
    });

    Alert.alert('Success', 'QR code generated successfully. Save or share it to use for login.');
  };

  const handleDownloadQR = () => {
    if (!qrRef.current) return;
    
    qrRef.current.toDataURL((dataURL: string) => {
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.download = 'dispatcher-qr-code.png';
        link.href = dataURL;
        link.click();
      } else {
        Alert.alert('Success', 'QR code ready to share');
      }
    });
  };

  const handleShareQR = async () => {
    if (!qrToken) {
      Alert.alert('Error', 'Please generate a QR code first');
      return;
    }

    if (Platform.OS === 'web') {
      Alert.alert('Share', `Your QR token is: ${qrToken}\n\nOn mobile, you can share the QR code image.`);
      return;
    }

    try {
      if (qrRef.current) {
        qrRef.current.toDataURL(async (dataURL: string) => {
          try {
            const filename = `${FileSystem.cacheDirectory}dispatcher-qr-code.png`;
            await FileSystem.writeAsStringAsync(filename, dataURL, {
              encoding: FileSystem.EncodingType.Base64,
            });
            
            await Share.share({
              message: 'Dispatcher QR Code for GMI Services Login. Scan this code in the app to log in as a dispatcher.',
              url: filename,
              title: 'Dispatcher QR Code',
            });
          } catch (error) {
            console.error('Error sharing QR code:', error);
            Alert.alert('Error', 'Failed to share QR code');
          }
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share QR code');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SettingsIcon size={24} color={Colors.primary} />
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.tabActive]}
          onPress={() => setActiveTab('settings')}
        >
          <Text style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>
            App Settings
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sync' && styles.tabActive]}
          onPress={() => setActiveTab('sync')}
        >
          <Text style={[styles.tabText, activeTab === 'sync' && styles.tabTextActive]}>
            Data Sync
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'settings' ? (
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Report Email</Text>
            <Text style={styles.sectionDescription}>
              Email address where reports will be sent
            </Text>
            <View style={styles.inputContainer}>
              <Mail size={20} color={Colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="dispatcher@company.com"
                placeholderTextColor={Colors.textSecondary}
                value={reportEmail}
                onChangeText={setReportEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>



          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dispatcher QR Code Login</Text>
        <Text style={styles.sectionDescription}>
          Generate a QR code for quick dispatcher login. Scan this code on the login screen to access your dispatcher account.
        </Text>
        
        {qrToken ? (
          <View style={styles.qrContainer}>
            <View style={styles.qrCodeWrapper}>
              <QRCode
                value={qrToken}
                size={200}
                color={Colors.text}
                backgroundColor={Colors.background}
                getRef={(ref) => (qrRef.current = ref)}
              />
            </View>
            <View style={styles.qrActions}>
              <TouchableOpacity
                style={styles.qrActionButton}
                onPress={handleShareQR}
              >
                <Send size={18} color={Colors.primary} />
                <Text style={styles.qrActionText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.qrActionButton}
                onPress={handleDownloadQR}
              >
                <Download size={18} color={Colors.primary} />
                <Text style={styles.qrActionText}>Download</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.qrActionButton}
                onPress={generateQRCode}
              >
                <QrCode size={18} color={Colors.warning} />
                <Text style={[styles.qrActionText, { color: Colors.warning }]}>Regenerate</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.generateButton}
            onPress={generateQRCode}
          >
            <QrCode size={20} color={Colors.background} />
            <Text style={styles.generateButtonText}>Generate QR Code</Text>
          </TouchableOpacity>
        )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>User Management</Text>
            <Text style={styles.sectionDescription}>
              Manage driver and dispatcher login credentials in the Drivers screen.
              Set username and password for each user.
            </Text>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Save size={20} color={Colors.background} />
            <Text style={styles.saveButtonText}>Save Settings</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <SyncDataContent />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  section: {
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  saveButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.background,
  },
  qrContainer: {
    alignItems: 'center' as const,
    marginTop: 12,
  },
  qrCodeWrapper: {
    padding: 16,
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  qrActions: {
    flexDirection: 'row' as const,
    gap: 12,
    marginTop: 16,
    flexWrap: 'wrap' as const,
    justifyContent: 'center' as const,
  },
  qrActionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.backgroundSecondary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  qrActionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  generateButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.primary,
    padding: 14,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  generateButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.background,
  },
  syncButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.backgroundSecondary,
    padding: 14,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  syncButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  tabContainer: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.background,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.background,
  },
  syncContainer: {
    flex: 1,
    padding: 16,
    paddingTop: 32,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  syncNavButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.background,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  syncNavButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  syncDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    marginTop: 12,
    paddingHorizontal: 32,
  },
});

function SyncDataContent() {
  const router = useRouter();
  
  return (
    <View style={styles.syncContainer}>
      <TouchableOpacity
        style={styles.syncNavButton}
        onPress={() => router.push('/dispatcher/sync-data')}
      >
        <Database size={20} color={Colors.primary} />
        <Text style={styles.syncNavButtonText}>Open Data Sync</Text>
        <RefreshCw size={20} color={Colors.primary} />
      </TouchableOpacity>
      <Text style={styles.syncDescription}>
        Upload and download data between devices to keep everything in sync
      </Text>
    </View>
  );
}
