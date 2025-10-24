import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import Colors from '@/constants/colors';
import {
  MapPin,
  Navigation,
  CheckCircle,
  Circle,
  GripVertical,
  Play,
  Package,
  Truck as TruckIcon,
  Camera,
  X,
  PauseCircle,
  Home,
  Warehouse,
  Edit3,
  AlertCircle,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import type { Job } from '@/types';

export default function RouteDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { routes, jobs, updateRoute, updateJob, dumpSites, yards, addDumpTicket, trucks, addMileageLog } = useData();
  
  const route = routes.find(r => r.id === id);
  const [routeJobs, setRouteJobs] = useState<Job[]>([]);
  const [showDumpModal, setShowDumpModal] = useState<boolean>(false);
  const [selectedJobForDump, setSelectedJobForDump] = useState<Job | null>(null);
  const [dumpTicketNumber, setDumpTicketNumber] = useState<string>('');
  const [dumpWeight, setDumpWeight] = useState<string>('');
  const [dumpFee, setDumpFee] = useState<string>('');
  const [dumpTicketPhoto, setDumpTicketPhoto] = useState<string | null>(null);
  const [dumpNotes, setDumpNotes] = useState<string>('');
  const [showJobActionModal, setShowJobActionModal] = useState<boolean>(false);
  const [selectedJobForAction, setSelectedJobForAction] = useState<Job | null>(null);
  const [showArrivedAtCustomerModal, setShowArrivedAtCustomerModal] = useState<boolean>(false);
  const [selectedJobForArrival, setSelectedJobForArrival] = useState<Job | null>(null);
  const [showContainerSizeModal, setShowContainerSizeModal] = useState<boolean>(false);
  const [showDumpSiteModal, setShowDumpSiteModal] = useState<boolean>(false);
  const [selectedJobForEdit, setSelectedJobForEdit] = useState<Job | null>(null);
  const [newContainerSize, setNewContainerSize] = useState<string>('');
  const [selectedDumpSiteId, setSelectedDumpSiteId] = useState<string>('');
  const [showAddressEditModal, setShowAddressEditModal] = useState<boolean>(false);
  const [newAddress, setNewAddress] = useState<string>('');

  useEffect(() => {
    if (route) {
      const jobsList = route.jobIds
        .map(jobId => jobs.find(j => j.id === jobId))
        .filter((j): j is Job => j !== undefined);
      setRouteJobs(jobsList);

      if (route.status === 'IN_PROGRESS') {
        const allCompleted = jobsList.every(j => j.status === 'COMPLETED');
        const allCompletedOrSuspended = jobsList.every(j => 
          j.status === 'COMPLETED' || (j.status === 'SUSPENDED' && !j.willCompleteToday)
        );

        if (allCompleted && jobsList.length > 0) {
          updateRoute(route.id, {
            status: 'COMPLETED',
            completedAt: new Date().toISOString(),
          });
        }
      }
    }
  }, [route, jobs, updateRoute]);

  if (!route) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Route Not Found' }} />
        <Text style={styles.errorText}>Route not found</Text>
      </View>
    );
  }

  const handleStartRoute = async () => {
    if (route.status !== 'DISPATCHED') {
      Alert.alert('Error', 'This route has not been dispatched yet. Please contact dispatch.');
      return;
    }

    Alert.alert(
      'Start Route',
      'Are you ready to start this route?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: async () => {
            await updateRoute(route.id, {
              status: 'IN_PROGRESS',
              startedAt: new Date().toISOString(),
            });
            console.log('Route started:', route.id, 'Status changed to IN_PROGRESS');
            Alert.alert('Success', 'Route started');
          },
        },
      ]
    );
  };

  const handleCompleteRoute = async () => {
    Alert.alert(
      'Complete Route',
      'Are you sure you want to complete this route?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            await updateRoute(route.id, {
              status: 'COMPLETED',
              completedAt: new Date().toISOString(),
            });
            Alert.alert('Success', 'Route completed successfully');
          },
        },
      ]
    );
  };

  const handleSendRemainingJobsToDispatch = async () => {
    const incompleteJobs = routeJobs.filter(j => 
      j.status !== 'COMPLETED' && 
      !(j.status === 'SUSPENDED' && !j.willCompleteToday)
    );

    if (incompleteJobs.length === 0) {
      Alert.alert('No Jobs', 'All jobs are completed or suspended for reassignment.');
      return;
    }

    Alert.alert(
      'Send Jobs to Dispatch',
      `Send ${incompleteJobs.length} remaining job(s) back to dispatch and complete your route?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send & Complete',
          onPress: async () => {
            for (const job of incompleteJobs) {
              await updateJob(job.id, {
                status: 'SUSPENDED',
                suspendedReason: 'Returned to dispatch - driver emergency',
                willCompleteToday: false,
                routeId: undefined,
              });
            }

            const remainingJobIds = route.jobIds.filter(jId => 
              !incompleteJobs.find(j => j.id === jId)
            );

            await updateRoute(route.id, {
              jobIds: remainingJobIds,
              status: 'COMPLETED',
              completedAt: new Date().toISOString(),
            });

            Alert.alert('Success', `${incompleteJobs.length} job(s) sent back to dispatch. Route completed.`);
          },
        },
      ]
    );
  };

  const handleArrivedAtDump = (job: Job) => {
    setSelectedJobForDump(job);
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
    if (!selectedJobForDump) return;

    const dumpSiteId = selectedJobForDump.dumpSiteId || route?.dumpSiteEndId;
    const dumpSite = dumpSites.find(d => d.id === dumpSiteId);
    const truck = trucks.find(t => t.id === route?.truckId);

    const dumpTicketId = `dt_${Date.now()}`;
    await addDumpTicket({
      id: dumpTicketId,
      driverId: user?.id || '',
      driverName: user?.name,
      truckId: route?.truckId || '',
      truckUnitNumber: truck?.unitNumber,
      dumpSiteId: dumpSiteId || '',
      dumpSiteName: dumpSite?.name,
      jobId: selectedJobForDump.id,
      ticketNumber: dumpTicketNumber,
      date: new Date().toISOString(),
      netWeight: dumpWeight ? parseFloat(dumpWeight) : undefined,
      fee: dumpFee ? parseFloat(dumpFee) : undefined,
      ticketPhoto: dumpTicketPhoto || undefined,
      notes: dumpNotes,
      createdAt: new Date().toISOString(),
    });

    await updateJob(selectedJobForDump.id, {
      status: 'AT_DUMP',
      dumpTicketId,
    });

    setShowDumpModal(false);
    setSelectedJobForDump(null);
    setDumpTicketNumber('');
    setDumpWeight('');
    setDumpFee('');
    setDumpTicketPhoto(null);
    setDumpNotes('');
    
    setSelectedJobForAction(selectedJobForDump);
    setShowJobActionModal(true);
  };

  const handleCompleteJob = async () => {
    if (!selectedJobForAction) return;
    
    Alert.prompt(
      'Complete Job',
      'Enter current odometer reading:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async (odometerText) => {
            const odometer = odometerText ? parseFloat(odometerText) : undefined;
            
            await updateJob(selectedJobForAction.id, {
              status: 'COMPLETED',
              completedAt: new Date().toISOString(),
              completedByDriverId: user?.id,
              endMileage: odometer,
            });

            if (odometer && route?.truckId) {
              await addMileageLog({
                id: `ml_${Date.now()}`,
                driverId: user?.id || '',
                driverName: user?.name,
                truckId: route.truckId,
                truckUnitNumber: route.truckUnitNumber,
                timestamp: new Date().toISOString(),
                odometer,
                jobId: selectedJobForAction.id,
                routeId: route.id,
                createdAt: new Date().toISOString(),
              });
            }
            
            setShowJobActionModal(false);
            setSelectedJobForAction(null);
            Alert.alert('Success', 'Job completed');
          },
        },
      ],
      'plain-text',
      '',
      'numeric'
    );
  };

  const handleReturnToCustomer = async () => {
    if (!selectedJobForAction) return;
    
    const address = encodeURIComponent(selectedJobForAction.address);
    setShowJobActionModal(false);
    
    if (Platform.OS === 'ios') {
      Linking.openURL(`maps://maps.apple.com/?daddr=${address}`);
    } else {
      Linking.openURL(`google.navigation:q=${address}`);
    }
  };

  const handleReturnToDropYard = async () => {
    if (!selectedJobForAction) return;
    
    const yardStart = route?.yardStartId ? yards.find(y => y.id === route.yardStartId) : null;
    setShowJobActionModal(false);
    
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

  const handleStartJob = async (job: Job) => {
    const inProgressJob = routeJobs.find(j => j.status === 'IN_PROGRESS');
    if (inProgressJob) {
      Alert.alert('Job In Progress', 'Please complete or suspend the current job before starting another.');
      return;
    }

    Alert.prompt(
      'Start Job',
      'Enter current odometer reading:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: async (odometerText) => {
            const odometer = odometerText ? parseFloat(odometerText) : undefined;
            
            await updateJob(job.id, {
              status: 'IN_PROGRESS',
              startedAt: new Date().toISOString(),
              startMileage: odometer,
            });

            if (odometer && route?.truckId) {
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

            Alert.alert('Job Started', 'You can now navigate to the job location.');
          },
        },
      ],
      'plain-text',
      '',
      'numeric'
    );
  };

  const handleResumeJob = async (job: Job) => {
    const inProgressJob = routeJobs.find(j => j.status === 'IN_PROGRESS');
    if (inProgressJob) {
      Alert.alert('Job In Progress', 'Please complete or suspend the current job before resuming another.');
      return;
    }

    await updateJob(job.id, {
      status: 'IN_PROGRESS',
      suspendedReason: undefined,
    });
    Alert.alert('Job Resumed', 'You can now continue with this job.');
  };

  const handleSuspendLoad = async (job: Job) => {
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
              suspendedBy: user?.id,
              suspendedByDriverName: user?.name,
              suspendedDate: new Date().toISOString(),
            });
            Alert.alert('Load Suspended', 'Job marked as suspended. You can resume it later today.');
          },
        },
        {
          text: 'No',
          onPress: () => {
            Alert.prompt(
              'Suspend Location',
              'Enter address or location where job is suspended:',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Next',
                  onPress: (location) => {
                    Alert.prompt(
                      'Suspension Notes',
                      'Enter any additional notes (optional):',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Suspend',
                          onPress: async (notes) => {
                            await updateJob(job.id, {
                              status: 'SUSPENDED',
                              suspendedReason: `Suspended by ${user?.name || 'Driver'} on ${new Date().toLocaleDateString()}`,
                              willCompleteToday: false,
                              routeId: undefined,
                              suspendedBy: user?.id,
                              suspendedByDriverName: user?.name,
                              suspendedDate: new Date().toISOString(),
                              suspendedLocation: location || undefined,
                              suspendedNotes: notes || undefined,
                            });
                            
                            if (route) {
                              const updatedJobIds = route.jobIds.filter(jId => jId !== job.id);
                              await updateRoute(route.id, { jobIds: updatedJobIds });
                            }
                            
                            Alert.alert('Load Suspended', 'Job returned to dispatcher for reassignment.');
                          },
                        },
                      ],
                      'plain-text'
                    );
                  },
                },
              ],
              'plain-text'
            );
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleArrivedAtCustomer = (job: Job) => {
    setSelectedJobForArrival(job);
    setShowArrivedAtCustomerModal(true);
  };

  const handleDryRun = async () => {
    if (!selectedJobForArrival) return;

    Alert.prompt(
      'Dry Run',
      'Enter notes for dry run (container empty or not present):',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete as Dry Run',
          onPress: async (notes) => {
            await updateJob(selectedJobForArrival.id, {
              status: 'COMPLETED',
              completedAt: new Date().toISOString(),
              completedByDriverId: user?.id,
              isDryRun: true,
              dryRunNotes: notes || 'Container empty or not present',
            });
            setShowArrivedAtCustomerModal(false);
            setSelectedJobForArrival(null);
            Alert.alert('Success', 'Job completed as dry run');
          },
        },
      ],
      'plain-text'
    );
  };

  const handleChangeContainerSize = (job: Job) => {
    setSelectedJobForEdit(job);
    setNewContainerSize(job.containerSize || '');
    setShowContainerSizeModal(true);
  };

  const handleSaveContainerSize = async () => {
    if (!selectedJobForEdit) return;
    
    await updateJob(selectedJobForEdit.id, {
      containerSize: newContainerSize,
    });
    
    setShowContainerSizeModal(false);
    setSelectedJobForEdit(null);
    Alert.alert('Success', 'Container size updated');
  };

  const handleChangeDumpSite = (job: Job) => {
    setSelectedJobForEdit(job);
    setSelectedDumpSiteId(job.dumpSiteId || route?.dumpSiteEndId || '');
    setShowDumpSiteModal(true);
  };

  const handleEditAddress = (job: Job) => {
    setSelectedJobForEdit(job);
    setNewAddress(job.address);
    setShowAddressEditModal(true);
  };

  const handleSaveAddress = async () => {
    if (!selectedJobForEdit || !newAddress.trim()) {
      Alert.alert('Error', 'Please enter a valid address');
      return;
    }
    
    await updateJob(selectedJobForEdit.id, {
      address: newAddress,
    });
    
    setShowAddressEditModal(false);
    setSelectedJobForEdit(null);
    Alert.alert('Success', 'Job address updated');
  };

  const handleSaveDumpSite = async () => {
    if (!selectedJobForEdit) return;
    
    await updateJob(selectedJobForEdit.id, {
      dumpSiteId: selectedDumpSiteId,
    });
    
    setShowDumpSiteModal(false);
    setSelectedJobForEdit(null);
    Alert.alert('Success', 'Dump site updated');
  };

  const handleGetDirections = (job: Job) => {
    router.push({
      pathname: '/driver/navigate',
      params: { jobId: job.id, destination: 'customer' }
    });
  };

  const handleGetDirectionsToDump = (job?: Job) => {
    const dumpSiteId = job?.dumpSiteId || route.dumpSiteEndId;
    
    if (!dumpSiteId) {
      Alert.alert('Error', 'No dump site assigned');
      return;
    }
    
    const dumpSite = dumpSites.find(d => d.id === dumpSiteId);
    if (!dumpSite) {
      Alert.alert('Error', 'Dump site not found');
      return;
    }

    if (job) {
      router.push({
        pathname: '/driver/navigate',
        params: { jobId: job.id, destination: 'dump' }
      });
    }
  };

  const handleMoveJobUp = async (index: number) => {
    if (index === 0) return;
    const newJobIds = [...route.jobIds];
    [newJobIds[index - 1], newJobIds[index]] = [newJobIds[index], newJobIds[index - 1]];
    await updateRoute(route.id, { jobIds: newJobIds });
  };

  const handleMoveJobDown = async (index: number) => {
    if (index === route.jobIds.length - 1) return;
    const newJobIds = [...route.jobIds];
    [newJobIds[index], newJobIds[index + 1]] = [newJobIds[index + 1], newJobIds[index]];
    await updateRoute(route.id, { jobIds: newJobIds });
  };

  const getJobTypeLabel = (type: string) => {
    switch (type) {
      case 'DELIVER': return 'Deliver';
      case 'PICKUP': return 'Pickup';
      case 'SWITCH': return 'Switch Out';
      case 'ROUND_TRIP': return 'Round Trip';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return Colors.success;
      case 'IN_PROGRESS': return Colors.accent;
      case 'AT_DUMP': return '#FF9500';
      case 'SUSPENDED': return '#FF3B30';
      case 'ASSIGNED': return Colors.textSecondary;
      default: return Colors.textSecondary;
    }
  };

  const yardStart = route.yardStartId ? yards.find(y => y.id === route.yardStartId) : null;
  const dumpSiteEnd = route.dumpSiteEndId ? dumpSites.find(d => d.id === route.dumpSiteEndId) : null;

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: `Route #${route.id.slice(-6)}`,
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
        }} 
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.routeHeader}>
          <View style={styles.routeHeaderRow}>
            <Text style={styles.routeTitle}>Route #{route.id.slice(-6)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(route.status) }]}>
              <Text style={styles.statusBadgeText}>{route.status}</Text>
            </View>
          </View>
          
          <View style={styles.routeInfo}>
            <Text style={styles.routeInfoLabel}>Date:</Text>
            <Text style={styles.routeInfoValue}>{new Date(route.date).toLocaleDateString()}</Text>
          </View>
          
          {route.truckUnitNumber && (
            <View style={styles.routeInfo}>
              <Text style={styles.routeInfoLabel}>Truck:</Text>
              <Text style={styles.routeInfoValue}>{route.truckUnitNumber}</Text>
            </View>
          )}
          
          {yardStart && (
            <View style={styles.routeInfo}>
              <Text style={styles.routeInfoLabel}>Start Yard:</Text>
              <Text style={styles.routeInfoValue}>{yardStart.name}</Text>
            </View>
          )}
          
          {dumpSiteEnd && (
            <View style={styles.routeInfo}>
              <Text style={styles.routeInfoLabel}>Dump Site:</Text>
              <Text style={styles.routeInfoValue}>{dumpSiteEnd.name}</Text>
            </View>
          )}
        </View>

        {route.status === 'DISPATCHED' && (
          <TouchableOpacity style={styles.startButton} onPress={handleStartRoute}>
            <Play size={20} color={Colors.background} />
            <Text style={styles.startButtonText}>Start Route</Text>
          </TouchableOpacity>
        )}

        {route.status === 'IN_PROGRESS' && routeJobs.length > 0 && (
          <View style={styles.routeActionsContainer}>
            <TouchableOpacity 
              style={styles.completeRouteButton} 
              onPress={handleCompleteRoute}
            >
              <CheckCircle size={20} color={Colors.background} />
              <Text style={styles.completeRouteButtonText}>Complete Route</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.sendToDispatchButton} 
              onPress={handleSendRemainingJobsToDispatch}
            >
              <Package size={20} color={Colors.error} />
              <Text style={styles.sendToDispatchButtonText}>Send Jobs to Dispatch</Text>
            </TouchableOpacity>
          </View>
        )}

        {route.status === 'COMPLETED' && (
          <View style={styles.completedRouteBanner}>
            <CheckCircle size={20} color={Colors.success} />
            <Text style={styles.completedRouteText}>Route Completed</Text>
          </View>
        )}

        <View style={styles.jobsSection}>
          <Text style={styles.sectionTitle}>Jobs ({routeJobs.length})</Text>
          
          {routeJobs.length === 0 ? (
            <View style={styles.emptyState}>
              <Package size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyStateText}>No jobs assigned</Text>
            </View>
          ) : (
            routeJobs.map((job, index) => (
              <View key={job.id} style={styles.jobCard}>
                <View style={styles.jobHeader}>
                  <View style={styles.jobHeaderLeft}>
                    {job.status === 'COMPLETED' ? (
                      <CheckCircle size={24} color={Colors.success} />
                    ) : (
                      <Circle size={24} color={Colors.textSecondary} />
                    )}
                    <View style={styles.jobHeaderInfo}>
                      <Text style={styles.jobNumber}>Job #{index + 1}</Text>
                      <Text style={styles.jobType}>{getJobTypeLabel(job.type)}</Text>
                    </View>
                  </View>
                  
                  {route.status === 'IN_PROGRESS' && job.status !== 'COMPLETED' && (
                    <View style={styles.reorderButtons}>
                      <TouchableOpacity
                        style={[styles.reorderButton, index === 0 && styles.reorderButtonDisabled]}
                        onPress={() => handleMoveJobUp(index)}
                        disabled={index === 0}
                      >
                        <GripVertical size={16} color={index === 0 ? Colors.textSecondary : Colors.text} />
                        <Text style={[styles.reorderButtonText, index === 0 && styles.reorderButtonTextDisabled]}>↑</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.reorderButton, index === routeJobs.length - 1 && styles.reorderButtonDisabled]}
                        onPress={() => handleMoveJobDown(index)}
                        disabled={index === routeJobs.length - 1}
                      >
                        <GripVertical size={16} color={index === routeJobs.length - 1 ? Colors.textSecondary : Colors.text} />
                        <Text style={[styles.reorderButtonText, index === routeJobs.length - 1 && styles.reorderButtonTextDisabled]}>↓</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                <View style={styles.jobDetails}>
                  <View style={styles.jobDetailRow}>
                    <MapPin size={16} color={Colors.textSecondary} />
                    <Text style={styles.jobAddress}>{job.address}</Text>
                    {route.status === 'IN_PROGRESS' && job.status === 'IN_PROGRESS' && (
                      <TouchableOpacity onPress={() => handleEditAddress(job)}>
                        <Edit3 size={14} color={Colors.primary} />
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  {job.customerName && (
                    <Text style={styles.jobCustomer}>Customer: {job.customerName}</Text>
                  )}
                  
                  {job.containerSize && (
                    <View style={styles.jobDetailWithEdit}>
                      <Text style={styles.jobDetail}>Container: {job.containerSize}</Text>
                      {route.status === 'IN_PROGRESS' && job.status === 'IN_PROGRESS' && (
                        <TouchableOpacity onPress={() => handleChangeContainerSize(job)}>
                          <Edit3 size={14} color={Colors.primary} />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                  
                  {job.material && (
                    <Text style={styles.jobDetail}>Material: {job.material}</Text>
                  )}

                  {job.dumpSiteId && (
                    <View style={styles.jobDetailWithEdit}>
                      <Text style={styles.jobDetail}>
                        Dump: {dumpSites.find(d => d.id === job.dumpSiteId)?.name || 'Custom'}
                      </Text>
                      {route.status === 'IN_PROGRESS' && job.status === 'IN_PROGRESS' && (
                        <TouchableOpacity onPress={() => handleChangeDumpSite(job)}>
                          <Edit3 size={14} color={Colors.primary} />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                  
                  {job.notes && (
                    <Text style={styles.jobNotes}>Notes: {job.notes}</Text>
                  )}
                </View>

                {route.status === 'IN_PROGRESS' && 
                 job.status !== 'COMPLETED' &&
                 job.status !== 'IN_PROGRESS' &&
                 job.status !== 'AT_DUMP' &&
                 !(job.status === 'SUSPENDED' && job.willCompleteToday) && (
                  <TouchableOpacity
                    style={styles.startJobButton}
                    onPress={() => handleStartJob(job)}
                  >
                    <Play size={18} color={Colors.background} />
                    <Text style={styles.startJobButtonText}>Start Job</Text>
                  </TouchableOpacity>
                )}

                {route.status === 'IN_PROGRESS' && job.status === 'IN_PROGRESS' && (
                  <>
                    <View style={styles.jobActions}>
                      <TouchableOpacity
                        style={styles.directionsButton}
                        onPress={() => handleGetDirections(job)}
                      >
                        <Navigation size={18} color={Colors.primary} />
                        <Text style={styles.directionsButtonText}>To Customer</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.dumpDirectionsButton}
                        onPress={() => handleGetDirectionsToDump(job)}
                      >
                        <Navigation size={18} color={Colors.background} />
                        <Text style={styles.dumpDirectionsButtonText}>To Dump</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.jobActions}>
                      <TouchableOpacity
                        style={styles.arrivedButton}
                        onPress={() => handleArrivedAtCustomer(job)}
                      >
                        <Home size={18} color={Colors.background} />
                        <Text style={styles.arrivedButtonText}>Arrived at Customer</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.dumpArrivalButton}
                        onPress={() => handleArrivedAtDump(job)}
                      >
                        <TruckIcon size={18} color={Colors.background} />
                        <Text style={styles.dumpArrivalButtonText}>At Dump</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.jobActions}>
                      <TouchableOpacity
                        style={styles.suspendButton}
                        onPress={() => handleSuspendLoad(job)}
                      >
                        <PauseCircle size={18} color={Colors.error} />
                        <Text style={styles.suspendButtonText}>Suspend Load</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.finishButton}
                        onPress={() => {
                          setSelectedJobForAction(job);
                          setShowJobActionModal(true);
                        }}
                      >
                        <CheckCircle size={18} color={Colors.background} />
                        <Text style={styles.finishButtonText}>Finish Job</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {route.status === 'IN_PROGRESS' && job.status === 'SUSPENDED' && job.willCompleteToday && (
                  <TouchableOpacity
                    style={styles.resumeJobButton}
                    onPress={() => handleResumeJob(job)}
                  >
                    <Play size={18} color={Colors.background} />
                    <Text style={styles.resumeJobButtonText}>Resume Job</Text>
                  </TouchableOpacity>
                )}

                {job.status === 'AT_DUMP' && (
                  <View style={styles.atDumpBanner}>
                    <TruckIcon size={16} color='#FF9500' />
                    <Text style={styles.atDumpText}>At dump site - awaiting next action</Text>
                  </View>
                )}

                {job.status === 'SUSPENDED' && (
                  <View style={styles.suspendedBanner}>
                    <PauseCircle size={16} color={Colors.error} />
                    <Text style={styles.suspendedText}>
                      {job.suspendedReason || 'Suspended'}
                    </Text>
                  </View>
                )}

                {job.status === 'COMPLETED' && (
                  <View style={styles.completedBanner}>
                    <CheckCircle size={16} color={Colors.success} />
                    <Text style={styles.completedText}>
                      {job.isDryRun ? 'Completed as Dry Run' : 'Completed'}
                      {job.completedAt && ` at ${new Date(job.completedAt).toLocaleTimeString()}`}
                    </Text>
                  </View>
                )}
              </View>
            ))
          )}
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
                style={styles.actionButton}
                onPress={handleCompleteJob}
              >
                <CheckCircle size={32} color={Colors.success} />
                <Text style={styles.actionButtonText}>Complete Job</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleReturnToCustomer}
              >
                <Home size={32} color={Colors.primary} />
                <Text style={styles.actionButtonText}>Return to Customer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleReturnToDropYard}
              >
                <Warehouse size={32} color={Colors.accent} />
                <Text style={styles.actionButtonText}>Return to Drop Yard</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  setShowJobActionModal(false);
                  if (selectedJobForAction) {
                    handleSuspendLoad(selectedJobForAction);
                  }
                }}
              >
                <PauseCircle size={32} color={Colors.error} />
                <Text style={styles.actionButtonText}>Suspend Load</Text>
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
                style={styles.actionButton}
                onPress={() => setShowArrivedAtCustomerModal(false)}
              >
                <CheckCircle size={32} color={Colors.success} />
                <Text style={styles.actionButtonText}>Continue with Service</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleDryRun}
              >
                <AlertCircle size={32} color={Colors.warning} />
                <Text style={styles.actionButtonText}>Mark as Dry Run</Text>
                <Text style={styles.actionButtonSubtext}>Container empty or not present</Text>
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
        visible={showAddressEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddressEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Job Address</Text>
              <TouchableOpacity onPress={() => setShowAddressEditModal(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <Text style={styles.inputLabel}>Job Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newAddress}
                onChangeText={setNewAddress}
                placeholder="Enter job address"
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={3}
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary]}
                  onPress={() => setShowAddressEditModal(false)}
                >
                  <Text style={styles.buttonSecondaryText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary]}
                  onPress={handleSaveAddress}
                >
                  <Text style={styles.buttonPrimaryText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
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
  routeHeader: {
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  routeHeaderRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  routeTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.background,
  },
  routeInfo: {
    flexDirection: 'row' as const,
    marginBottom: 4,
  },
  routeInfoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: 8,
  },
  routeInfoValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  startButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.background,
  },
  jobsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 48,
    backgroundColor: Colors.background,
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  jobCard: {
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  jobHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  jobHeaderLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    flex: 1,
  },
  jobHeaderInfo: {
    flex: 1,
  },
  jobNumber: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  jobType: {
    fontSize: 13,
    color: Colors.primary,
    marginTop: 2,
  },
  reorderButtons: {
    flexDirection: 'row' as const,
    gap: 4,
  },
  reorderButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 4,
    borderRadius: 4,
    backgroundColor: Colors.backgroundSecondary,
  },
  reorderButtonDisabled: {
    opacity: 0.3,
  },
  reorderButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
    marginLeft: 2,
  },
  reorderButtonTextDisabled: {
    color: Colors.textSecondary,
  },
  jobDetails: {
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
  jobCustomer: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  jobDetail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  jobDetailWithEdit: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 2,
  },
  jobNotes: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic' as const,
    marginTop: 4,
  },
  jobActions: {
    flexDirection: 'row' as const,
    gap: 8,
    marginBottom: 8,
  },
  directionsButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.backgroundSecondary,
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  directionsButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  dumpDirectionsButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#FF9500',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  dumpDirectionsButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.background,
  },
  arrivedButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  arrivedButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.background,
  },
  dumpArrivalButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#FF9500',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  dumpArrivalButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.background,
  },
  suspendButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.backgroundSecondary,
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  suspendButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.error,
  },
  finishButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.success,
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  finishButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.background,
  },
  atDumpBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFF3E0',
    padding: 8,
    borderRadius: 8,
    gap: 8,
  },
  atDumpText: {
    fontSize: 13,
    color: '#FF9500',
    fontWeight: '600' as const,
  },
  suspendedBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFEBEE',
    padding: 8,
    borderRadius: 8,
    gap: 8,
  },
  suspendedText: {
    fontSize: 13,
    color: Colors.error,
    fontWeight: '600' as const,
  },
  startJobButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  startJobButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.background,
  },
  resumeJobButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.success,
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  resumeJobButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.background,
  },
  completedBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.backgroundSecondary,
    padding: 8,
    borderRadius: 8,
    gap: 8,
  },
  completedText: {
    fontSize: 13,
    color: Colors.success,
    fontWeight: '600' as const,
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
  actionButton: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center' as const,
    gap: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  actionButtonSubtext: {
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
  routeActionsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  completeRouteButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.success,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  completeRouteButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.background,
  },
  sendToDispatchButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.error,
  },
  sendToDispatchButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.error,
  },
  completedRouteBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  completedRouteText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.success,
  },
});
