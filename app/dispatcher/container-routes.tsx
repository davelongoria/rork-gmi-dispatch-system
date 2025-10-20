import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { useData } from '@/contexts/DataContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Package, Plus, Truck, User, Calendar, X } from 'lucide-react-native';
import type { ContainerRoute, ContainerJob, ContainerJobType, ContainerSize } from '@/types';

const JOB_TYPES: { value: ContainerJobType; label: string }[] = [
  { value: 'TOTER_DELIVERY', label: 'Toter Delivery' },
  { value: 'COMM_CONTAINER_DELIVERY', label: 'Commercial Container Delivery' },
  { value: 'CONTAINER_PICKUP', label: 'Container Pickup' },
  { value: 'TOTER_PICKUP', label: 'Toter Pickup' },
  { value: 'MISSED_PICKUP', label: 'Missed Pickup' },
  { value: 'EXTRA_PICKUP', label: 'Extra Pickup' },
];

const CONTAINER_SIZES: (ContainerSize | 'TOTER')[] = ['TOTER', '1', '1.5', '2', '4', '6', '8', 'COMPACTOR'];

export default function ContainerRoutesScreen() {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);
  const {
    containerRoutes,
    containerJobs,
    drivers,
    trucks,
    customers,
    residentialCustomers,
    addContainerRoute,
    updateContainerRoute,
    deleteContainerRoute,
    addContainerJob,
    deleteContainerJob,
  } = useData();

  const [showCompleted, setShowCompleted] = useState<boolean>(false);
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  const [routeName, setRouteName] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [selectedTruckId, setSelectedTruckId] = useState<string>('');

  const [addJobModalVisible, setAddJobModalVisible] = useState<boolean>(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [jobType, setJobType] = useState<ContainerJobType>('TOTER_DELIVERY');
  const [jobAddress, setJobAddress] = useState<string>('');
  const [jobCustomerId, setJobCustomerId] = useState<string>('');
  const [jobContainerType, setJobContainerType] = useState<ContainerSize | 'TOTER'>('TOTER');
  const [jobContainerCount, setJobContainerCount] = useState<string>('1');
  const [jobNotes, setJobNotes] = useState<string>('');

  const filteredRoutes = showCompleted
    ? containerRoutes
    : containerRoutes.filter(r => r.status !== 'COMPLETED');

  const sortedRoutes = [...filteredRoutes].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const handleCreateRoute = async () => {
    if (!routeName.trim()) {
      Alert.alert('Error', 'Please enter a route name');
      return;
    }

    const newRoute: ContainerRoute = {
      id: `container-route-${Date.now()}`,
      name: routeName.trim(),
      date: selectedDate,
      driverId: selectedDriverId || undefined,
      driverName: selectedDriverId ? drivers.find(d => d.id === selectedDriverId)?.name : undefined,
      truckId: selectedTruckId || undefined,
      truckUnitNumber: selectedTruckId ? trucks.find(t => t.id === selectedTruckId)?.unitNumber : undefined,
      jobIds: [],
      status: 'PLANNED',
      routeType: 'CONTAINER_DELIVERY',
      createdAt: new Date().toISOString(),
    };

    await addContainerRoute(newRoute);
    setCreateModalVisible(false);
    setRouteName('');
    setSelectedDriverId('');
    setSelectedTruckId('');
    Alert.alert('Success', 'Container route created');
  };

  const handleDeleteRoute = async (routeId: string) => {
    Alert.alert(
      'Delete Route',
      'Are you sure you want to delete this route?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const route = containerRoutes.find(r => r.id === routeId);
            if (route) {
              for (const jobId of route.jobIds) {
                await deleteContainerJob(jobId);
              }
            }
            await deleteContainerRoute(routeId);
            Alert.alert('Success', 'Route deleted');
          },
        },
      ]
    );
  };

  const handleAddJob = async () => {
    if (!jobAddress.trim()) {
      Alert.alert('Error', 'Please enter an address');
      return;
    }

    const selectedRoute = containerRoutes.find(r => r.id === selectedRouteId);
    if (!selectedRoute) return;

    const newJob: ContainerJob = {
      id: `container-job-${Date.now()}`,
      type: jobType,
      address: jobAddress.trim(),
      customerId: jobCustomerId || undefined,
      customerName: jobCustomerId
        ? customers.find(c => c.id === jobCustomerId)?.name || residentialCustomers.find(c => c.id === jobCustomerId)?.name
        : undefined,
      containerType: jobContainerType,
      containerCount: parseInt(jobContainerCount) || 1,
      notes: jobNotes.trim() || undefined,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    await addContainerJob(newJob);

    await updateContainerRoute(selectedRoute.id, {
      jobIds: [...selectedRoute.jobIds, newJob.id],
    });

    setAddJobModalVisible(false);
    resetJobForm();
    Alert.alert('Success', 'Job added to route');
  };

  const resetJobForm = () => {
    setJobType('TOTER_DELIVERY');
    setJobAddress('');
    setJobCustomerId('');
    setJobContainerType('TOTER');
    setJobContainerCount('1');
    setJobNotes('');
  };

  const handleDispatchRoute = async (routeId: string) => {
    const route = containerRoutes.find(r => r.id === routeId);
    if (!route) return;

    if (!route.driverId) {
      Alert.alert('Error', 'Please assign a driver before dispatching');
      return;
    }

    if (route.jobIds.length === 0) {
      Alert.alert('Error', 'Please add jobs to the route before dispatching');
      return;
    }

    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    await updateContainerRoute(routeId, {
      status: 'DISPATCHED',
      dispatchedAt: new Date().toISOString(),
      date: dateStr,
    });

    console.log('Container route dispatched:', routeId, 'for date:', dateStr);
    Alert.alert('Success', `Route dispatched to ${route.driverName} for today`);
  };

  const handleEditRoute = (routeId: string) => {
    setSelectedRouteId(routeId);
    setAddJobModalVisible(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNED':
        return colors.textSecondary;
      case 'DISPATCHED':
        return colors.primary;
      case 'IN_PROGRESS':
        return colors.warning;
      case 'COMPLETED':
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Package size={20} color={colors.primary} />
          <Text style={styles.headerText}>Container Routes</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowCompleted(!showCompleted)}
          >
            <Text style={styles.filterButtonText}>
              {showCompleted ? 'Hide Completed' : 'Show All'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setCreateModalVisible(true)}
          >
            <Plus size={24} color={colors.background} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={sortedRoutes}
        renderItem={({ item }) => {
          const route = item;
          const jobCount = route.jobIds.length;
          const completedJobs = route.jobIds.filter(jobId => {
            const job = containerJobs.find(j => j.id === jobId);
            return job?.status === 'COMPLETED';
          }).length;

          return (
            <View style={styles.routeCard}>
              <View style={styles.routeHeader}>
                <View style={styles.routeHeaderLeft}>
                  <Text style={styles.routeName}>{route.name}</Text>
                  <View style={styles.routeMetaRow}>
                    <Calendar size={14} color={colors.textSecondary} />
                    <Text style={styles.routeMetaText}>
                      {new Date(route.date).toLocaleDateString()}
                    </Text>
                  </View>
                  {route.driverName && (
                    <View style={styles.routeMetaRow}>
                      <User size={14} color={colors.textSecondary} />
                      <Text style={styles.routeMetaText}>{route.driverName}</Text>
                    </View>
                  )}
                  {route.truckUnitNumber && (
                    <View style={styles.routeMetaRow}>
                      <Truck size={14} color={colors.textSecondary} />
                      <Text style={styles.routeMetaText}>Unit {route.truckUnitNumber}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.routeHeaderRight}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(route.status) }]}>
                    <Text style={styles.statusText}>{route.status}</Text>
                  </View>
                  <Text style={styles.jobCountText}>
                    {completedJobs}/{jobCount} Jobs
                  </Text>
                </View>
              </View>

              <View style={styles.routeActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEditRoute(route.id)}
                >
                  <Text style={styles.actionButtonText}>Add Jobs</Text>
                </TouchableOpacity>
                {route.status === 'PLANNED' && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleDispatchRoute(route.id)}
                  >
                    <Text style={[styles.actionButtonText, { color: colors.background }]}>
                      Dispatch
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.error }]}
                  onPress={() => handleDeleteRoute(route.id)}
                >
                  <Text style={[styles.actionButtonText, { color: colors.background }]}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Package size={64} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No container routes yet</Text>
            <Text style={styles.emptySubtext}>
              Create a route to manage toter and container deliveries and pickups
            </Text>
          </View>
        }
      />

      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Container Route</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.label}>Route Name</Text>
              <TextInput
                style={styles.input}
                value={routeName}
                onChangeText={setRouteName}
                placeholder="e.g., Container Route A"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={styles.label}>Date</Text>
              <TextInput
                style={styles.input}
                value={selectedDate}
                onChangeText={setSelectedDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={styles.label}>Driver (Optional)</Text>
              <ScrollView horizontal style={styles.driverList}>
                {drivers.filter(d => d.active).map(driver => (
                  <TouchableOpacity
                    key={driver.id}
                    style={[
                      styles.driverChip,
                      selectedDriverId === driver.id && styles.driverChipSelected,
                    ]}
                    onPress={() => setSelectedDriverId(driver.id === selectedDriverId ? '' : driver.id)}
                  >
                    <Text
                      style={[
                        styles.driverChipText,
                        selectedDriverId === driver.id && styles.driverChipTextSelected,
                      ]}
                    >
                      {driver.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Truck (Optional)</Text>
              <ScrollView horizontal style={styles.driverList}>
                {trucks.filter(t => t.active).map(truck => (
                  <TouchableOpacity
                    key={truck.id}
                    style={[
                      styles.driverChip,
                      selectedTruckId === truck.id && styles.driverChipSelected,
                    ]}
                    onPress={() => setSelectedTruckId(truck.id === selectedTruckId ? '' : truck.id)}
                  >
                    <Text
                      style={[
                        styles.driverChipText,
                        selectedTruckId === truck.id && styles.driverChipTextSelected,
                      ]}
                    >
                      {truck.unitNumber}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity style={styles.createButton} onPress={handleCreateRoute}>
                <Text style={styles.createButtonText}>Create Route</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={addJobModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setAddJobModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Job to Route</Text>
              <TouchableOpacity
                onPress={() => {
                  setAddJobModalVisible(false);
                  resetJobForm();
                }}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.label}>Job Type</Text>
              <View style={styles.jobTypeGrid}>
                {JOB_TYPES.map(type => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.jobTypeChip,
                      jobType === type.value && styles.jobTypeChipSelected,
                    ]}
                    onPress={() => setJobType(type.value)}
                  >
                    <Text
                      style={[
                        styles.jobTypeChipText,
                        jobType === type.value && styles.jobTypeChipTextSelected,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Address</Text>
              <TextInput
                style={styles.input}
                value={jobAddress}
                onChangeText={setJobAddress}
                placeholder="Enter address"
                placeholderTextColor={colors.textSecondary}
                multiline
              />

              <Text style={styles.label}>Customer (Optional)</Text>
              <ScrollView horizontal style={styles.customerList}>
                <TouchableOpacity
                  style={[
                    styles.customerChip,
                    !jobCustomerId && styles.customerChipSelected,
                  ]}
                  onPress={() => setJobCustomerId('')}
                >
                  <Text
                    style={[
                      styles.customerChipText,
                      !jobCustomerId && styles.customerChipTextSelected,
                    ]}
                  >
                    None
                  </Text>
                </TouchableOpacity>
                {[...customers, ...residentialCustomers].filter(c => c.active).map(customer => (
                  <TouchableOpacity
                    key={customer.id}
                    style={[
                      styles.customerChip,
                      jobCustomerId === customer.id && styles.customerChipSelected,
                    ]}
                    onPress={() => setJobCustomerId(customer.id)}
                  >
                    <Text
                      style={[
                        styles.customerChipText,
                        jobCustomerId === customer.id && styles.customerChipTextSelected,
                      ]}
                    >
                      {customer.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Container Type</Text>
              <ScrollView horizontal style={styles.containerSizeList}>
                {CONTAINER_SIZES.map(size => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.sizeChip,
                      jobContainerType === size && styles.sizeChipSelected,
                    ]}
                    onPress={() => setJobContainerType(size)}
                  >
                    <Text
                      style={[
                        styles.sizeChipText,
                        jobContainerType === size && styles.sizeChipTextSelected,
                      ]}
                    >
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Number of Containers</Text>
              <TextInput
                style={styles.input}
                value={jobContainerCount}
                onChangeText={setJobContainerCount}
                placeholder="1"
                keyboardType="numeric"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={jobNotes}
                onChangeText={setJobNotes}
                placeholder="Add any notes..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity style={styles.createButton} onPress={handleAddJob}>
                <Text style={styles.createButtonText}>Add Job</Text>
              </TouchableOpacity>
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
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 16,
    backgroundColor: colors.background,
  },
  headerInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row' as const,
    gap: 8,
    alignItems: 'center' as const,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  addButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  listContent: {
    padding: 16,
  },
  routeCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  routeHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 12,
  },
  routeHeaderLeft: {
    flex: 1,
  },
  routeName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 8,
  },
  routeMetaRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 4,
  },
  routeMetaText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  routeHeaderRight: {
    alignItems: 'flex-end' as const,
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.background,
  },
  jobCountText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  routeActions: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center' as const,
    backgroundColor: colors.backgroundSecondary,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  emptyContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 20,
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
  modalForm: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top' as const,
  },
  driverList: {
    flexDirection: 'row' as const,
    marginBottom: 8,
  },
  driverChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    marginRight: 8,
    borderWidth: 2,
    borderColor: colors.backgroundSecondary,
  },
  driverChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  driverChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  driverChipTextSelected: {
    color: colors.background,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center' as const,
    marginTop: 24,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.background,
  },
  jobTypeGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  jobTypeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 2,
    borderColor: colors.backgroundSecondary,
  },
  jobTypeChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  jobTypeChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.text,
  },
  jobTypeChipTextSelected: {
    color: colors.background,
  },
  customerList: {
    flexDirection: 'row' as const,
    marginBottom: 8,
  },
  customerChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.backgroundSecondary,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  customerChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  customerChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.text,
  },
  customerChipTextSelected: {
    color: colors.background,
  },
  containerSizeList: {
    flexDirection: 'row' as const,
    marginBottom: 8,
  },
  sizeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.backgroundSecondary,
    marginRight: 8,
    borderWidth: 2,
    borderColor: colors.backgroundSecondary,
  },
  sizeChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sizeChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.text,
  },
  sizeChipTextSelected: {
    color: colors.background,
  },
});
