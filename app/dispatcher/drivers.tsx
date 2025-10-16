import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ScrollView,
  Share,
  Platform,
} from 'react-native';
import { useData } from '@/contexts/DataContext';
import Colors from '@/constants/colors';
import { Plus, Search, Phone, Mail, Truck as TruckIcon, X, Building2, QrCode, Share2 } from 'lucide-react-native';
import type { Driver } from '@/types';
import { HAULING_COMPANIES } from '@/constants/haulingCompanies';
import QRCode from 'react-native-qrcode-svg';
import * as MailComposer from 'expo-mail-composer';
import * as FileSystem from 'expo-file-system';

export default function DriversScreen() {
  const { drivers, trucks, addDriver, updateDriver, deleteDriver } = useData();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [qrModalVisible, setQrModalVisible] = useState<boolean>(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [selectedDriverForQR, setSelectedDriverForQR] = useState<Driver | null>(null);
  const qrRef = useRef<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    licenseNumber: '',
    assignedTruckId: '',
    haulingCompanyId: '',
  });

  const filteredDrivers = drivers.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddDriver = () => {
    setEditingDriver(null);
    setFormData({ name: '', phone: '', email: '', licenseNumber: '', assignedTruckId: '', haulingCompanyId: '' });
    setModalVisible(true);
  };

  const handleEditDriver = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name,
      phone: driver.phone,
      email: driver.email,
      licenseNumber: driver.licenseNumber || '',
      assignedTruckId: driver.assignedTruckId || '',
      haulingCompanyId: driver.haulingCompanyId || '',
    });
    setModalVisible(true);
  };

  const generateQRToken = () => {
    return `GMI-DRIVER-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  };

  const handleSave = async () => {
    if (!formData.name || !formData.phone || !formData.email) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (editingDriver) {
      await updateDriver(editingDriver.id, {
        ...formData,
        licenseNumber: formData.licenseNumber || undefined,
        assignedTruckId: formData.assignedTruckId || undefined,
        haulingCompanyId: formData.haulingCompanyId || undefined,
      });
    } else {
      const newDriver: Driver = {
        id: `driver-${Date.now()}`,
        ...formData,
        licenseNumber: formData.licenseNumber || undefined,
        assignedTruckId: formData.assignedTruckId || undefined,
        haulingCompanyId: formData.haulingCompanyId || undefined,
        qrToken: generateQRToken(),
        active: true,
        createdAt: new Date().toISOString(),
      };
      await addDriver(newDriver);
    }

    setModalVisible(false);
    setFormData({ name: '', phone: '', email: '', licenseNumber: '', assignedTruckId: '', haulingCompanyId: '' });
  };

  const handleGenerateQR = async (driver: Driver) => {
    if (!driver.qrToken) {
      const newToken = generateQRToken();
      await updateDriver(driver.id, { qrToken: newToken });
      setSelectedDriverForQR({ ...driver, qrToken: newToken });
    } else {
      setSelectedDriverForQR(driver);
    }
    setQrModalVisible(true);
  };

  const handleSendQR = async () => {
    if (!selectedDriverForQR) return;

    const message = `Hello ${selectedDriverForQR.name},\n\nYour QR code for logging into the GMI Driver & Dispatch System is attached. You can scan this code with the mobile app to log in instantly.\n\nDriver: ${selectedDriverForQR.name}\nEmail: ${selectedDriverForQR.email}\n\nThank you!`;

    try {
      if (Platform.OS === 'web') {
        Alert.alert(
          'QR Code Generated',
          `QR code for ${selectedDriverForQR.name} is ready. On mobile, you can email or text this to the driver.`
        );
      } else {
        const isAvailable = await MailComposer.isAvailableAsync();
        if (isAvailable) {
          Alert.alert(
            'Send QR Code',
            'How would you like to send the QR code?',
            [
              {
                text: 'Email',
                onPress: async () => {
                  qrRef.current?.toDataURL(async (dataURL: string) => {
                    try {
                      const filename = `${FileSystem.cacheDirectory}driver-qr-${selectedDriverForQR.id}.png`;
                      await FileSystem.writeAsStringAsync(filename, dataURL, {
                        encoding: FileSystem.EncodingType.Base64,
                      });
                      
                      await MailComposer.composeAsync({
                        recipients: [selectedDriverForQR.email],
                        subject: 'Your GMI Driver Login QR Code',
                        body: message,
                        attachments: [filename],
                      });
                    } catch (error) {
                      console.error('Error composing email:', error);
                      Alert.alert('Error', 'Failed to compose email with QR code');
                    }
                  });
                },
              },
              {
                text: 'Share',
                onPress: async () => {
                  qrRef.current?.toDataURL(async (dataURL: string) => {
                    try {
                      const filename = `${FileSystem.cacheDirectory}driver-qr-${selectedDriverForQR.id}.png`;
                      await FileSystem.writeAsStringAsync(filename, dataURL, {
                        encoding: FileSystem.EncodingType.Base64,
                      });
                      
                      await Share.share({
                        message: message,
                        url: filename,
                        title: 'Driver QR Code',
                      });
                    } catch (error) {
                      console.error('Error sharing QR code:', error);
                      Alert.alert('Error', 'Failed to share QR code');
                    }
                  });
                },
              },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
        } else {
          Alert.alert(
            'Email Not Available',
            'Email is not configured on this device. You can still share the QR code.',
            [
              {
                text: 'Share',
                onPress: async () => {
                  qrRef.current?.toDataURL(async (dataURL: string) => {
                    try {
                      const filename = `${FileSystem.cacheDirectory}driver-qr-${selectedDriverForQR.id}.png`;
                      await FileSystem.writeAsStringAsync(filename, dataURL, {
                        encoding: FileSystem.EncodingType.Base64,
                      });
                      
                      await Share.share({
                        message: message,
                        url: filename,
                        title: 'Driver QR Code',
                      });
                    } catch (error) {
                      console.error('Error sharing QR code:', error);
                      Alert.alert('Error', 'Failed to share QR code');
                    }
                  });
                },
              },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error sending QR code:', error);
      Alert.alert('Error', 'Failed to send QR code');
    }
  };

  const renderDriver = ({ item }: { item: Driver }) => {
    const assignedTruck = trucks.find(t => t.id === item.assignedTruckId);
    const haulingCompany = HAULING_COMPANIES.find(c => c.id === item.haulingCompanyId);
    
    return (
      <View style={styles.driverCard}>
        <TouchableOpacity
          style={styles.driverCardContent}
          onPress={() => handleEditDriver(item)}
        >
          <View style={styles.driverHeader}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverInitials}>
                {item.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </Text>
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{item.name}</Text>
              <View style={styles.driverMeta}>
                <Phone size={14} color={Colors.textSecondary} />
                <Text style={styles.driverMetaText}>{item.phone}</Text>
              </View>
              <View style={styles.driverMeta}>
                <Mail size={14} color={Colors.textSecondary} />
                <Text style={styles.driverMetaText}>{item.email}</Text>
              </View>
              {assignedTruck && (
                <View style={styles.driverMeta}>
                  <TruckIcon size={14} color={Colors.primary} />
                  <Text style={[styles.driverMetaText, styles.truckText]}>
                    {assignedTruck.unitNumber}
                  </Text>
                </View>
              )}
              {haulingCompany && (
                <View style={styles.driverMeta}>
                  <Building2 size={14} color={Colors.primary} />
                  <Text style={[styles.driverMetaText, styles.truckText]}>
                    {haulingCompany.name}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <View style={[styles.statusBadge, item.active ? styles.statusActive : styles.statusInactive]}>
            <Text style={styles.statusText}>{item.active ? 'Active' : 'Inactive'}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.qrButton}
          onPress={() => handleGenerateQR(item)}
        >
          <QrCode size={20} color={Colors.primary} />
          <Text style={styles.qrButtonText}>
            {item.qrToken ? 'View QR' : 'Generate QR'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search drivers..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddDriver}>
          <Plus size={24} color={Colors.background} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredDrivers}
        renderItem={renderDriver}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No drivers found</Text>
            <Text style={styles.emptySubtext}>Tap + to add your first driver</Text>
          </View>
        }
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingDriver ? 'Edit Driver' : 'Add Driver'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.form} 
              contentContainerStyle={styles.formContent}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={text => setFormData({ ...formData, name: text })}
                placeholder="John Doe"
                placeholderTextColor={Colors.textSecondary}
              />

              <Text style={styles.label}>Phone *</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={text => setFormData({ ...formData, phone: text })}
                placeholder="555-0100"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={text => setFormData({ ...formData, email: text })}
                placeholder="john@gmi.com"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>License Number</Text>
              <TextInput
                style={styles.input}
                value={formData.licenseNumber}
                onChangeText={text => setFormData({ ...formData, licenseNumber: text })}
                placeholder="DL123456"
                placeholderTextColor={Colors.textSecondary}
              />

              <Text style={styles.label}>Hauling Company</Text>
              <View style={styles.truckSelector}>
                <TouchableOpacity
                  style={[
                    styles.truckOption,
                    !formData.haulingCompanyId && styles.truckOptionSelected,
                  ]}
                  onPress={() => setFormData({ ...formData, haulingCompanyId: '' })}
                >
                  <Text style={styles.truckOptionText}>No Company</Text>
                </TouchableOpacity>
                {HAULING_COMPANIES.map(company => (
                  <TouchableOpacity
                    key={company.id}
                    style={[
                      styles.truckOption,
                      formData.haulingCompanyId === company.id && styles.truckOptionSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, haulingCompanyId: company.id })}
                  >
                    <Text style={styles.truckOptionText}>{company.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Assigned Truck</Text>
              <View style={styles.truckSelector}>
                <TouchableOpacity
                  style={[
                    styles.truckOption,
                    !formData.assignedTruckId && styles.truckOptionSelected,
                  ]}
                  onPress={() => setFormData({ ...formData, assignedTruckId: '' })}
                >
                  <Text style={styles.truckOptionText}>No Truck</Text>
                </TouchableOpacity>
                {trucks.filter(t => t.active).map(truck => (
                  <TouchableOpacity
                    key={truck.id}
                    style={[
                      styles.truckOption,
                      formData.assignedTruckId === truck.id && styles.truckOptionSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, assignedTruckId: truck.id })}
                  >
                    <Text style={styles.truckOptionText}>Unit {truck.unitNumber}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.buttonSecondaryText}>Cancel</Text>
                </TouchableOpacity>
                {editingDriver && (
                  <TouchableOpacity
                    style={[styles.button, styles.buttonDelete]}
                    onPress={() => {
                      setModalVisible(false);
                      Alert.alert(
                        'Delete Driver',
                        `Are you sure you want to delete ${editingDriver.name}?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: async () => {
                              await deleteDriver(editingDriver.id);
                              Alert.alert('Success', 'Driver deleted successfully');
                            },
                          },
                        ]
                      );
                    }}
                  >
                    <Text style={styles.buttonDeleteText}>Delete</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary]}
                  onPress={handleSave}
                >
                  <Text style={styles.buttonPrimaryText}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={qrModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.qrModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Driver QR Code</Text>
              <TouchableOpacity onPress={() => setQrModalVisible(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {selectedDriverForQR && (
              <ScrollView 
                style={styles.qrModalScroll}
                contentContainerStyle={styles.qrModalScrollContent}
              >
                <View style={styles.qrCodeContainer}>
                  {selectedDriverForQR.qrToken && (
                    <QRCode
                      value={selectedDriverForQR.qrToken}
                      size={250}
                      backgroundColor={Colors.background}
                      color={Colors.text}
                      getRef={(ref) => (qrRef.current = ref)}
                    />
                  )}
                </View>

                <View style={styles.driverDetailsCard}>
                  <Text style={styles.driverDetailLabel}>Driver Name</Text>
                  <Text style={styles.driverDetailValue}>{selectedDriverForQR.name}</Text>
                  
                  <Text style={styles.driverDetailLabel}>Email</Text>
                  <Text style={styles.driverDetailValue}>{selectedDriverForQR.email}</Text>
                  
                  <Text style={styles.driverDetailLabel}>Phone</Text>
                  <Text style={styles.driverDetailValue}>{selectedDriverForQR.phone}</Text>
                </View>

                <Text style={styles.qrInstructions}>
                  The driver can scan this QR code with the mobile app to log in instantly.
                </Text>

                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary]}
                  onPress={handleSendQR}
                >
                  <Share2 size={20} color={Colors.background} style={{ marginRight: 8 }} />
                  <Text style={styles.buttonPrimaryText}>Send to Driver</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary]}
                  onPress={() => setQrModalVisible(false)}
                >
                  <Text style={styles.buttonSecondaryText}>Close</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  searchContainer: {
    flexDirection: 'row' as const,
    padding: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: Colors.text,
  },
  addButton: {
    width: 48,
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  driverCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  driverHeader: {
    flexDirection: 'row' as const,
    flex: 1,
  },
  driverAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 12,
  },
  driverInitials: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.background,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  driverMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  driverMetaText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  truckText: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: Colors.success,
  },
  statusInactive: {
    backgroundColor: Colors.textSecondary,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.background,
  },
  emptyContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end' as const,
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    height: '90%',
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  form: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  buttonRow: {
    flexDirection: 'row' as const,
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  buttonPrimary: {
    backgroundColor: Colors.primary,
    flexDirection: 'row' as const,
  },
  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.background,
  },
  buttonSecondary: {
    backgroundColor: Colors.backgroundSecondary,
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  buttonDelete: {
    backgroundColor: Colors.error,
  },
  buttonDeleteText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.background,
  },
  truckSelector: {
    gap: 8,
    marginBottom: 16,
  },
  truckOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  truckOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.backgroundSecondary,
  },
  truckOptionText: {
    fontSize: 14,
    color: Colors.text,
  },
  driverCardContent: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
  },
  qrButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    marginTop: 12,
    gap: 6,
  },
  qrButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  qrModalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    height: '85%',
  },
  qrModalScroll: {
    flex: 1,
  },
  qrModalScrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  qrCodeContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 24,
    backgroundColor: Colors.background,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  driverDetailsCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  driverDetailLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginTop: 12,
    marginBottom: 4,
  },
  driverDetailValue: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  qrInstructions: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    marginBottom: 24,
    lineHeight: 20,
  },
});
