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
import { useTheme } from '@/contexts/ThemeContext';
import { CheckCircle, XCircle, Camera, MapPin, FileText, Package } from 'lucide-react-native';
import type { ContainerJob, StopStatus, StopHistoryEntry } from '@/types';
import * as ImagePicker from 'expo-image-picker';

export default function DriverContainerRouteScreen() {
  const { routeId } = useLocalSearchParams<{ routeId: string }>();
  const { containerRoutes, containerJobs, updateContainerJob, updateContainerRoute } = useData();
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);
  
  const route = containerRoutes.find(r => r.id === routeId);
  const [selectedJob, setSelectedJob] = useState<ContainerJob | null>(null);
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

  const jobs = route.jobIds
    .map(id => containerJobs.find(j => j.id === id))
    .filter((j): j is ContainerJob => j !== undefined);

  const completedJobs = jobs.filter(j => j.status === 'COMPLETED').length;
  const totalJobs = jobs.length;
  const progress = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

  const handleJobPress = (job: ContainerJob) => {
    if (job.status === 'COMPLETED') {
      Alert.alert('Already Completed', 'This job has already been marked as completed.');
      return;
    }
    setSelectedJob(job);
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

  const handleSaveJob = async () => {
    if (!selectedJob) return;

    const historyEntry: StopHistoryEntry = {
      id: `history-${Date.now()}`,
      timestamp: new Date().toISOString(),
      driverId: route.driverId,
      driverName: route.driverName,
      status: selectedStatus,
      notes: completionNotes || undefined,
      photos: photos.length > 0 ? photos : undefined,
    };

    const updatedHistory = [...(selectedJob.history || []), historyEntry];

    await updateContainerJob(selectedJob.id, {
      status: selectedStatus,
      history: updatedHistory,
      ...(selectedStatus === 'COMPLETED' && {
        completedAt: new Date().toISOString(),
        completedByDriverId: route.driverId,
        completionPhotos: photos.length > 0 ? photos : undefined,
        completionNotes: completionNotes || undefined,
      }),
      ...(selectedStatus !== 'COMPLETED' && {
        issuePhotos: photos.length > 0 ? photos : undefined,
        issueNotes: completionNotes || undefined,
      }),
    });

    const allJobsCompleted = jobs.every(j => 
      j.id === selectedJob.id ? selectedStatus === 'COMPLETED' : j.status === 'COMPLETED'
    );

    if (allJobsCompleted && route.status !== 'COMPLETED') {
      await updateContainerRoute(route.id, {
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
      });
      Alert.alert('Success', 'Job marked and route completed!');
    } else {
      Alert.alert('Success', 'Job status updated');
    }

    setModalVisible(false);
    setSelectedJob(null);
  };

  const getStatusIcon = (status: StopStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle size={24} color={colors.success} />;
      case 'NOT_OUT':
      case 'BLOCKED':
        return <XCircle size={24} color={colors.error} />;
      default:
        return <View style={styles.pendingCircle} />;
    }
  };

  const getStatusColor = (status: StopStatus) => {
    switch (status) {
      case 'COMPLETED':
        return colors.success;
      case 'NOT_OUT':
      case 'BLOCKED':
        return colors.error;
      default:
        return colors.border;
    }
  };

  const getJobTypeLabel = (type: string) => {
    switch (type) {
      case 'TOTER_DELIVERY':
        return 'Toter Delivery';
      case 'COMM_CONTAINER_DELIVERY':
        return 'Container Delivery';
      case 'CONTAINER_PICKUP':
        return 'Container Pickup';
      case 'TOTER_PICKUP':
        return 'Toter Pickup';
      case 'MISSED_PICKUP':
        return 'Missed Pickup';
      case 'EXTRA_PICKUP':
        return 'Extra Pickup';
      default:
        return type;
    }
  };

  const startRoute = async () => {
    if (route.status === 'PLANNED' || route.status === 'DISPATCHED') {
      await updateContainerRoute(route.id, {
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
          <Text style={styles.progressText}>{completedJobs} / {totalJobs} jobs</Text>
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

      <ScrollView style={styles.jobsContainer}>
        {jobs.map((job, index) => (
          <TouchableOpacity
            key={job.id}
            style={[
              styles.jobCard,
              job.status !== 'PENDING' && styles.jobCardCompleted,
            ]}
            onPress={() => handleJobPress(job)}
          >
            <View style={styles.jobHeader}>
              <View style={styles.jobNumberContainer}>
                <Text style={styles.jobNumber}>{index + 1}</Text>
              </View>
              <View style={styles.jobInfo}>
                <View style={styles.jobTypeRow}>
                  <Package size={16} color={colors.primary} />
                  <Text style={styles.jobType}>{getJobTypeLabel(job.type)}</Text>
                </View>
                {job.customerName && (
                  <Text style={styles.jobLinked}>Customer: {job.customerName}</Text>
                )}
                <View style={styles.jobAddressRow}>
                  <MapPin size={14} color={colors.textSecondary} />
                  <Text style={styles.jobAddress}>{job.address}</Text>
                </View>
                {job.containerType && (
                  <Text style={styles.jobDetails}>
                    {job.containerCount || 1}x {job.containerType === 'TOTER' ? 'Toter' : `${job.containerType}yd`}
                  </Text>
                )}
                {job.notes && (
                  <View style={styles.notesContainer}>
                    <FileText size={14} color={colors.primary} />
                    <Text style={styles.notesText}>{job.notes}</Text>
                  </View>
                )}
              </View>
              <View style={styles.jobStatus}>
                {getStatusIcon(job.status)}
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
              <Text style={styles.modalTitle}>Update Job Status</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              {selectedJob && (
                <>
                  <Text style={styles.modalJobType}>{getJobTypeLabel(selectedJob.type)}</Text>
                  <Text style={styles.modalJobAddress}>{selectedJob.address}</Text>

                  <Text style={styles.modalLabel}>Status</Text>
                  <View style={styles.statusButtons}>
                    <TouchableOpacity
                      style={[
                        styles.statusButton,
                        { borderColor: colors.success },
                        selectedStatus === 'COMPLETED' && { backgroundColor: colors.success },
                      ]}
                      onPress={() => setSelectedStatus('COMPLETED')}
                    >
                      <CheckCircle 
                        size={20} 
                        color={selectedStatus === 'COMPLETED' ? colors.background : colors.success} 
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
                        { borderColor: colors.error },
                        selectedStatus === 'BLOCKED' && { backgroundColor: colors.error },
                      ]}
                      onPress={() => setSelectedStatus('BLOCKED')}
                    >
                      <XCircle 
                        size={20} 
                        color={selectedStatus === 'BLOCKED' ? colors.background : colors.error} 
                      />
                      <Text
                        style={[
                          styles.statusButtonText,
                          selectedStatus === 'BLOCKED' && styles.statusButtonTextSelected,
                        ]}
                      >
                        Issue
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.modalLabel, { marginTop: 24 }]}>Notes (Optional)</Text>
                  <TextInput
                    style={styles.textArea}
                    value={completionNotes}
                    onChangeText={setCompletionNotes}
                    placeholder="Add any notes or issues..."
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    numberOfLines={4}
                  />

                  <Text style={[styles.modalLabel, { marginTop: 24 }]}>Photos (Optional)</Text>
                  <View style={styles.photoButtons}>
                    <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
                      <Camera size={20} color={colors.primary} />
                      <Text style={styles.photoButtonText}>Take Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.photoButton} onPress={handleSelectPhoto}>
                      <FileText size={20} color={colors.primary} />
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
                      onPress={handleSaveJob}
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

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  progressSection: {
    backgroundColor: colors.background,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    color: colors.text,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.primary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 4,
    overflow: 'hidden' as const,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  startRouteButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center' as const,
    marginTop: 12,
  },
  startRouteButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.background,
  },
  jobsContainer: {
    flex: 1,
    padding: 16,
  },
  jobCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  jobCardCompleted: {
    borderColor: colors.success,
    opacity: 0.8,
  },
  jobHeader: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  jobNumberContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  jobNumber: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.background,
  },
  jobInfo: {
    flex: 1,
  },
  jobTypeRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 4,
  },
  jobType: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  jobLinked: {
    fontSize: 12,
    color: colors.primary,
    marginBottom: 4,
  },
  jobAddressRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 4,
    marginBottom: 4,
  },
  jobAddress: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  jobDetails: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  notesContainer: {
    flexDirection: 'row' as const,
    gap: 4,
    backgroundColor: colors.backgroundSecondary,
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  notesText: {
    fontSize: 12,
    color: colors.text,
    flex: 1,
  },
  jobStatus: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  pendingCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center' as const,
    marginTop: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end' as const,
  },
  modalContent: {
    backgroundColor: colors.background,
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
    color: colors.text,
  },
  modalCloseText: {
    fontSize: 28,
    color: colors.text,
  },
  modalForm: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  modalJobType: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  modalJobAddress: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
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
    color: colors.text,
  },
  statusButtonTextSelected: {
    color: colors.background,
  },
  textArea: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
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
    backgroundColor: colors.backgroundSecondary,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  photoCount: {
    fontSize: 13,
    color: colors.primary,
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
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  modalButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.background,
  },
  modalButtonSecondary: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  modalButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
});
