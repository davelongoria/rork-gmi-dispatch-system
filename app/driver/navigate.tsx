import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  Modal,
  TextInput,
  Image,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import Colors from '@/constants/colors';
import {
  Navigation,
  CheckCircle,
  Home,
  Warehouse,
  PauseCircle,
  TruckIcon as Truck,
  Camera,
  X,
  Edit3,
  AlertCircle,
  MapPin,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import type { Job } from '@/types';

export default function NavigateScreen() {
  const params = useLocalSearchParams();
  const jobId = Array.isArray(params.jobId) ? params.jobId[0] : params.jobId;
  const destination = Array.isArray(params.destination) ? params.destination[0] : params.destination;
  const { user } = useAuth();
  const { 
    jobs, 
    routes, 
    updateJob, 
    updateRoute, 
    dumpSites, 
    yards, 
    addDumpTicket, 
    trucks,
    addMileageLog 
  } = useData();
  
  const job = jobs.find(j => j.id === jobId);
  const route = job ? routes.find(r => r.id === job.routeId) : null;
  
  const [showDumpModal, setShowDumpModal] = useState<boolean>(false);
  const [dumpTicketNumber, setDumpTicketNumber] = useState<string>('');
  const [dumpWeight, setDumpWeight] = useState<string>('');
  const [dumpFee, setDumpFee] = useState<string>('');
  const [dumpTicketPhoto, setDumpTicketPhoto] = useState<string | null>(null);
  const [dumpNotes, setDumpNotes] = useState<string>('');
  const [showJobActionModal, setShowJobActionModal] = useState<boolean>(false);
  const [showArrivedAtCustomerModal, setShowArrivedAtCustomerModal] = useState<boolean>(false);
  const [showContainerSizeModal, setShowContainerSizeModal] = useState<boolean>(false);
  const [showDumpSiteModal, setShowDumpSiteModal] = useState<boolean>(false);
  const [newContainerSize, setNewContainerSize] = useState<string>('');
  const [selectedDumpSiteId, setSelectedDumpSiteId] = useState<string>('');
  const [showDumpSelectionModal, setShowDumpSelectionModal] = useState<boolean>(false);
  const [manualDumpAddress, setManualDumpAddress] = useState<string>('');
  const [isNavigating, setIsNavigating] = useState<boolean>(false);

  useEffect(() => {
    console.log('Navigate screen params:', { jobId, destination });
    console.log('Job found:', job ? 'yes' : 'no');
    console.log('Route found:', route ? 'yes' : 'no');
    if (jobId) {
      console.log('Looking for job with ID:', jobId);
      console.log('Available jobs:', jobs.map(j => ({ id: j.id, status: j.status })));
    }
  }, [jobId, destination, job, route, jobs]);

  if (!job || !route) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Navigation' }} />
        <Text style={styles.errorText}>Job not found</Text>
        <Text style={styles.errorText}>Job ID: {String(jobId)}</Text>
      </View>
    );
  }

  const openExternalNavigation = () => {
    let address = '';
    let title = '';
    
    if (destination === 'customer') {
      address = job.address;
      title = 'Customer Location';
    } else if (destination === 'dump') {
      const dumpSiteId = job.dumpSiteId || route.dumpSiteEndId;
      const dumpSite = dumpSites.find(d => d.id === dumpSiteId);
      if (dumpSite) {
        address = dumpSite.address;
        title = dumpSite.name;
      }
    } else if (destination === 'yard') {
      const yard = yards.find(y => y.id === route.yardStartId);
      if (yard) {
        address = yard.address;
        title = yard.name;
      }
    }

    if (!address) return;

    const encodedAddress = encodeURIComponent(address);
    
    if (Platform.OS === 'ios') {
      Linking.openURL(`maps://maps.apple.com/?daddr=${encodedAddress}`);
    } else {
      Linking.openURL(`google.navigation:q=${encodedAddress}`);
    }
  };

  const handleArrivedAtDump = () => {
    setShowDumpModal(true);
  };

  const handleTakeTicketPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is needed to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setDumpTicketPhoto(result.assets[0].uri);
    }
  };

  const handleSubmitDumpTicket = async () => {
    const dumpSiteId = job.dumpSiteId || route.dumpSiteEndId;
    const dumpSite = dumpSites.find(d => d.id === dumpSiteId);
    const truck = trucks.find(t => t.id === route.truckId);

    const dumpTicketId = `dt_${Date.now()}`;
    await addDumpTicket({
      id: dumpTicketId,
      driverId: user?.id || '',
      driverName: user?.name,
      truckId: route.truckId || '',
      truckUnitNumber: truck?.unitNumber,
      dumpSiteId: dumpSiteId || '',
      dumpSiteName: dumpSite?.name,
      jobId: job.id,
      ticketNumber: dumpTicketNumber,
      date: new Date().toISOString(),
      netWeight: dumpWeight ? parseFloat(dumpWeight) : undefined,
      fee: dumpFee ? parseFloat(dumpFee) : undefined,
      ticketPhoto: dumpTicketPhoto || undefined,
      notes: dumpNotes,
      createdAt: new Date().toISOString(),
    });

    await updateJob(job.id, {
      status: 'AT_DUMP',
      dumpTicketId,
    });

    setShowDumpModal(false);
    setDumpTicketNumber('');
    setDumpWeight('');
    setDumpFee('');
    setDumpTicketPhoto(null);
    setDumpNotes('');
    
    setShowJobActionModal(true);
  };

  const handleCompleteJob = async () => {
    Alert.prompt(
      'Complete Job',
      'Enter current odometer reading:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async (odometerText) => {
            const odometer = odometerText ? parseFloat(odometerText) : undefined;
            
            await updateJob(job.id, {
              status: 'COMPLETED',
              completedAt: new Date().toISOString(),
              completedByDriverId: user?.id,
              endMileage: odometer,
            });

            if (odometer && route.truckId) {
              await addMileageLog({
                id: `ml_${Date.now()}`,
                driverId: user?.id || '',
                driverName: user?.name,
                truckId: route.truckId,
                truckUnitNumber: route.truckUnitNumber,
                timestamp: new Date().toISOString(),
                odometer,
                jobId: job.id,
                routeId: route.id,
                createdAt: new Date().toISOString(),
              });
            }
            
            setShowJobActionModal(false);
            Alert.alert('Success', 'Job completed', [
              { text: 'OK', onPress: () => router.back() }
            ]);
          },
        },
      ],
      'plain-text',
      '',
      'numeric'
    );
  };

  const handleReturnToCustomer = () => {
    setShowJobActionModal(false);
    const address = encodeURIComponent(job.address);
    
    if (Platform.OS === 'ios') {
      Linking.openURL(`maps://maps.apple.com/?daddr=${address}`);
    } else {
      Linking.openURL(`google.navigation:q=${address}`);
    }
  };

  const handleReturnToDropYard = () => {
    setShowJobActionModal(false);
    const yardStart = route.yardStartId ? yards.find(y => y.id === route.yardStartId) : null;
    
    if (!yardStart) {
      Alert.alert('Error', 'No drop yard assigned');
      return;
    }
    
    const address = encodeURIComponent(yardStart.address);
    if (Platform.OS === 'ios') {
      Linking.openURL(`maps://maps.apple.com/?daddr=${address}`);
    } else {
      Linking.openURL(`google.navigation:q=${address}`);
    }
  };

  const handleSuspendLoad = () => {
    Alert.alert(
      'Suspend Load',
      'Will you complete service today?',
      [
        {
          text: 'Yes',
          onPress: async () => {
            await updateJob(job.id, {
              status: 'SUSPENDED',
              suspendedReason: 'Suspended - will complete today',
              willCompleteToday: true,
            });
            setShowJobActionModal(false);
            Alert.alert('Load Suspended', 'Job marked as suspended. You can resume it later today.', [
              { text: 'OK', onPress: () => router.back() }
            ]);
          },
        },
        {
          text: 'No',
          onPress: async () => {
            await updateJob(job.id, {
              status: 'SUSPENDED',
              suspendedReason: 'Suspended - needs reassignment',
              willCompleteToday: false,
              routeId: undefined,
            });
            
            if (route) {
              const updatedJobIds = route.jobIds.filter(jId => jId !== job.id);
              await updateRoute(route.id, { jobIds: updatedJobIds });
            }
            
            setShowJobActionModal(false);
            Alert.alert('Load Suspended', 'Job returned to dispatcher for reassignment.', [
              { text: 'OK', onPress: () => router.back() }
            ]);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleArrivedAtCustomer = () => {
    setShowArrivedAtCustomerModal(true);
  };

  const handleDryRun = () => {
    Alert.prompt(
      'Dry Run',
      'Enter notes for dry run (container empty or not present):',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete as Dry Run',
          onPress: async (notes) => {
            await updateJob(job.id, {
              status: 'COMPLETED',
              completedAt: new Date().toISOString(),
              completedByDriverId: user?.id,
              isDryRun: true,
              dryRunNotes: notes || 'Container empty or not present',
            });
            setShowArrivedAtCustomerModal(false);
            Alert.alert('Success', 'Job completed as dry run', [
              { text: 'OK', onPress: () => router.back() }
            ]);
          },
        },
      ],
      'plain-text'
    );
  };

  const handleChangeContainerSize = () => {
    setNewContainerSize(job.containerSize || '');
    setShowContainerSizeModal(true);
  };

  const handleSaveContainerSize = async () => {
    await updateJob(job.id, {
      containerSize: newContainerSize,
    });
    
    setShowContainerSizeModal(false);
    Alert.alert('Success', 'Container size updated');
  };

  const handleChangeDumpSite = () => {
    setSelectedDumpSiteId(job.dumpSiteId || route.dumpSiteEndId || '');
    setShowDumpSiteModal(true);
  };

  const handleSaveDumpSite = async () => {
    await updateJob(job.id, {
      dumpSiteId: selectedDumpSiteId,
    });
    
    setShowDumpSiteModal(false);
    Alert.alert('Success', 'Dump site updated');
  };

  const handleNavigateToDump = () => {
    setShowDumpSelectionModal(true);
  };

  const handleDumpSiteSelected = () => {
    let address = '';
    
    if (selectedDumpSiteId === 'manual') {
      if (!manualDumpAddress.trim()) {
        Alert.alert('Error', 'Please enter a dump address');
        return;
      }
      address = manualDumpAddress.trim();
    } else if (selectedDumpSiteId) {
      const dumpSite = dumpSites.find(d => d.id === selectedDumpSiteId);
      if (!dumpSite) {
        Alert.alert('Error', 'Dump site not found');
        return;
      }
      address = dumpSite.address;
      
      updateJob(job.id, {
        dumpSiteId: selectedDumpSiteId,
      });
    } else {
      Alert.alert('Error', 'Please select a dump site or enter a manual address');
      return;
    }

    setShowDumpSelectionModal(false);
    setIsNavigating(true);
    
    const encodedAddress = encodeURIComponent(address);
    if (Platform.OS === 'ios') {
      Linking.openURL(`maps://maps.apple.com/?daddr=${encodedAddress}`);
    } else {
      Linking.openURL(`google.navigation:q=${encodedAddress}`);
    }
  };

  const handleNavigateToCustomer = () => {
    const address = encodeURIComponent(job.address);
    
    if (Platform.OS === 'ios') {
      Linking.openURL(`maps://maps.apple.com/?daddr=${address}`);
    } else {
      Linking.openURL(`google.navigation:q=${address}`);
    }
  };

  const dumpSite = dumpSites.find(d => d.id === (job.dumpSiteId || route.dumpSiteEndId));

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Navigation',
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
        }} 
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.jobCard}>
          <Text style={styles.jobTitle}>Current Job</Text>
          
          <View style={styles.jobDetailRow}>
            <MapPin size={16} color={Colors.textSecondary} />
            <Text style={styles.jobAddress}>{job.address}</Text>
          </View>
          
          {job.customerName && (
            <Text style={styles.jobDetail}>Customer: {job.customerName}</Text>
          )}
          
          {job.containerSize && (
            <View style={styles.jobDetailWithEdit}>
              <Text style={styles.jobDetail}>Container: {job.containerSize}</Text>
              <TouchableOpacity onPress={handleChangeContainerSize}>
                <Edit3 size={14} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          )}
          
          {job.material && (
            <Text style={styles.jobDetail}>Material: {job.material}</Text>
          )}

          {dumpSite && (
            <View style={styles.jobDetailWithEdit}>
              <Text style={styles.jobDetail}>Dump: {dumpSite.name}</Text>
              <TouchableOpacity onPress={handleChangeDumpSite}>
                <Edit3 size={14} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.navigationSection}>
          <Text style={styles.sectionTitle}>Navigation</Text>
          
          {!isNavigating ? (
            <>
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => {
                  setIsNavigating(true);
                  handleNavigateToCustomer();
                }}
              >
                <Navigation size={20} color={Colors.primary} />
                <Text style={styles.navButtonText}>Navigate to Customer</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.navButton, styles.navButtonDump]}
                onPress={() => {
                  setIsNavigating(true);
                  handleNavigateToDump();
                }}
              >
                <Navigation size={20} color={Colors.background} />
                <Text style={[styles.navButtonText, styles.navButtonTextWhite]}>Navigate to Dump</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.navigatingCard}>
              <View style={styles.navigatingHeader}>
                <Navigation size={24} color={Colors.primary} />
                <Text style={styles.navigatingText}>Navigation Active</Text>
              </View>
              <Text style={styles.navigatingSubtext}>Follow directions in your maps app</Text>
              <TouchableOpacity
                style={styles.stopNavButton}
                onPress={() => setIsNavigating(false)}
              >
                <X size={18} color={Colors.error} />
                <Text style={styles.stopNavButtonText}>Stop Navigation</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Job Actions</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleArrivedAtCustomer}
          >
            <Home size={20} color={Colors.background} />
            <Text style={styles.actionButtonText}>Arrived at Customer</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonDump]}
            onPress={handleArrivedAtDump}
          >
            <Truck size={20} color={Colors.background} />
            <Text style={styles.actionButtonText}>Arrived at Dump</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonWarning]}
            onPress={handleSuspendLoad}
          >
            <PauseCircle size={20} color={Colors.error} />
            <Text style={[styles.actionButtonText, styles.actionButtonTextDark]}>Suspend Load</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSuccess]}
            onPress={() => setShowJobActionModal(true)}
          >
            <CheckCircle size={20} color={Colors.background} />
            <Text style={styles.actionButtonText}>Finish Job</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showDumpModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDumpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dump Ticket Entry</Text>
              <TouchableOpacity onPress={() => setShowDumpModal(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.inputLabel}>Ticket Number</Text>
              <TextInput
                style={styles.input}
                value={dumpTicketNumber}
                onChangeText={setDumpTicketNumber}
                placeholder="Enter ticket number"
                placeholderTextColor={Colors.textSecondary}
              />

              <Text style={styles.inputLabel}>Weight (tons)</Text>
              <TextInput
                style={styles.input}
                value={dumpWeight}
                onChangeText={setDumpWeight}
                placeholder="Enter weight"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="decimal-pad"
              />

              <Text style={styles.inputLabel}>Fee ($)</Text>
              <TextInput
                style={styles.input}
                value={dumpFee}
                onChangeText={setDumpFee}
                placeholder="Enter fee"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="decimal-pad"
              />

              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={dumpNotes}
                onChangeText={setDumpNotes}
                placeholder="Additional notes"
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity style={styles.photoButton} onPress={handleTakeTicketPhoto}>
                <Camera size={20} color={Colors.primary} />
                <Text style={styles.photoButtonText}>
                  {dumpTicketPhoto ? 'Retake Photo' : 'Take Ticket Photo'}
                </Text>
              </TouchableOpacity>

              {dumpTicketPhoto && (
                <Image source={{ uri: dumpTicketPhoto }} style={styles.ticketPreview} />
              )}

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmitDumpTicket}
              >
                <Text style={styles.submitButtonText}>Submit Ticket</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showJobActionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowJobActionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>What&apos;s Next?</Text>
              <TouchableOpacity onPress={() => setShowJobActionModal(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.modalActionButton}
                onPress={handleCompleteJob}
              >
                <CheckCircle size={32} color={Colors.success} />
                <Text style={styles.modalActionButtonText}>Complete Job</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalActionButton}
                onPress={handleReturnToCustomer}
              >
                <Home size={32} color={Colors.primary} />
                <Text style={styles.modalActionButtonText}>Return to Customer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalActionButton}
                onPress={handleReturnToDropYard}
              >
                <Warehouse size={32} color={Colors.accent} />
                <Text style={styles.modalActionButtonText}>Return to Drop Yard</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalActionButton}
                onPress={() => {
                  setShowJobActionModal(false);
                  handleSuspendLoad();
                }}
              >
                <PauseCircle size={32} color={Colors.error} />
                <Text style={styles.modalActionButtonText}>Suspend Load</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showArrivedAtCustomerModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowArrivedAtCustomerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Arrived at Customer</Text>
              <TouchableOpacity onPress={() => setShowArrivedAtCustomerModal(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.modalActionButton}
                onPress={() => setShowArrivedAtCustomerModal(false)}
              >
                <CheckCircle size={32} color={Colors.success} />
                <Text style={styles.modalActionButtonText}>Continue with Service</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalActionButton}
                onPress={handleDryRun}
              >
                <AlertCircle size={32} color={Colors.warning} />
                <Text style={styles.modalActionButtonText}>Mark as Dry Run</Text>
                <Text style={styles.modalActionButtonSubtext}>Container empty or not present</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showContainerSizeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowContainerSizeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Container Size</Text>
              <TouchableOpacity onPress={() => setShowContainerSizeModal(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <Text style={styles.inputLabel}>Container Size</Text>
              <TextInput
                style={styles.input}
                value={newContainerSize}
                onChangeText={setNewContainerSize}
                placeholder="e.g., 20 yard, 30 yard"
                placeholderTextColor={Colors.textSecondary}
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary]}
                  onPress={() => setShowContainerSizeModal(false)}
                >
                  <Text style={styles.buttonSecondaryText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary]}
                  onPress={handleSaveContainerSize}
                >
                  <Text style={styles.buttonPrimaryText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDumpSiteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDumpSiteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Dump Site</Text>
              <TouchableOpacity onPress={() => setShowDumpSiteModal(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <Text style={styles.inputLabel}>Select Dump Site</Text>
              {dumpSites.filter(d => d.active).map(dumpSite => (
                <TouchableOpacity
                  key={dumpSite.id}
                  style={[
                    styles.selectionItem,
                    selectedDumpSiteId === dumpSite.id && styles.selectionItemSelected,
                  ]}
                  onPress={() => setSelectedDumpSiteId(dumpSite.id)}
                >
                  <Text
                    style={[
                      styles.selectionText,
                      selectedDumpSiteId === dumpSite.id && styles.selectionTextSelected,
                    ]}
                  >
                    {dumpSite.name}
                  </Text>
                  <Text style={styles.selectionSubtext}>{dumpSite.address}</Text>
                </TouchableOpacity>
              ))}

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary]}
                  onPress={() => setShowDumpSiteModal(false)}
                >
                  <Text style={styles.buttonSecondaryText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary]}
                  onPress={handleSaveDumpSite}
                >
                  <Text style={styles.buttonPrimaryText}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDumpSelectionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDumpSelectionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Dump Location</Text>
              <TouchableOpacity onPress={() => setShowDumpSelectionModal(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <Text style={styles.inputLabel}>Choose from available dump sites:</Text>
              {dumpSites.filter(d => d.active).map(dumpSite => (
                <TouchableOpacity
                  key={dumpSite.id}
                  style={[
                    styles.selectionItem,
                    selectedDumpSiteId === dumpSite.id && styles.selectionItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedDumpSiteId(dumpSite.id);
                    setManualDumpAddress('');
                  }}
                >
                  <Text
                    style={[
                      styles.selectionText,
                      selectedDumpSiteId === dumpSite.id && styles.selectionTextSelected,
                    ]}
                  >
                    {dumpSite.name}
                  </Text>
                  <Text style={styles.selectionSubtext}>{dumpSite.address}</Text>
                </TouchableOpacity>
              ))}

              <Text style={[styles.inputLabel, { marginTop: 20 }]}>Or enter a manual address:</Text>
              <TouchableOpacity
                style={[
                  styles.selectionItem,
                  selectedDumpSiteId === 'manual' && styles.selectionItemSelected,
                ]}
                onPress={() => {
                  setSelectedDumpSiteId('manual');
                }}
              >
                <Text
                  style={[
                    styles.selectionText,
                    selectedDumpSiteId === 'manual' && styles.selectionTextSelected,
                  ]}
                >
                  Manual Address
                </Text>
              </TouchableOpacity>
              
              {selectedDumpSiteId === 'manual' && (
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={manualDumpAddress}
                  onChangeText={setManualDumpAddress}
                  placeholder="Enter dump address"
                  placeholderTextColor={Colors.textSecondary}
                  multiline
                  numberOfLines={3}
                  autoFocus
                />
              )}

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary]}
                  onPress={() => {
                    setShowDumpSelectionModal(false);
                    setSelectedDumpSiteId('');
                    setManualDumpAddress('');
                  }}
                >
                  <Text style={styles.buttonSecondaryText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary]}
                  onPress={handleDumpSiteSelected}
                >
                  <Text style={styles.buttonPrimaryText}>Navigate</Text>
                </TouchableOpacity>
              </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center' as const,
    marginTop: 24,
  },
  jobCard: {
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  jobDetailRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 8,
    marginBottom: 8,
  },
  jobAddress: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  jobDetail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  jobDetailWithEdit: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 4,
  },
  navigationSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  navButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 8,
  },
  navButtonDump: {
    backgroundColor: '#FF9500',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  navButtonTextWhite: {
    color: Colors.background,
  },
  actionsSection: {
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 8,
  },
  actionButtonDump: {
    backgroundColor: '#FF9500',
  },
  actionButtonWarning: {
    backgroundColor: Colors.backgroundSecondary,
  },
  actionButtonSuccess: {
    backgroundColor: Colors.success,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.background,
  },
  actionButtonTextDark: {
    color: Colors.error,
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
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundSecondary,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  modalScroll: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top' as const,
  },
  photoButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.backgroundSecondary,
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  photoButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  ticketPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 12,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center' as const,
    marginTop: 20,
    marginBottom: 20,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.background,
  },
  actionButtons: {
    padding: 20,
    gap: 16,
  },
  modalActionButton: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center' as const,
    gap: 12,
  },
  modalActionButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  modalActionButtonSubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
  },
  form: {
    padding: 20,
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
  selectionItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  selectionItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.backgroundSecondary,
  },
  selectionText: {
    fontSize: 16,
    color: Colors.text,
  },
  selectionTextSelected: {
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  selectionSubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  navigatingCard: {
    backgroundColor: Colors.background,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  navigatingHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginBottom: 8,
  },
  navigatingText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  navigatingSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  stopNavButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.backgroundSecondary,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  stopNavButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.error,
  },
});
