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
  Image,
  Modal,
} from 'react-native';
import { useData } from '@/contexts/DataContext';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Settings as SettingsIcon, Mail, Save, QrCode, Download, Send, RefreshCw, Database, Plus, Edit2, Trash2, X, Building2 } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import * as FileSystem from 'expo-file-system';
import type { Company } from '@/types';

export default function SettingsScreen() {
  const { dispatcherSettings, updateDispatcherSettings, companies, addCompany, updateCompany, deleteCompany } = useData();
  const { theme } = useTheme();
  const colors = theme.colors;
  const [reportEmail, setReportEmail] = useState<string>('');
  const [qrToken, setQrToken] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'settings' | 'sync' | 'companies'>('settings');
  const qrRef = useRef<any>(null);
  
  const [showCompanyModal, setShowCompanyModal] = useState<boolean>(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyForm, setCompanyForm] = useState({
    name: '',
    logo: '',
    primaryColor: '#B00000',
    secondaryColor: '#2C2C2E',
    accentColor: '#FFA500',
  });

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

  const openCompanyModal = (company?: Company) => {
    if (company) {
      setEditingCompany(company);
      setCompanyForm({
        name: company.name,
        logo: company.logo,
        primaryColor: company.primaryColor,
        secondaryColor: company.secondaryColor || '#2C2C2E',
        accentColor: company.accentColor || company.primaryColor,
      });
    } else {
      setEditingCompany(null);
      setCompanyForm({
        name: '',
        logo: '',
        primaryColor: '#B00000',
        secondaryColor: '#2C2C2E',
        accentColor: '#FFA500',
      });
    }
    setShowCompanyModal(true);
  };

  const handleSaveCompany = async () => {
    if (!companyForm.name || !companyForm.logo || !companyForm.primaryColor) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const companyData: Company = {
      id: editingCompany?.id || `company-${Date.now()}`,
      name: companyForm.name,
      logo: companyForm.logo,
      primaryColor: companyForm.primaryColor,
      secondaryColor: companyForm.secondaryColor,
      accentColor: companyForm.accentColor,
      active: true,
      createdAt: editingCompany?.createdAt || new Date().toISOString(),
    };

    if (editingCompany) {
      await updateCompany(editingCompany.id, companyData);
      Alert.alert('Success', 'Company updated successfully');
    } else {
      await addCompany(companyData);
      Alert.alert('Success', 'Company added successfully');
    }

    setShowCompanyModal(false);
  };

  const handleDeleteCompany = async (id: string) => {
    Alert.alert(
      'Delete Company',
      'Are you sure you want to delete this company? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteCompany(id);
            Alert.alert('Success', 'Company deleted successfully');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      <View style={styles.header}>
        <SettingsIcon size={24} color={colors.primary} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
      </View>

      <View style={[styles.tabContainer, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && { backgroundColor: colors.primary }]}
          onPress={() => setActiveTab('settings')}
        >
          <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'settings' && { color: colors.background }]}>
            App Settings
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'companies' && { backgroundColor: colors.primary }]}
          onPress={() => setActiveTab('companies')}
        >
          <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'companies' && { color: colors.background }]}>
            Companies
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sync' && { backgroundColor: colors.primary }]}
          onPress={() => setActiveTab('sync')}
        >
          <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'sync' && { color: colors.background }]}>
            Data Sync
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'settings' ? (
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Report Email</Text>
            <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
              Email address where reports will be sent
            </Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.backgroundSecondary }]}>
              <Mail size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="dispatcher@company.com"
                placeholderTextColor={colors.textSecondary}
                value={reportEmail}
                onChangeText={setReportEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>



          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Dispatcher QR Code Login</Text>
        <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
          Generate a QR code for quick dispatcher login. Scan this code on the login screen to access your dispatcher account.
        </Text>
        
        {qrToken ? (
          <View style={styles.qrContainer}>
            <View style={[styles.qrCodeWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <QRCode
                value={qrToken}
                size={200}
                color={colors.text}
                backgroundColor={colors.card}
                getRef={(ref) => (qrRef.current = ref)}
              />
            </View>
            <View style={styles.qrActions}>
              <TouchableOpacity
                style={[styles.qrActionButton, { backgroundColor: colors.backgroundSecondary }]}
                onPress={handleShareQR}
              >
                <Send size={18} color={colors.primary} />
                <Text style={[styles.qrActionText, { color: colors.primary }]}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.qrActionButton, { backgroundColor: colors.backgroundSecondary }]}
                onPress={handleDownloadQR}
              >
                <Download size={18} color={colors.primary} />
                <Text style={[styles.qrActionText, { color: colors.primary }]}>Download</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.qrActionButton, { backgroundColor: colors.backgroundSecondary }]}
                onPress={generateQRCode}
              >
                <QrCode size={18} color={colors.warning} />
                <Text style={[styles.qrActionText, { color: colors.warning }]}>Regenerate</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.generateButton, { backgroundColor: colors.primary }]}
            onPress={generateQRCode}
          >
            <QrCode size={20} color={colors.background} />
            <Text style={[styles.generateButtonText, { color: colors.background }]}>Generate QR Code</Text>
          </TouchableOpacity>
        )}
          </View>

          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>User Management</Text>
            <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
              Manage driver login credentials in the Drivers screen.
              Each driver can have:
              {"\n"}• Email (required) - Can be used for login
              {"\n"}• Username (optional) - Alternative login ID
              {"\n"}• Password (optional) - If set, required for login
              {"\n"}• QR Code - Quick login without credentials
            </Text>
          </View>

          <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSave}>
            <Save size={20} color={colors.background} />
            <Text style={[styles.saveButtonText, { color: colors.background }]}>Save Settings</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : activeTab === 'companies' ? (
        <View style={styles.companiesTab}>
          <View style={styles.companiesHeader}>
            <Text style={[styles.companiesTitle, { color: colors.text }]}>Manage Companies</Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => openCompanyModal()}
            >
              <Plus size={20} color={colors.background} />
              <Text style={[styles.addButtonText, { color: colors.background }]}>Add Company</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
            {companies.map((company) => (
              <View key={company.id} style={[styles.companyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.companyHeader}>
                  <Image source={{ uri: company.logo }} style={styles.companyLogo} resizeMode="contain" />
                  <View style={styles.companyInfo}>
                    <Text style={[styles.companyName, { color: colors.text }]}>{company.name}</Text>
                    <View style={styles.colorRow}>
                      <View style={[styles.colorBox, { backgroundColor: company.primaryColor }]} />
                      <Text style={[styles.colorLabel, { color: colors.textSecondary }]}>Primary</Text>
                      <View style={[styles.colorBox, { backgroundColor: company.secondaryColor || '#2C2C2E' }]} />
                      <Text style={[styles.colorLabel, { color: colors.textSecondary }]}>Secondary</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.companyActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.backgroundSecondary }]}
                    onPress={() => openCompanyModal(company)}
                  >
                    <Edit2 size={16} color={colors.primary} />
                    <Text style={[styles.actionButtonText, { color: colors.primary }]}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.backgroundSecondary }]}
                    onPress={() => handleDeleteCompany(company.id)}
                  >
                    <Trash2 size={16} color={colors.error} />
                    <Text style={[styles.actionButtonText, { color: colors.error }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {companies.length === 0 && (
              <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                <Building2 size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>No companies added yet</Text>
                <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>Add a company to get started</Text>
              </View>
            )}
          </ScrollView>

          <Modal visible={showCompanyModal} animationType="slide" transparent>
            <View style={styles.modalContainer}>
              <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>   {editingCompany ? 'Edit Company' : 'Add Company'}
                  </Text>
                  <TouchableOpacity onPress={() => setShowCompanyModal(false)}>
                    <X size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalScroll}>
                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: colors.text }]}>Company Name *</Text>
                    <TextInput
                      style={[styles.formInput, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
                      placeholder="Enter company name"
                      placeholderTextColor={colors.textSecondary}
                      value={companyForm.name}
                      onChangeText={(text) => setCompanyForm({ ...companyForm, name: text })}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: colors.text }]}>Logo URL *</Text>
                    <TextInput
                      style={[styles.formInput, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
                      placeholder="https://example.com/logo.png"
                      placeholderTextColor={colors.textSecondary}
                      value={companyForm.logo}
                      onChangeText={(text) => setCompanyForm({ ...companyForm, logo: text })}
                      autoCapitalize="none"
                    />
                    {companyForm.logo && (
                      <Image source={{ uri: companyForm.logo }} style={styles.logoPreview} resizeMode="contain" />
                    )}
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: colors.text }]}>Primary Color *</Text>
                    <View style={styles.colorInputRow}>
                      <View style={[styles.colorPreview, { backgroundColor: companyForm.primaryColor }]} />
                      <TextInput
                        style={[styles.formInput, { flex: 1, backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
                        placeholder="#B00000"
                        placeholderTextColor={colors.textSecondary}
                        value={companyForm.primaryColor}
                        onChangeText={(text) => setCompanyForm({ ...companyForm, primaryColor: text })}
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: colors.text }]}>Secondary Color</Text>
                    <View style={styles.colorInputRow}>
                      <View style={[styles.colorPreview, { backgroundColor: companyForm.secondaryColor }]} />
                      <TextInput
                        style={[styles.formInput, { flex: 1, backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
                        placeholder="#2C2C2E"
                        placeholderTextColor={colors.textSecondary}
                        value={companyForm.secondaryColor}
                        onChangeText={(text) => setCompanyForm({ ...companyForm, secondaryColor: text })}
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: colors.text }]}>Accent Color</Text>
                    <View style={styles.colorInputRow}>
                      <View style={[styles.colorPreview, { backgroundColor: companyForm.accentColor }]} />
                      <TextInput
                        style={[styles.formInput, { flex: 1, backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
                        placeholder="#FFA500"
                        placeholderTextColor={colors.textSecondary}
                        value={companyForm.accentColor}
                        onChangeText={(text) => setCompanyForm({ ...companyForm, accentColor: text })}
                        autoCapitalize="none"
                      />
                    </View>
                  </View>
                </ScrollView>

                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={handleSaveCompany}
                >
                  <Save size={20} color={colors.background} />
                  <Text style={[styles.modalButtonText, { color: colors.background }]}>Save Company</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      ) : (
        <SyncDataContent />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  saveButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  qrContainer: {
    alignItems: 'center' as const,
    marginTop: 12,
  },
  qrCodeWrapper: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
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
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  qrActionText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  generateButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 14,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  generateButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },

  tabContainer: {
    flexDirection: 'row' as const,
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
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
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
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
  },
  syncNavButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  syncDescription: {
    fontSize: 14,
    textAlign: 'center' as const,
    marginTop: 12,
    paddingHorizontal: 32,
  },
  companiesTab: {
    flex: 1,
  },
  companiesHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 16,
  },
  companiesTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  addButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  companyCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  companyHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  companyLogo: {
    width: 80,
    height: 50,
    marginRight: 12,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  colorRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  colorBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  colorLabel: {
    fontSize: 12,
  },
  companyActions: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  emptyState: {
    padding: 48,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    borderRadius: 16,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
  },
  modalScroll: {
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  formInput: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  logoPreview: {
    width: '100%',
    height: 100,
    marginTop: 12,
    borderRadius: 8,
  },
  colorInputRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  colorPreview: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  modalButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
});

function SyncDataContent() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = theme.colors;
  
  return (
    <View style={styles.syncContainer}>
      <TouchableOpacity
        style={[styles.syncNavButton, { backgroundColor: colors.card, borderColor: colors.primary }]}
        onPress={() => router.push('/dispatcher/sync-data')}
      >
        <Database size={20} color={colors.primary} />
        <Text style={[styles.syncNavButtonText, { color: colors.primary }]}>Open Data Sync</Text>
        <RefreshCw size={20} color={colors.primary} />
      </TouchableOpacity>
      <Text style={[styles.syncDescription, { color: colors.textSecondary }]}>
        Upload and download data between devices to keep everything in sync
      </Text>
    </View>
  );
}
