import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import Colors from '@/constants/colors';
import { Camera, ChevronDown, X } from 'lucide-react-native';
import { US_STATES } from '@/constants/states';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import type { FuelLog } from '@/types';

export default function FuelLogScreen() {
  const { user } = useAuth();
  const { addFuelLog, drivers, trucks } = useData();
  const router = useRouter();
  const [odometer, setOdometer] = useState<string>('');
  const [gallons, setGallons] = useState<string>('');
  const [pricePerGallon, setPricePerGallon] = useState<string>('');
  const [stationName, setStationName] = useState<string>('');
  const [receiptPhoto, setReceiptPhoto] = useState<string>('');
  const [selectedTruckId, setSelectedTruckId] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [showStatePicker, setShowStatePicker] = useState<boolean>(false);

  const driver = drivers.find(d => d.email === user?.email);
  const assignedTruck = trucks.find(t => t.id === driver?.assignedTruckId);
  const selectedTruck = selectedTruckId ? trucks.find(t => t.id === selectedTruckId) : assignedTruck;

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].uri) {
      setReceiptPhoto(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!odometer || !gallons || !pricePerGallon) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!selectedTruck) {
      Alert.alert('Error', 'Please select a truck');
      return;
    }

    const odometerValue = parseInt(odometer);
    const gallonsValue = parseFloat(gallons);
    const priceValue = parseFloat(pricePerGallon);

    if (isNaN(odometerValue) || isNaN(gallonsValue) || isNaN(priceValue)) {
      Alert.alert('Error', 'Please enter valid numbers');
      return;
    }

    if (!state) {
      Alert.alert('Error', 'Please select a state');
      return;
    }

    let latitude: number | undefined = undefined;
    let longitude: number | undefined = undefined;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        latitude = loc.coords.latitude;
        longitude = loc.coords.longitude;
      }
    } catch (error) {
      console.error('Failed to get location:', error);
    }

    const fuelLog: FuelLog = {
      id: `fuel-${Date.now()}`,
      driverId: user?.id || '',
      driverName: user?.name,
      truckId: selectedTruck.id,
      truckUnitNumber: selectedTruck.unitNumber,
      date: new Date().toISOString().split('T')[0],
      odometer: odometerValue,
      gallons: gallonsValue,
      pricePerGallon: priceValue,
      totalCost: gallonsValue * priceValue,
      receiptPhoto: receiptPhoto || undefined,
      stationName: stationName || undefined,
      state,
      latitude,
      longitude,
      createdAt: new Date().toISOString(),
    };

    await addFuelLog(fuelLog);
    Alert.alert('Success', 'Fuel log submitted successfully', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle</Text>
        {assignedTruck && !selectedTruckId ? (
          <View style={styles.truckInfo}>
            <Text style={styles.truckText}>Unit {assignedTruck.unitNumber}</Text>
            <Text style={styles.truckSubtext}>Current Odometer: {assignedTruck.odometer.toLocaleString()} mi</Text>
            <TouchableOpacity
              style={styles.changeTruckButton}
              onPress={() => setSelectedTruckId('select')}
            >
              <Text style={styles.changeTruckButtonText}>Change Truck</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text style={styles.label}>Select Truck</Text>
            {trucks.filter(t => t.active).map(truck => (
              <TouchableOpacity
                key={truck.id}
                style={[
                  styles.truckOption,
                  selectedTruckId === truck.id && styles.truckOptionSelected,
                ]}
                onPress={() => setSelectedTruckId(truck.id)}
              >
                <Text style={styles.truckOptionText}>Unit {truck.unitNumber}</Text>
                <Text style={styles.truckOptionSubtext}>Odometer: {truck.odometer.toLocaleString()} mi</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Odometer Reading *</Text>
        <View style={styles.odometerRow}>
          <TextInput
            style={[styles.input, styles.odometerInput]}
            placeholder="Enter odometer"
            placeholderTextColor={Colors.textSecondary}
            value={odometer}
            onChangeText={setOdometer}
            keyboardType="numeric"
          />
          <TouchableOpacity
            style={styles.stateSelector}
            onPress={() => setShowStatePicker(true)}
          >
            <Text style={[styles.stateText, !state && styles.statePlaceholder]}>
              {state || 'State'}
            </Text>
            <ChevronDown size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Gallons *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter gallons"
          placeholderTextColor={Colors.textSecondary}
          value={gallons}
          onChangeText={setGallons}
          keyboardType="decimal-pad"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Price per Gallon *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter price per gallon"
          placeholderTextColor={Colors.textSecondary}
          value={pricePerGallon}
          onChangeText={setPricePerGallon}
          keyboardType="decimal-pad"
        />
      </View>

      {gallons && pricePerGallon && (
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Cost</Text>
          <Text style={styles.totalValue}>
            ${(parseFloat(gallons) * parseFloat(pricePerGallon)).toFixed(2)}
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.label}>Station Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter station name (optional)"
          placeholderTextColor={Colors.textSecondary}
          value={stationName}
          onChangeText={setStationName}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Receipt Photo</Text>
        <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
          <Camera size={24} color={Colors.primary} />
          <Text style={styles.photoButtonText}>
            {receiptPhoto ? 'Retake Photo' : 'Take Photo of Receipt'}
          </Text>
        </TouchableOpacity>
        {receiptPhoto && (
          <Text style={styles.photoSuccess}>Receipt photo captured</Text>
        )}
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Submit Fuel Log</Text>
      </TouchableOpacity>

      <Modal visible={showStatePicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select State</Text>
              <TouchableOpacity onPress={() => setShowStatePicker(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.stateList}>
              {US_STATES.map(s => (
                <TouchableOpacity
                  key={s.code}
                  style={styles.stateOption}
                  onPress={() => {
                    setState(s.code);
                    setShowStatePicker(false);
                  }}
                >
                  <Text style={styles.stateOptionText}>{s.name}</Text>
                  <Text style={styles.stateOptionCode}>{s.code}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  truckInfo: {
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 12,
  },
  truckText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  truckSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  totalCard: {
    backgroundColor: Colors.primary,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center' as const,
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 14,
    color: Colors.background,
    opacity: 0.9,
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.background,
  },
  photoButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  photoButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  photoSuccess: {
    fontSize: 14,
    color: Colors.success,
    marginTop: 8,
    textAlign: 'center' as const,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center' as const,
    marginBottom: 24,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.background,
  },
  changeTruckButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignSelf: 'flex-start' as const,
  },
  changeTruckButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  truckOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    marginBottom: 8,
  },
  truckOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.backgroundSecondary,
  },
  truckOptionText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  truckOptionSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  odometerRow: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  odometerInput: {
    flex: 1,
  },
  stateSelector: {
    width: 100,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stateText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  statePlaceholder: {
    color: Colors.textSecondary,
    fontWeight: '400' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end' as const,
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundSecondary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  stateList: {
    padding: 16,
  },
  stateOption: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    marginBottom: 8,
  },
  stateOptionText: {
    fontSize: 16,
    color: Colors.text,
  },
  stateOptionCode: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
});
