import React, { useState, useEffect } from 'react';
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
import { Camera, CheckCircle, AlertTriangle, ChevronDown, X } from 'lucide-react-native';
import { US_STATES } from '@/constants/states';
import * as ImagePicker from 'expo-image-picker';
import type { DVIR, DVIRDefect } from '@/types';

const INSPECTION_ITEMS = [
  'Brakes',
  'Tires',
  'Lights',
  'Horn',
  'Mirrors',
  'Windshield',
  'Wipers',
  'Steering',
  'Engine',
  'Transmission',
  'Exhaust',
  'Fuel System',
  'Coupling Devices',
  'Emergency Equipment',
];

export default function DVIRScreen() {
  const { user } = useAuth();
  const { addDVIR, drivers, trucks, dvirs, routes } = useData();
  const router = useRouter();
  const [inspectionType, setInspectionType] = useState<'PRE_TRIP' | 'POST_TRIP'>('PRE_TRIP');
  const [selectedTruck, setSelectedTruck] = useState<string>('');
  const [defects, setDefects] = useState<DVIRDefect[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [safeToOperate, setSafeToOperate] = useState<boolean>(true);
  const [odometer, setOdometer] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [showStatePicker, setShowStatePicker] = useState<boolean>(false);

  const driver = drivers.find(d => d.email === user?.email);
  const assignedTruck = trucks.find(t => t.id === driver?.assignedTruckId);
  const [showTruckSelector, setShowTruckSelector] = useState<boolean>(false);

  const today = new Date().toISOString().split('T')[0];
  const todayRoute = routes.find(r => r.date === today && r.driverId === user?.id);
  const todayPreTrip = dvirs.find(d => 
    new Date(d.timestamp).toISOString().split('T')[0] === today && 
    d.driverId === user?.id && 
    d.type === 'PRE_TRIP'
  );

  useEffect(() => {
    if (inspectionType === 'POST_TRIP' && todayPreTrip && todayPreTrip.truckId) {
      setSelectedTruck(todayPreTrip.truckId);
    } else if (inspectionType === 'PRE_TRIP' && todayRoute && todayRoute.truckId) {
      setSelectedTruck(todayRoute.truckId);
    }
  }, [inspectionType, todayPreTrip, todayRoute]);

  const handleAddDefect = (component: string) => {
    Alert.prompt(
      'Add Defect',
      `Describe the issue with ${component}:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: (issue) => {
            if (issue) {
              setDefects([...defects, { component, issue, severity: 'MEDIUM' }]);
              setSafeToOperate(false);
            }
          },
        },
      ]
    );
  };

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
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  const handleSubmit = async () => {
    const truckId = selectedTruck || assignedTruck?.id;
    if (!truckId) {
      Alert.alert('Error', 'Please select a truck');
      return;
    }

    if (!odometer || parseFloat(odometer) <= 0) {
      Alert.alert('Error', 'Please enter a valid odometer reading');
      return;
    }

    if (!state) {
      Alert.alert('Error', 'Please select a state');
      return;
    }

    const truck = trucks.find(t => t.id === truckId);
    const odometerValue = parseFloat(odometer);

    const dvir: DVIR = {
      id: `dvir-${Date.now()}`,
      driverId: user?.id || '',
      driverName: user?.name,
      truckId: truck?.id || '',
      truckUnitNumber: truck?.unitNumber,
      type: inspectionType,
      defects,
      photos,
      safeToOperate,
      notes,
      odometer: odometerValue,
      state,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    await addDVIR(dvir);
    
    if (inspectionType === 'PRE_TRIP' && todayRoute && todayRoute.truckId !== truckId) {
      Alert.alert(
        'Truck Changed',
        'You selected a different truck than assigned to your route. The route truck has been updated.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } else {
      Alert.alert('Success', 'DVIR submitted successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Inspection Type</Text>
        <View style={styles.typeButtons}>
          <TouchableOpacity
            style={[styles.typeButton, inspectionType === 'PRE_TRIP' && styles.typeButtonActive]}
            onPress={() => setInspectionType('PRE_TRIP')}
          >
            <Text style={[styles.typeButtonText, inspectionType === 'PRE_TRIP' && styles.typeButtonTextActive]}>
              Pre-Trip
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, inspectionType === 'POST_TRIP' && styles.typeButtonActive]}
            onPress={() => setInspectionType('POST_TRIP')}
          >
            <Text style={[styles.typeButtonText, inspectionType === 'POST_TRIP' && styles.typeButtonTextActive]}>
              Post-Trip
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Vehicle</Text>
          {(assignedTruck || selectedTruck) && (
            <TouchableOpacity onPress={() => setShowTruckSelector(!showTruckSelector)}>
              <Text style={styles.changeTruckButton}>Change Truck</Text>
            </TouchableOpacity>
          )}
        </View>
        {!showTruckSelector && (assignedTruck || selectedTruck) ? (
          <View style={styles.truckInfo}>
            <Text style={styles.truckText}>
              Unit {(trucks.find(t => t.id === selectedTruck) || assignedTruck)?.unitNumber}
            </Text>
            <Text style={styles.truckSubtext}>
              {selectedTruck && selectedTruck !== assignedTruck?.id ? 'Selected Truck' : 'Assigned Truck'}
            </Text>
          </View>
        ) : (
          <View>
            {trucks.map(truck => (
              <TouchableOpacity
                key={truck.id}
                style={[styles.truckOption, selectedTruck === truck.id && styles.truckOptionSelected]}
                onPress={() => {
                  setSelectedTruck(truck.id);
                  setShowTruckSelector(false);
                }}
              >
                <Text style={styles.truckOptionText}>Unit {truck.unitNumber}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Inspection Items</Text>
        <Text style={styles.sectionSubtitle}>Tap any item to report a defect</Text>
        {INSPECTION_ITEMS.map(item => {
          const hasDefect = defects.some(d => d.component === item);
          return (
            <TouchableOpacity
              key={item}
              style={[styles.inspectionItem, hasDefect && styles.inspectionItemDefect]}
              onPress={() => handleAddDefect(item)}
            >
              <Text style={styles.inspectionItemText}>{item}</Text>
              {hasDefect ? (
                <AlertTriangle size={20} color={Colors.error} />
              ) : (
                <CheckCircle size={20} color={Colors.success} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {defects.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reported Defects ({defects.length})</Text>
          {defects.map((defect, index) => (
            <View key={index} style={styles.defectCard}>
              <Text style={styles.defectComponent}>{defect.component}</Text>
              <Text style={styles.defectIssue}>{defect.issue}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Photos ({photos.length})</Text>
        <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
          <Camera size={24} color={Colors.primary} />
          <Text style={styles.photoButtonText}>Take Photo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Odometer Reading *</Text>
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
        <Text style={styles.sectionTitle}>Additional Notes</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Enter any additional notes..."
          placeholderTextColor={Colors.textSecondary}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.section}>
        <View style={[styles.safetyCard, safeToOperate ? styles.safetyCardSafe : styles.safetyCardUnsafe]}>
          <Text style={styles.safetyText}>
            {safeToOperate ? 'Vehicle is SAFE to operate' : 'Vehicle is UNSAFE to operate'}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Submit Inspection</Text>
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
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  changeTruckButton: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  typeButtons: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center' as const,
  },
  typeButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  typeButtonTextActive: {
    color: Colors.background,
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
  truckOption: {
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  truckOptionSelected: {
    borderColor: Colors.primary,
  },
  truckOptionText: {
    fontSize: 16,
    color: Colors.text,
  },
  inspectionItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  inspectionItemDefect: {
    borderWidth: 2,
    borderColor: Colors.error,
  },
  inspectionItemText: {
    fontSize: 16,
    color: Colors.text,
  },
  defectCard: {
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  defectComponent: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  defectIssue: {
    fontSize: 14,
    color: Colors.textSecondary,
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
  input: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    height: 48,
  },
  notesInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    minHeight: 100,
  },
  safetyCard: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  safetyCardSafe: {
    backgroundColor: Colors.success,
  },
  safetyCardUnsafe: {
    backgroundColor: Colors.error,
  },
  safetyText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.background,
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
