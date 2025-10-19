import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useData } from '@/contexts/DataContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  MapPin,
  CheckCircle,
  Camera,
  ArrowLeft,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import type { ResidentialRoute, ResidentialStop } from '@/types';

export default function ResidentialRouteDetailsScreen() {
  const { routeId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const {
    residentialRoutes,
    residentialStops,
    updateResidentialRoute,
    updateResidentialStop,
  } = useData();
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);

  const route = residentialRoutes.find((r) => r.id === routeId) as ResidentialRoute | undefined;
  const [orderedStopIds, setOrderedStopIds] = useState<string[]>([]);
  const [isReorderMode, setIsReorderMode] = useState<boolean>(false);
  const [notOutModalVisible, setNotOutModalVisible] = useState<boolean>(false);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [notOutPhoto, setNotOutPhoto] = useState<string | null>(null);
  const [notOutNotes, setNotOutNotes] = useState<string>('');

  useEffect(() => {
    if (route) {
      setOrderedStopIds([...route.customerIds]);
    }
  }, [route?.id, route?.customerIds]);

  if (!route) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Route not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const moveStopUp = (index: number) => {
    if (index === 0) return;
    const newStops = [...orderedStopIds];
    [newStops[index - 1], newStops[index]] = [newStops[index], newStops[index - 1]];
    setOrderedStopIds(newStops);
  };

  const moveStopDown = (index: number) => {
    if (index === orderedStopIds.length - 1) return;
    const newStops = [...orderedStopIds];
    [newStops[index], newStops[index + 1]] = [newStops[index + 1], newStops[index]];
    setOrderedStopIds(newStops);
  };

  const handleSaveOrder = async () => {
    await updateResidentialRoute(route.id, {
      customerIds: orderedStopIds,
    });
    setIsReorderMode(false);
    Alert.alert('Success', 'Route order updated');
  };

  const handleStartRoute = async () => {
    await updateResidentialRoute(route.id, {
      status: 'IN_PROGRESS',
      startedAt: new Date().toISOString(),
    });
    Alert.alert('Success', 'Route started');
  };

  const handleCompleteStop = async (stopId: string) => {
    const stop = residentialStops.find((s) => s.id === stopId);
    if (!stop) return;

    await updateResidentialStop(stopId, {
      status: 'COMPLETED',
      completedAt: new Date().toISOString(),
      completedByDriverId: user?.id,
    });
    Alert.alert('Success', 'Stop marked as complete');
  };

  const handleNotOut = (stopId: string) => {
    setSelectedStopId(stopId);
    setNotOutPhoto(null);
    setNotOutNotes('');
    setNotOutModalVisible(true);
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setNotOutPhoto(base64Image);
    }
  };

  const handleSubmitNotOut = async () => {
    if (!selectedStopId) return;
    if (!notOutPhoto) {
      Alert.alert('Error', 'Please take a photo');
      return;
    }

    const stop = residentialStops.find((s) => s.id === selectedStopId);
    if (!stop) return;

    await updateResidentialStop(selectedStopId, {
      status: 'NOT_OUT',
      notOutPhoto: notOutPhoto,
      notOutTimestamp: new Date().toISOString(),
      notOutNotes: notOutNotes,
    });

    setNotOutModalVisible(false);
    Alert.alert('Success', 'Not out reported to dispatcher');
  };

  const handleCompleteRoute = async () => {
    const incompleteStops = orderedStopIds.filter((stopId) => {
      const stop = residentialStops.find((s) => s.id === stopId);
      return stop && stop.status !== 'COMPLETED' && stop.status !== 'NOT_OUT';
    });

    if (incompleteStops.length > 0) {
      Alert.alert(
        'Incomplete Stops',
        `You have ${incompleteStops.length} incomplete stop(s). Please complete all stops before finishing the route.`
      );
      return;
    }

    Alert.alert('Complete Route', 'Are you sure you want to complete this route?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete',
        onPress: async () => {
          await updateResidentialRoute(route.id, {
            status: 'COMPLETED',
            completedAt: new Date().toISOString(),
          });
          Alert.alert('Success', 'Route completed', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        },
      },
    ]);
  };

  const getStopStatus = (stopId: string) => {
    const stop = residentialStops.find((s) => s.id === stopId);
    return stop?.status || 'PENDING';
  };

  const getStopStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return colors.success;
      case 'NOT_OUT':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{route.name}</Text>
          <Text style={styles.headerSubtitle}>
            {orderedStopIds.length} stops • {route.dayOfWeek}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Route Status</Text>
          <Text style={[styles.statusValue, { color: colors.primary }]}>{route.status}</Text>

          {route.status === 'DISPATCHED' && (
            <TouchableOpacity style={styles.startButton} onPress={handleStartRoute}>
              <Text style={styles.startButtonText}>Start Route</Text>
            </TouchableOpacity>
          )}

          {route.status === 'IN_PROGRESS' && (
            <TouchableOpacity style={styles.completeRouteButton} onPress={handleCompleteRoute}>
              <Text style={styles.completeRouteButtonText}>Complete Route</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.stopsHeader}>
          <Text style={styles.stopsTitle}>Stops</Text>
          {route.status === 'DISPATCHED' || route.status === 'IN_PROGRESS' ? (
            <TouchableOpacity
              style={styles.reorderButton}
              onPress={
                isReorderMode
                  ? handleSaveOrder
                  : () => setIsReorderMode(true)
              }
            >
              <GripVertical size={18} color={colors.primary} />
              <Text style={styles.reorderButtonText}>
                {isReorderMode ? 'Save Order' : 'Reorder'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {isReorderMode ? (
          orderedStopIds.map((stopId, index) => {
            const stop = residentialStops.find((s) => s.id === stopId);
            if (!stop) return null;

            return (
              <View key={stop.id} style={styles.reorderStopCard}>
                <View style={styles.reorderStopContent}>
                  <View style={styles.reorderStopNumber}>
                    <Text style={styles.reorderStopNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.reorderStopInfo}>
                    <Text style={styles.stopCustomerName}>{stop.customerName || 'Customer'}</Text>
                    <Text style={styles.stopAddress} numberOfLines={1}>
                      {stop.address}
                    </Text>
                  </View>
                </View>
                <View style={styles.reorderStopActions}>
                  <TouchableOpacity
                    onPress={() => moveStopUp(index)}
                    disabled={index === 0}
                    style={[
                      styles.reorderActionButton,
                      index === 0 && styles.reorderActionButtonDisabled,
                    ]}
                  >
                    <ChevronUp size={20} color={index === 0 ? colors.textSecondary : colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => moveStopDown(index)}
                    disabled={index === orderedStopIds.length - 1}
                    style={[
                      styles.reorderActionButton,
                      index === orderedStopIds.length - 1 && styles.reorderActionButtonDisabled,
                    ]}
                  >
                    <ChevronDown
                      size={20}
                      color={index === orderedStopIds.length - 1 ? colors.textSecondary : colors.primary}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        ) : (
          orderedStopIds.map((stopId, index) => {
            const stop = residentialStops.find((s) => s.id === stopId);
            if (!stop) return null;

            const status = getStopStatus(stopId);
            const isCompleted = status === 'COMPLETED';
            const isNotOut = status === 'NOT_OUT';

            return (
              <View
                key={stop.id}
                style={[
                  styles.stopCard,
                  isCompleted && styles.stopCardCompleted,
                  isNotOut && styles.stopCardNotOut,
                ]}
              >
                <View style={styles.stopHeader}>
                  <View style={styles.stopNumber}>
                    <Text style={styles.stopNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.stopInfo}>
                    <Text style={styles.stopCustomerName}>{stop.customerName || 'Customer'}</Text>
                    <View style={styles.stopAddressRow}>
                      <MapPin size={14} color={colors.textSecondary} />
                      <Text style={styles.stopAddress}>{stop.address}</Text>
                    </View>
                  </View>
                  <View style={[styles.stopStatusBadge, { backgroundColor: getStopStatusColor(status) }]}>
                    <Text style={styles.stopStatusText}>{status}</Text>
                  </View>
                </View>

                {route.status === 'IN_PROGRESS' && !isCompleted && !isNotOut && (
                  <View style={styles.stopActions}>
                    <TouchableOpacity
                      style={styles.completeButton}
                      onPress={() => handleCompleteStop(stopId)}
                    >
                      <CheckCircle size={18} color={colors.background} />
                      <Text style={styles.completeButtonText}>Complete</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.notOutButton}
                      onPress={() => handleNotOut(stopId)}
                    >
                      <Camera size={18} color={colors.background} />
                      <Text style={styles.notOutButtonText}>Not Out</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={notOutModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setNotOutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Report Not Out</Text>

            <Text style={styles.modalLabel}>Take Photo</Text>
            {notOutPhoto ? (
              <View style={styles.photoContainer}>
                <Image source={{ uri: notOutPhoto }} style={styles.photoPreview} />
                <TouchableOpacity style={styles.retakeButton} onPress={handleTakePhoto}>
                  <Text style={styles.retakeButtonText}>Retake</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.takePhotoButton} onPress={handleTakePhoto}>
                <Camera size={24} color={colors.background} />
                <Text style={styles.takePhotoButtonText}>Take Photo</Text>
              </TouchableOpacity>
            )}

            <Text style={[styles.modalLabel, { marginTop: 16 }]}>Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={notOutNotes}
              onChangeText={setNotOutNotes}
              placeholder="Add any notes..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setNotOutModalVisible(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleSubmitNotOut}
              >
                <Text style={styles.modalButtonPrimaryText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      padding: 16,
      backgroundColor: colors.background,
      gap: 12,
    },
    headerBackButton: {
      padding: 4,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700' as const,
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
    },
    statusCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    statusLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    statusValue: {
      fontSize: 20,
      fontWeight: '700' as const,
      marginBottom: 12,
    },
    startButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center' as const,
    },
    startButtonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.background,
    },
    completeRouteButton: {
      backgroundColor: colors.success,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center' as const,
    },
    completeRouteButtonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.background,
    },
    stopsHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: 12,
    },
    stopsTitle: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.text,
    },
    reorderButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    reorderButtonText: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.primary,
    },
    stopCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    stopCardCompleted: {
      opacity: 0.6,
    },
    stopCardNotOut: {
      borderWidth: 2,
      borderColor: colors.error,
    },
    stopHeader: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: 12,
      marginBottom: 12,
    },
    stopNumber: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    stopNumberText: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: colors.background,
    },
    stopInfo: {
      flex: 1,
    },
    stopCustomerName: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: 4,
    },
    stopAddressRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
    },
    stopAddress: {
      fontSize: 14,
      color: colors.textSecondary,
      flex: 1,
    },
    stopStatusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    stopStatusText: {
      fontSize: 10,
      fontWeight: '600' as const,
      color: colors.background,
    },
    stopActions: {
      flexDirection: 'row' as const,
      gap: 8,
    },
    completeButton: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colors.success,
      paddingVertical: 12,
      borderRadius: 8,
      gap: 6,
    },
    completeButtonText: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.background,
    },
    notOutButton: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colors.error,
      paddingVertical: 12,
      borderRadius: 8,
      gap: 6,
    },
    notOutButtonText: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.background,
    },
    reorderStopCard: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    reorderStopContent: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
    },
    reorderStopNumber: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    reorderStopNumberText: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: colors.background,
    },
    reorderStopInfo: {
      flex: 1,
    },
    reorderStopActions: {
      flexDirection: 'column' as const,
      gap: 4,
    },
    reorderActionButton: {
      padding: 4,
    },
    reorderActionButtonDisabled: {
      opacity: 0.3,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: 24,
    },
    errorText: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: 16,
    },
    backButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    backButtonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.background,
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
      padding: 24,
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: 24,
    },
    modalLabel: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: 12,
    },
    takePhotoButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 8,
      gap: 8,
    },
    takePhotoButtonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.background,
    },
    photoContainer: {
      marginBottom: 16,
    },
    photoPreview: {
      width: '100%',
      height: 200,
      borderRadius: 8,
      marginBottom: 8,
    },
    retakeButton: {
      backgroundColor: colors.backgroundSecondary,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: 'center' as const,
    },
    retakeButtonText: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.primary,
    },
    notesInput: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      minHeight: 80,
      textAlignVertical: 'top' as const,
      marginBottom: 24,
    },
    modalButtons: {
      flexDirection: 'row' as const,
      gap: 12,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center' as const,
    },
    modalButtonPrimary: {
      backgroundColor: colors.primary,
    },
    modalButtonPrimaryText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.background,
    },
    modalButtonSecondary: {
      backgroundColor: colors.backgroundSecondary,
    },
    modalButtonSecondaryText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.text,
    },
  });
