import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import Colors from '@/constants/colors';
import { Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import type { DumpTicket } from '@/types';

export default function DumpTicketScreen() {
  const { user } = useAuth();
  const { addDumpTicket, drivers, trucks, dumpSites } = useData();
  const router = useRouter();
  const [selectedDumpSite, setSelectedDumpSite] = useState<string>('');
  const [ticketNumber, setTicketNumber] = useState<string>('');
  const [grossWeight, setGrossWeight] = useState<string>('');
  const [tareWeight, setTareWeight] = useState<string>('');
  const [fee, setFee] = useState<string>('');
  const [ticketPhoto, setTicketPhoto] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const driver = drivers.find(d => d.email === user?.email);
  const assignedTruck = trucks.find(t => t.id === driver?.assignedTruckId);

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
      setTicketPhoto(result.assets[0].uri);
    }
  };

  const calculateNetWeight = () => {
    const gross = parseFloat(grossWeight) || 0;
    const tare = parseFloat(tareWeight) || 0;
    return gross - tare;
  };

  const handleSubmit = async () => {
    if (!selectedDumpSite || !ticketPhoto) {
      Alert.alert('Error', 'Please select dump site and take ticket photo');
      return;
    }

    if (!assignedTruck) {
      Alert.alert('Error', 'No truck assigned');
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

    const dumpSite = dumpSites.find(d => d.id === selectedDumpSite);

    const dumpTicket: DumpTicket = {
      id: `dump-${Date.now()}`,
      driverId: user?.id || '',
      driverName: user?.name,
      truckId: assignedTruck.id,
      truckUnitNumber: assignedTruck.unitNumber,
      dumpSiteId: selectedDumpSite,
      dumpSiteName: dumpSite?.name,
      ticketNumber: ticketNumber || undefined,
      date: new Date().toISOString(),
      grossWeight: grossWeight ? parseFloat(grossWeight) : undefined,
      tareWeight: tareWeight ? parseFloat(tareWeight) : undefined,
      netWeight: calculateNetWeight() || undefined,
      fee: fee ? parseFloat(fee) : undefined,
      ticketPhoto,
      latitude,
      longitude,
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
    };

    await addDumpTicket(dumpTicket);
    Alert.alert('Success', 'Dump ticket submitted successfully', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle</Text>
        {assignedTruck ? (
          <View style={styles.truckInfo}>
            <Text style={styles.truckText}>Unit {assignedTruck.unitNumber}</Text>
          </View>
        ) : (
          <Text style={styles.errorText}>No truck assigned</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Dump Site *</Text>
        {dumpSites.map(site => (
          <TouchableOpacity
            key={site.id}
            style={[styles.siteOption, selectedDumpSite === site.id && styles.siteOptionSelected]}
            onPress={() => setSelectedDumpSite(site.id)}
          >
            <Text style={styles.siteOptionText}>{site.name}</Text>
            <Text style={styles.siteOptionSubtext}>{site.address}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Ticket Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter ticket number (optional)"
          placeholderTextColor={Colors.textSecondary}
          value={ticketNumber}
          onChangeText={setTicketNumber}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Gross Weight (lbs)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter gross weight"
          placeholderTextColor={Colors.textSecondary}
          value={grossWeight}
          onChangeText={setGrossWeight}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Tare Weight (lbs)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter tare weight"
          placeholderTextColor={Colors.textSecondary}
          value={tareWeight}
          onChangeText={setTareWeight}
          keyboardType="numeric"
        />
      </View>

      {grossWeight && tareWeight && (
        <View style={styles.netWeightCard}>
          <Text style={styles.netWeightLabel}>Net Weight</Text>
          <Text style={styles.netWeightValue}>
            {calculateNetWeight().toLocaleString()} lbs
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.label}>Fee ($)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter fee (optional)"
          placeholderTextColor={Colors.textSecondary}
          value={fee}
          onChangeText={setFee}
          keyboardType="decimal-pad"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Ticket Photo *</Text>
        <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
          <Camera size={24} color={Colors.primary} />
          <Text style={styles.photoButtonText}>
            {ticketPhoto ? 'Retake Photo' : 'Take Photo of Ticket'}
          </Text>
        </TouchableOpacity>
        {ticketPhoto && (
          <Text style={styles.photoSuccess}>Ticket photo captured</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Enter any additional notes..."
          placeholderTextColor={Colors.textSecondary}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Submit Dump Ticket</Text>
      </TouchableOpacity>
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
  notesInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 80,
  },
  siteOption: {
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  siteOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.backgroundSecondary,
  },
  siteOptionText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  siteOptionSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  netWeightCard: {
    backgroundColor: Colors.success,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center' as const,
    marginBottom: 20,
  },
  netWeightLabel: {
    fontSize: 14,
    color: Colors.background,
    opacity: 0.9,
    marginBottom: 4,
  },
  netWeightValue: {
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
});
