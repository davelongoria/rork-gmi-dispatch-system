import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useData } from '@/contexts/DataContext';
import Colors from '@/constants/colors';
import { CheckCircle, XCircle, AlertCircle, Camera, MapPin, FileText } from 'lucide-react-native';
import type { CommercialStop, StopStatus, StopHistoryEntry } from '@/types';
import * as ImagePicker from 'expo-image-picker';

export default function DriverCommercialRouteScreen() {
  const { routeId } = useLocalSearchParams<{ routeId: string }>();
  const { commercialRoutes, commercialStops, updateCommercialStop, updateCommercialRoute } = useData();
  
  const route = commercialRoutes.find(r => r.id === routeId);
  const [selectedStop, setSelectedStop] = useState<CommercialStop | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [completionNotes, setCompletionNotes] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<StopStatus>('COMPLETED');
  const [photos, setPhotos] = useState<string[]>([]);

  if (!route) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Route Not Found' }} />
        <Text style={styles.errorText}>Route not found</Text>
      </View>
    );
  }

  const stops = route.stopIds
    .map(id => commercialStops.find(s => s.id === id))
    .filter((s): s is CommercialStop => s !== undefined);

  const completedStops = stops.filter(s => s.status === 'COMPLETED').length;
  const totalStops = stops.length;
  const progress = totalStops > 0 ? (completedStops / totalStops) * 100 : 0;

  const handleStopPress = (stop: CommercialStop) => {
    if (stop.status === 'COMPLETED') {
      Alert.alert('Already Completed', 'This stop has already been marked as completed.');
      return;
    }
    setSelectedStop(stop);
    setCompletionNotes('');
    setSelectedStatus('COMPLETED');
    setPhotos([]);
    setModalVisible(true);
  };

  const handleTakePhoto = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Camera is not available on web');
      return;
    }

    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos(prev => [...prev, result.assets[0].uri]);
    }
  };

  const handleSelectPhoto = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Photo library permission is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const uris = result.assets.map(asset => asset.uri);
      setPhotos(prev => [...prev, ...uris]);
    }
  };

  const handleSaveStop = async () => {
    if (!selectedStop) return;

    const historyEntry: StopHistoryEntry = {
      id: `history-${Date.now()}`,
      timestamp: new Date().toISOString(),
      driverId: route.driverId,
      driverName: route.driverName,
      status: selectedStatus,
      notes: completionNotes || undefined,
      photos: photos.length > 0 ? photos : undefined,
    };

    const updatedHistory = [...(selectedStop.history || []), historyEntry];

    await updateCommercialStop(selectedStop.id, {
      status: selectedStatus,
      history: updatedHistory,
      ...(selectedStatus === 'COMPLETED' && {
        completedAt: new Date().toISOString(),
        completedByDriverId: route.driverId,
        completionPhotos: photos.length > 0 ? photos : undefined,
      }),
      ...(selectedStatus === 'NOT_OUT' && {
        notOutReason: completionNotes || 'Not out',
      }),
      ...(selectedStatus === 'BLOCKED' && {
        blockedReason: completionNotes || 'Blocked',
        issuePhotos: photos.length > 0 ? photos : undefined,
        issueNotes: completionNotes || undefined,
      }),
    });

    const allStopsCompleted = stops.every(s => 
      s.id === selectedStop.id ? selectedStatus === 'COMPLETED' : s.status === 'COMPLETED'
    );

    if (allStopsCompleted && route.status !== 'COMPLETED') {
      await updateCommercialRoute(route.id, {
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
      });
      Alert.alert('Success', 'Stop marked and route completed!');
    } else {
      Alert.alert('Success', 'Stop status updated');
    }

    setModalVisible(false);
    setSelectedStop(null);
  };

  const getStatusIcon = (status: StopStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle size={24} color={Colors.success} />;
      case 'NOT_OUT':
        return <AlertCircle size={24} color={Colors.warning} />;
      case 'BLOCKED':
        return <XCircle size={24} color={Colors.error} />;
      default:
        return <View style={styles.pendingCircle} />;
    }
  };

  const getStatusColor = (status: StopStatus) => {
    switch (status) {
      case 'COMPLETED':
        return Colors.success;
      case 'NOT_OUT':
        return Colors.warning;
      case 'BLOCKED':
        return Colors.error;
      default:
        return Colors.border;
    }
  };

  const startRoute = async () => {
    if (route.status === 'PLANNED' || route.status === 'DISPATCHED') {
      await updateCommercialRoute(route.id, {
        status: 'IN_PROGRESS',
        startedAt: new Date().toISOString(),
      });
      Alert.alert('Success', 'Route started!');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: route.name }} />
      
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Route Progress</Text>
          <Text style={styles.progressText}>{completedStops} / {totalStops} stops</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
        
        {route.status === 'DISPATCHED' && (
          <TouchableOpacity style={styles.startRouteButton} onPress={startRoute}>
            <Text style={styles.startRouteButtonText}>Start Route</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.stopsContainer}>
        {stops.map((stop, index) => (
          <TouchableOpacity
            key={stop.id}
            style={[
              styles.stopCard,
              stop.status !== 'PENDING' && styles.stopCardCompleted,
            ]}
            onPress={() => handleStopPress(stop)}
          >
            <View style={styles.stopHeader}>
              <View style={styles.stopNumberContainer}>
                <Text style={styles.stopNumber}>{index + 1}</Text>
              </View>
              <View style={styles.stopInfo}>
                <Text style={styles.stopName}>{stop.jobName}</Text>
                {stop.customerName && (
                  <Text style={styles.stopLinked}>Linked: {stop.customerName}</Text>
                )}
                <View style={styles.stopAddressRow}>
                  <MapPin size={14} color={Colors.textSecondary} />
                  <Text style={styles.stopAddress}>{stop.address}</Text>
                </View>
                <Text style={styles.stopDetails}>
                  {stop.containerCount}x {stop.containerSize}yd containers
                </Text>
                {stop.specialInstructions && (
                  <View style={styles.instructionsContainer}>
                    <FileText size={14} color={Colors.primary} />
                    <Text style={styles.instructionsText}>{stop.specialInstructions}</Text>
                  </View>
                )}
              </View>
              <View style={styles.stopStatus}>
                {getStatusIcon(stop.status)}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Stop Status</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              {selectedStop && (
                <>
                  <Text style={styles.modalStopName}>{selectedStop.jobName}</Text>
                  <Text style={styles.modalStopAddress}>{selectedStop.address}</Text>

                  <Text style={styles.modalLabel}>Status</Text>
                  <View style={styles.statusButtons}>
                    <TouchableOpacity
                      style={[
                        styles.statusButton,
                        { borderColor: Colors.success },
                        selectedStatus === 'COMPLETED' && { backgroundColor: Colors.success },
                      ]}
                      onPress={() => setSelectedStatus('COMPLETED')}
                    >
                      <CheckCircle 
                        size={20} 
                        color={selectedStatus === 'COMPLETED' ? Colors.background : Colors.success} 
                      />
                      <Text
                        style={[
                          styles.statusButtonText,
                          selectedStatus === 'COMPLETED' && styles.statusButtonTextSelected,
                        ]}
                      >
                        Done
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.statusButton,
                        { borderColor: Colors.warning },
                        selectedStatus === 'NOT_OUT' && { backgroundColor: Colors.warning },
                      ]}
                      onPress={() => setSelectedStatus('NOT_OUT')}
                    >
                      <AlertCircle 
                        size={20} 
                        color={selectedStatus === 'NOT_OUT' ? Colors.background : Colors.warning} 
                      />
                      <Text
                        style={[
                          styles.statusButtonText,
                          selectedStatus === 'NOT_OUT' && styles.statusButtonTextSelected,
                        ]}
                      >
                        Not Out
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.statusButton,
                        { borderColor: Colors.error },
                        selectedStatus === 'BLOCKED' && { backgroundColor: Colors.error },
                      ]}
                      onPress={() => setSelectedStatus('BLOCKED')}
                    >
                      <XCircle 
                        size={20} 
                        color={selectedStatus === 'BLOCKED' ? Colors.background : Colors.error} 
                      />
                      <Text
                        style={[
                          styles.statusButtonText,
                          selectedStatus === 'BLOCKED' && styles.statusButtonTextSelected,
                        ]}
                      >
                        Blocked
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.modalLabel, { marginTop: 24 }]}>Notes (Optional)</Text>
                  <TextInput
                    style={styles.textArea}
                    value={completionNotes}
                    onChangeText={setCompletionNotes}
                    placeholder="Add any notes or issues..."
                    placeholderTextColor={Colors.textSecondary}
                    multiline
                    numberOfLines={4}
                  />

                  <Text style={[styles.modalLabel, { marginTop: 24 }]}>Photos (Optional)</Text>
                  <View style={styles.photoButtons}>
                    <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
                      <Camera size={20} color={Colors.primary} />
                      <Text style={styles.photoButtonText}>Take Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.photoButton} onPress={handleSelectPhoto}>
                      <FileText size={20} color={Colors.primary} />
                      <Text style={styles.photoButtonText}>Choose Photos</Text>
                    </TouchableOpacity>
                  </View>
                  {photos.length > 0 && (
                    <Text style={styles.photoCount}>{photos.length} photo(s) added</Text>
                  )}

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={styles.modalButtonSecondary}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.modalButtonPrimary,
                        { backgroundColor: getStatusColor(selectedStatus) },
                      ]}
                      onPress={handleSaveStop}
                    >
                      <Text style={styles.modalButtonPrimaryText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
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
  progressSection: {
    backgroundColor: Colors.background,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  progressHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 4,
    overflow: 'hidden' as const,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  startRouteButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center' as const,
    marginTop: 12,
  },
  startRouteButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.background,
  },
  stopsContainer: {
    flex: 1,
    padding: 16,
  },
  stopCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  stopCardCompleted: {
    borderColor: Colors.success,
    opacity: 0.8,
  },
  stopHeader: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  stopNumberContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  stopNumber: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.background,
  },
  stopInfo: {
    flex: 1,
  },
  stopName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  stopLinked: {
    fontSize: 12,
    color: Colors.primary,
    marginBottom: 4,
  },
  stopAddressRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 4,
    marginBottom: 4,
  },
  stopAddress: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  stopDetails: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  instructionsContainer: {
    flexDirection: 'row' as const,
    gap: 4,
    backgroundColor: Colors.backgroundSecondary,
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  instructionsText: {
    fontSize: 12,
    color: Colors.text,
    flex: 1,
  },
  stopStatus: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  pendingCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center' as const,
    marginTop: 24,
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
    maxHeight: '90%',
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
  modalCloseText: {
    fontSize: 28,
    color: Colors.text,
  },
  modalForm: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  modalStopName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  modalStopAddress: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  statusButtons: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  statusButton: {
    flex: 1,
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    gap: 4,
  },

  statusButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  statusButtonTextSelected: {
    color: Colors.background,
  },
  textArea: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    minHeight: 100,
    textAlignVertical: 'top' as const,
  },
  photoButtons: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.backgroundSecondary,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  photoCount: {
    fontSize: 13,
    color: Colors.primary,
    marginTop: 8,
    textAlign: 'center' as const,
  },
  modalButtons: {
    flexDirection: 'row' as const,
    gap: 12,
    marginTop: 24,
  },
  modalButtonPrimary: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  modalButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.background,
  },
  modalButtonSecondary: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  modalButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
});
