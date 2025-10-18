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
import * as ImagePicker from 'expo-image-picker';
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
  
  const [showColorPicker, setShowColorPicker] = useState<{ field: 'primaryColor' | 'secondaryColor' | 'accentColor' } | null>(null);
  
  const predefinedColors = [
    { name: 'Crimson Red', value: '#B00000' },
    { name: 'Navy Blue', value: '#2E3B82' },
    { name: 'Forest Green', value: '#228B22' },
    { name: 'Orange', value: '#FFA500' },
    { name: 'Purple', value: '#6B46C1' },
    { name: 'Teal', value: '#008080' },
    { name: 'Maroon', value: '#800000' },
    { name: 'Royal Blue', value: '#4169E1' },
    { name: 'Dark Green', value: '#006400' },
    { name: 'Amber', value: '#FFBF00' },
    { name: 'Indigo', value: '#4B0082' },
    { name: 'Dark Cyan', value: '#008B8B' },
    { name: 'Dark Gray', value: '#2C2C2E' },
    { name: 'Charcoal', value: '#36454F' },
    { name: 'Black', value: '#000000' },
  ];

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
  
  const handleSelectImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to select a logo.');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 2],
        quality: 0.8,
        base64: false,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        setCompanyForm({ ...companyForm, logo: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };
  
  const handleSelectColor = (colorValue: string) => {
    if (showColorPicker) {
      setCompanyForm({ ...companyForm, [showColorPicker.field]: colorValue });
      setShowColorPicker(null);
    }
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

          <Modal visible={showColorPicker !== null} animationType="slide" transparent>
            <View style={styles.modalContainer}>
              <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Select Color</Text>
                  <TouchableOpacity onPress={() => setShowColorPicker(null)}>
                    <X size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.colorPickerScroll}>
                  <View style={styles.colorGrid}>
                    {predefinedColors.map((color) => (
                      <TouchableOpacity
                        key={color.value}
                        style={[styles.colorOption, { backgroundColor: color.value }]}
                        onPress={() => handleSelectColor(color.value)}
                      >
                        <Text style={styles.colorName}>{color.name}</Text>
                        <Text style={styles.colorValue}>{color.value}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          </Modal>

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
                    <Text style={[styles.formLabel, { color: colors.text }]}>Logo *</Text>
                    <TouchableOpacity
                      style={[styles.imagePickerButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                      onPress={handleSelectImage}
                    >
                      <Text style={[styles.imagePickerButtonText, { color: colors.primary }]}>Select Logo from Device</Text>
                    </TouchableOpacity>
                    {companyForm.logo && (
                      <Image source={{ uri: companyForm.logo }} style={styles.logoPreview} resizeMode="contain" />
                    )}
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: colors.text }]}>Primary Color *</Text>
                    <TouchableOpacity
                      style={[styles.colorSelectButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                      onPress={() => setShowColorPicker({ field: 'primaryColor' })}
                    >
                      <View style={[styles.colorPreview, { backgroundColor: companyForm.primaryColor }]} />
                      <Text style={[styles.colorSelectText, { color: colors.text }]}>{companyForm.primaryColor}</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: colors.text }]}>Secondary Color</Text>
                    <TouchableOpacity
                      style={[styles.colorSelectButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                      onPress={() => setShowColorPicker({ field: 'secondaryColor' })}
                    >
                      <View style={[styles.colorPreview, { backgroundColor: companyForm.secondaryColor }]} />
                      <Text style={[styles.colorSelectText, { color: colors.text }]}>{companyForm.secondaryColor}</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: colors.text }]}>Accent Color</Text>
                    <TouchableOpacity
                      style={[styles.colorSelectButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                      onPress={() => setShowColorPicker({ field: 'accentColor' })}
                    >
                      <View style={[styles.colorPreview, { backgroundColor: companyForm.accentColor }]} />
                      <Text style={[styles.colorSelectText, { color: colors.text }]}>{companyForm.accentColor}</Text>
                    </TouchableOpacity>
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
  imagePickerButton: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
  },
  imagePickerButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  colorSelectButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    height: 56,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    gap: 12,
  },
  colorSelectText: {
    fontSize: 16,
    flex: 1,
  },
  colorPreview: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  colorPickerScroll: {
    maxHeight: 500,
  },
  colorGrid: {
    gap: 12,
    padding: 4,
  },
  colorOption: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  colorName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginBottom: 4,
  },
  colorValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600' as const,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
