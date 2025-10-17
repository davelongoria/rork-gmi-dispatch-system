import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import { useData } from '@/contexts/DataContext';
import Colors from '@/constants/colors';
import { Plus, Calendar, User, Truck as TruckIcon, MapPin, Send, X, Package, Trash2, Edit3 } from 'lucide-react-native';
import type { CommercialRoute, CommercialStop, ContainerSize, ServiceFrequency } from '@/types';

const CONTAINER_SIZES: ContainerSize[] = ['1', '1.5', '2', '4', '6', '8', 'COMPACTOR'];
const SERVICE_FREQUENCIES: { value: ServiceFrequency; label: string }[] = [
  { value: 'ONCE_WEEK', label: 'Once a week' },
  { value: 'TWICE_WEEK', label: 'Twice a week' },
  { value: 'THREE_WEEK', label: '3x a week' },
  { value: 'FOUR_WEEK', label: '4x a week' },
  { value: 'FIVE_WEEK', label: '5x a week' },
  { value: 'BIWEEKLY', label: 'Every other week' },
  { value: 'MONTHLY', label: 'Once a month' },
  { value: 'ON_CALL', label: 'On call' },
];

export default function CommercialRoutesScreen() {
  const { 
    commercialRoutes, 
    commercialStops,
    drivers, 
    trucks, 
    customers,
    addCommercialRoute, 
    updateCommercialRoute, 
    deleteCommercialRoute,
    addCommercialStop,
    updateCommercialStop,
    deleteCommercialStop,
  } = useData();

  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [stopModalVisible, setStopModalVisible] = useState<boolean>(false);
  const [editStopModalVisible, setEditStopModalVisible] = useState<boolean>(false);
  const [selectedRoute, setSelectedRoute] = useState<CommercialRoute | null>(null);
  const [routeName, setRouteName] = useState<string>('');
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [selectedTruck, setSelectedTruck] = useState<string>('');
  const [selectedStops, setSelectedStops] = useState<string[]>([]);
  
  const [stopJobName, setStopJobName] = useState<string>('');
  const [stopCustomerId, setStopCustomerId] = useState<string>('');
  const [stopAddress, setStopAddress] = useState<string>('');
  const [stopContainerSize, setStopContainerSize] = useState<ContainerSize>('2');
  const [stopContainerCount, setStopContainerCount] = useState<string>('1');
  const [stopFrequency, setStopFrequency] = useState<ServiceFrequency>('ONCE_WEEK');
  const [stopInstructions, setStopInstructions] = useState<string>('');
  const [editingStop, setEditingStop] = useState<CommercialStop | null>(null);

  const [showCompleted, setShowCompleted] = useState<boolean>(false);

  const todayRoutes = commercialRoutes.filter((r: CommercialRoute) => {
    const today = new Date().toISOString().split('T')[0];
    if (showCompleted) {
      return r.date === today;
    }
    return r.date === today && r.status !== 'COMPLETED';
  }).sort((a: CommercialRoute, b: CommercialRoute) => {
    const statusOrder: Record<string, number> = { PLANNED: 0, DISPATCHED: 1, IN_PROGRESS: 2, COMPLETED: 3 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  const handleCreateRoute = () => {
    setRouteName('');
    setSelectedDriver('');
    setSelectedTruck('');
    setSelectedStops([]);
    setSelectedRoute(null);
    setModalVisible(true);
  };

  const handleEditRoute = (route: CommercialRoute) => {
    setSelectedRoute(route);
    setRouteName(route.name);
    setSelectedDriver(route.driverId || '');
    setSelectedTruck(route.truckId || '');
    setSelectedStops([...route.stopIds]);
    setModalVisible(true);
  };

  const handleSaveRoute = async () => {
    if (!routeName.trim()) {
      Alert.alert('Error', 'Please enter a route name');
      return;
    }
    if (!selectedDriver || !selectedTruck) {
      Alert.alert('Error', 'Please select driver and truck');
      return;
    }

    const driver = drivers.find(d => d.id === selectedDriver);
    const truck = trucks.find(t => t.id === selectedTruck);

    if (selectedRoute) {
      await updateCommercialRoute(selectedRoute.id, {
        name: routeName,
        driverId: selectedDriver,
        driverName: driver?.name,
        truckId: selectedTruck,
        truckUnitNumber: truck?.unitNumber,
        stopIds: selectedStops,
      });
      Alert.alert('Success', 'Route updated successfully');
    } else {
      const newRoute: CommercialRoute = {
        id: `cr-${Date.now()}`,
        name: routeName,
        date: new Date().toISOString().split('T')[0],
        driverId: selectedDriver,
        driverName: driver?.name,
        truckId: selectedTruck,
        truckUnitNumber: truck?.unitNumber,
        stopIds: selectedStops,
        status: 'PLANNED',
        routeType: 'COMMERCIAL_FRONTLOAD',
        createdAt: new Date().toISOString(),
      };

      await addCommercialRoute(newRoute);
      Alert.alert('Success', 'Route created successfully');
    }
    
    setModalVisible(false);
  };

  const handleCreateStop = () => {
    setStopJobName('');
    setStopCustomerId('');
    setStopAddress('');
    setStopContainerSize('2');
    setStopContainerCount('1');
    setStopFrequency('ONCE_WEEK');
    setStopInstructions('');
    setStopModalVisible(true);
  };

  const handleEditStop = (stop: CommercialStop) => {
    setEditingStop(stop);
    setStopJobName(stop.jobName);
    setStopCustomerId(stop.customerId || '');
    setStopAddress(stop.address);
    setStopContainerSize(stop.containerSize);
    setStopContainerCount(stop.containerCount.toString());
    setStopFrequency(stop.serviceFrequency);
    setStopInstructions(stop.specialInstructions || '');
    setEditStopModalVisible(true);
  };

  const handleSaveStop = async () => {
    if (!stopJobName.trim() || !stopAddress.trim()) {
      Alert.alert('Error', 'Please enter job name and address');
      return;
    }

    const customer = stopCustomerId ? customers.find(c => c.id === stopCustomerId) : undefined;
    const count = parseInt(stopContainerCount) || 1;

    const newStop: CommercialStop = {
      id: `cs-${Date.now()}`,
      jobName: stopJobName,
      customerId: stopCustomerId || undefined,
      customerName: customer?.name,
      address: stopAddress,
      containerSize: stopContainerSize,
      containerCount: count,
      serviceFrequency: stopFrequency,
      specialInstructions: stopInstructions,
      status: 'PENDING',
      active: true,
      createdAt: new Date().toISOString(),
    };

    await addCommercialStop(newStop);
    setStopModalVisible(false);
    Alert.alert('Success', 'Stop created successfully');
  };

  const handleUpdateStop = async () => {
    if (!editingStop || !stopJobName.trim() || !stopAddress.trim()) {
      Alert.alert('Error', 'Please enter job name and address');
      return;
    }

    const customer = stopCustomerId ? customers.find(c => c.id === stopCustomerId) : undefined;
    const count = parseInt(stopContainerCount) || 1;

    await updateCommercialStop(editingStop.id, {
      jobName: stopJobName,
      customerId: stopCustomerId || undefined,
      customerName: customer?.name,
      address: stopAddress,
      containerSize: stopContainerSize,
      containerCount: count,
      serviceFrequency: stopFrequency,
      specialInstructions: stopInstructions,
    });

    setEditStopModalVisible(false);
    setEditingStop(null);
    Alert.alert('Success', 'Stop updated successfully');
  };

  const handleDeleteStop = (stopId: string) => {
    Alert.alert(
      'Delete Stop',
      'Are you sure you want to delete this stop?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteCommercialStop(stopId);
            Alert.alert('Success', 'Stop deleted successfully');
          },
        },
      ]
    );
  };

  const toggleStopSelection = (stopId: string) => {
    setSelectedStops(prev => 
      prev.includes(stopId) 
        ? prev.filter(id => id !== stopId)
        : [...prev, stopId]
    );
  };

  const availableStops = commercialStops.filter((s: CommercialStop) => s.active);

  const handleDispatchRoute = async (route: CommercialRoute) => {
    Alert.alert(
      'Dispatch Route',
      `Dispatch route to ${route.driverName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dispatch',
          onPress: async () => {
            await updateCommercialRoute(route.id, {
              status: 'DISPATCHED',
              dispatchedAt: new Date().toISOString(),
            });
            Alert.alert('Success', 'Route dispatched successfully');
          },
        },
      ]
    );
  };

  const handleDeleteRoute = (route: CommercialRoute) => {
    Alert.alert(
      'Delete Route',
      `Are you sure you want to delete this route?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteCommercialRoute(route.id);
            Alert.alert('Success', 'Route deleted successfully');
          },
        },
      ]
    );
  };

  const getStatusColor = (status: CommercialRoute['status']) => {
    switch (status) {
      case 'PLANNED':
        return Colors.textSecondary;
      case 'DISPATCHED':
        return Colors.accent;
      case 'IN_PROGRESS':
        return Colors.primary;
      case 'COMPLETED':
        return Colors.success;
      default:
        return Colors.textSecondary;
    }
  };

  const getFrequencyLabel = (freq: ServiceFrequency) => {
    return SERVICE_FREQUENCIES.find(f => f.value === freq)?.label || freq;
  };

  const renderRoute = ({ item }: { item: CommercialRoute }) => (
    <View style={styles.routeCard}>
      <View style={styles.routeHeader}>
        <View style={styles.routeInfo}>
          <Text style={styles.routeTitle}>{item.name}</Text>
          <View style={styles.routeMeta}>
            <User size={14} color={Colors.textSecondary} />
            <Text style={styles.routeMetaText}>{item.driverName || 'Unassigned'}</Text>
          </View>
          <View style={styles.routeMeta}>
            <TruckIcon size={14} color={Colors.textSecondary} />
            <Text style={styles.routeMetaText}>{item.truckUnitNumber || 'No truck'}</Text>
          </View>
          <View style={styles.routeMeta}>
            <MapPin size={14} color={Colors.textSecondary} />
            <Text style={styles.routeMetaText}>{item.stopIds.length} stops</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      {item.status === 'PLANNED' && (
        <View style={styles.routeActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditRoute(item)}
          >
            <Edit3 size={16} color={Colors.primary} />
            <Text style={styles.editButtonText}>Edit Route</Text>
          </TouchableOpacity>
          <View style={styles.routeActionsRow}>
            <TouchableOpacity
              style={styles.dispatchButton}
              onPress={() => handleDispatchRoute(item)}
            >
              <Send size={16} color={Colors.background} />
              <Text style={styles.dispatchButtonText}>Dispatch</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteRoute(item)}
            >
              <Trash2 size={16} color={Colors.background} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Calendar size={20} color={Colors.primary} />
          <Text style={styles.headerText}>Commercial Routes</Text>
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
          <TouchableOpacity style={styles.addButton} onPress={handleCreateRoute}>
            <Plus size={24} color={Colors.background} />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.manageStopsButton} onPress={handleCreateStop}>
        <Package size={20} color={Colors.primary} />
        <Text style={styles.manageStopsButtonText}>Manage Stops</Text>
      </TouchableOpacity>

      <FlatList
        data={todayRoutes}
        renderItem={renderRoute}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No commercial routes for today</Text>
            <Text style={styles.emptySubtext}>Tap + to create a new route</Text>
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
                {selectedRoute ? 'Edit Route' : 'Create Route'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <Text style={styles.label}>Route Name</Text>
              <TextInput
                style={styles.input}
                value={routeName}
                onChangeText={setRouteName}
                placeholder="e.g., Downtown Route A"
                placeholderTextColor={Colors.textSecondary}
              />

              <Text style={[styles.label, { marginTop: 24 }]}>Select Driver</Text>
              {drivers.filter(d => d.active).map(driver => (
                <TouchableOpacity
                  key={driver.id}
                  style={[
                    styles.selectionItem,
                    selectedDriver === driver.id && styles.selectionItemSelected,
                  ]}
                  onPress={() => setSelectedDriver(driver.id)}
                >
                  <Text
                    style={[
                      styles.selectionText,
                      selectedDriver === driver.id && styles.selectionTextSelected,
                    ]}
                  >
                    {driver.name}
                  </Text>
                </TouchableOpacity>
              ))}

              <Text style={[styles.label, { marginTop: 24 }]}>Select Truck</Text>
              {trucks.filter(t => t.active).map(truck => (
                <TouchableOpacity
                  key={truck.id}
                  style={[
                    styles.selectionItem,
                    selectedTruck === truck.id && styles.selectionItemSelected,
                  ]}
                  onPress={() => setSelectedTruck(truck.id)}
                >
                  <Text
                    style={[
                      styles.selectionText,
                      selectedTruck === truck.id && styles.selectionTextSelected,
                    ]}
                  >
                    Unit {truck.unitNumber}
                  </Text>
                </TouchableOpacity>
              ))}

              <Text style={[styles.label, { marginTop: 24 }]}>Select Stops</Text>
              {availableStops.length === 0 ? (
                <Text style={styles.noStopsText}>No stops available. Create stops first.</Text>
              ) : (
                availableStops.map((stop: CommercialStop) => (
                  <TouchableOpacity
                    key={stop.id}
                    style={[
                      styles.stopSelectionItem,
                      selectedStops.includes(stop.id) && styles.stopSelectionItemSelected,
                    ]}
                    onPress={() => toggleStopSelection(stop.id)}
                  >
                    <View style={styles.stopSelectionContent}>
                      <View style={styles.stopSelectionInfo}>
                        <Text style={styles.stopSelectionCustomer}>{stop.jobName}</Text>
                        {stop.customerName && (
                          <Text style={styles.stopSelectionLinked}>Linked: {stop.customerName}</Text>
                        )}
                        <Text style={styles.stopSelectionAddress} numberOfLines={1}>{stop.address}</Text>
                        <Text style={styles.stopSelectionDetail}>
                          {stop.containerCount}x {stop.containerSize}yd • {getFrequencyLabel(stop.serviceFrequency)}
                        </Text>
                      </View>
                      <TouchableOpacity 
                        onPress={(e) => {
                          e.stopPropagation();
                          handleEditStop(stop);
                        }}
                        style={styles.editStopButton}
                      >
                        <Edit3 size={16} color={Colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))
              )}

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.buttonSecondaryText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary]}
                  onPress={handleSaveRoute}
                >
                  <Text style={styles.buttonPrimaryText}>
                    {selectedRoute ? 'Update' : 'Create'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={stopModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setStopModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Stop</Text>
              <TouchableOpacity onPress={() => setStopModalVisible(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <Text style={styles.label}>Job/Account Name *</Text>
              <TextInput
                style={styles.input}
                value={stopJobName}
                onChangeText={setStopJobName}
                placeholder="e.g., ABC Store Main St or ABC Corp"
                placeholderTextColor={Colors.textSecondary}
              />
              <Text style={styles.helpText}>
                This name identifies the stop. If linked to a customer below, this becomes the recurring job name for reports.
              </Text>

              <Text style={[styles.label, { marginTop: 24 }]}>Link to Customer (Optional)</Text>
              <TouchableOpacity
                style={[
                  styles.selectionItem,
                  !stopCustomerId && styles.selectionItemSelected,
                ]}
                onPress={() => setStopCustomerId('')}
              >
                <Text
                  style={[
                    styles.selectionText,
                    !stopCustomerId && styles.selectionTextSelected,
                  ]}
                >
                  No linked customer
                </Text>
              </TouchableOpacity>
              {customers.filter(c => c.active).map(customer => (
                <TouchableOpacity
                  key={customer.id}
                  style={[
                    styles.selectionItem,
                    stopCustomerId === customer.id && styles.selectionItemSelected,
                  ]}
                  onPress={() => {
                    setStopCustomerId(customer.id);
                    if (!stopAddress) setStopAddress(customer.address);
                  }}
                >
                  <Text
                    style={[
                      styles.selectionText,
                      stopCustomerId === customer.id && styles.selectionTextSelected,
                    ]}
                  >
                    {customer.name}
                  </Text>
                </TouchableOpacity>
              ))}

              <Text style={[styles.label, { marginTop: 24 }]}>Address *</Text>
              <TextInput
                style={styles.input}
                value={stopAddress}
                onChangeText={setStopAddress}
                placeholder="Enter service address"
                placeholderTextColor={Colors.textSecondary}
                multiline
              />

              <Text style={[styles.label, { marginTop: 24 }]}>Container Size</Text>
              <View style={styles.containerSizeGrid}>
                {CONTAINER_SIZES.map(size => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.containerSizeButton,
                      stopContainerSize === size && styles.containerSizeButtonSelected,
                    ]}
                    onPress={() => setStopContainerSize(size)}
                  >
                    <Text
                      style={[
                        styles.containerSizeText,
                        stopContainerSize === size && styles.containerSizeTextSelected,
                      ]}
                    >
                      {size}{size !== 'COMPACTOR' ? 'yd' : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { marginTop: 24 }]}>Container Count</Text>
              <TextInput
                style={styles.input}
                value={stopContainerCount}
                onChangeText={setStopContainerCount}
                placeholder="1"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="number-pad"
              />

              <Text style={[styles.label, { marginTop: 24 }]}>Service Frequency</Text>
              {SERVICE_FREQUENCIES.map(freq => (
                <TouchableOpacity
                  key={freq.value}
                  style={[
                    styles.selectionItem,
                    stopFrequency === freq.value && styles.selectionItemSelected,
                  ]}
                  onPress={() => setStopFrequency(freq.value)}
                >
                  <Text
                    style={[
                      styles.selectionText,
                      stopFrequency === freq.value && styles.selectionTextSelected,
                    ]}
                  >
                    {freq.label}
                  </Text>
                </TouchableOpacity>
              ))}

              <Text style={[styles.label, { marginTop: 24 }]}>Special Instructions</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={stopInstructions}
                onChangeText={setStopInstructions}
                placeholder="Any special instructions for this stop"
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={3}
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary]}
                  onPress={() => setStopModalVisible(false)}
                >
                  <Text style={styles.buttonSecondaryText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary]}
                  onPress={handleSaveStop}
                >
                  <Text style={styles.buttonPrimaryText}>Create</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={editStopModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditStopModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Stop</Text>
              <TouchableOpacity onPress={() => setEditStopModalVisible(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <Text style={styles.label}>Job/Account Name *</Text>
              <TextInput
                style={styles.input}
                value={stopJobName}
                onChangeText={setStopJobName}
                placeholder="e.g., ABC Store Main St or ABC Corp"
                placeholderTextColor={Colors.textSecondary}
              />
              <Text style={styles.helpText}>
                This name identifies the stop. If linked to a customer below, this becomes the recurring job name for reports.
              </Text>

              <Text style={[styles.label, { marginTop: 24 }]}>Link to Customer (Optional)</Text>
              <TouchableOpacity
                style={[
                  styles.selectionItem,
                  !stopCustomerId && styles.selectionItemSelected,
                ]}
                onPress={() => setStopCustomerId('')}
              >
                <Text
                  style={[
                    styles.selectionText,
                    !stopCustomerId && styles.selectionTextSelected,
                  ]}
                >
                  No linked customer
                </Text>
              </TouchableOpacity>
              {customers.filter(c => c.active).map(customer => (
                <TouchableOpacity
                  key={customer.id}
                  style={[
                    styles.selectionItem,
                    stopCustomerId === customer.id && styles.selectionItemSelected,
                  ]}
                  onPress={() => {
                    setStopCustomerId(customer.id);
                    if (!stopAddress) setStopAddress(customer.address);
                  }}
                >
                  <Text
                    style={[
                      styles.selectionText,
                      stopCustomerId === customer.id && styles.selectionTextSelected,
                    ]}
                  >
                    {customer.name}
                  </Text>
                </TouchableOpacity>
              ))}

              <Text style={[styles.label, { marginTop: 24 }]}>Address *</Text>
              <TextInput
                style={styles.input}
                value={stopAddress}
                onChangeText={setStopAddress}
                placeholder="Enter service address"
                placeholderTextColor={Colors.textSecondary}
                multiline
              />

              <Text style={[styles.label, { marginTop: 24 }]}>Container Size</Text>
              <View style={styles.containerSizeGrid}>
                {CONTAINER_SIZES.map(size => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.containerSizeButton,
                      stopContainerSize === size && styles.containerSizeButtonSelected,
                    ]}
                    onPress={() => setStopContainerSize(size)}
                  >
                    <Text
                      style={[
                        styles.containerSizeText,
                        stopContainerSize === size && styles.containerSizeTextSelected,
                      ]}
                    >
                      {size}{size !== 'COMPACTOR' ? 'yd' : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { marginTop: 24 }]}>Container Count</Text>
              <TextInput
                style={styles.input}
                value={stopContainerCount}
                onChangeText={setStopContainerCount}
                placeholder="1"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="number-pad"
              />

              <Text style={[styles.label, { marginTop: 24 }]}>Service Frequency</Text>
              {SERVICE_FREQUENCIES.map(freq => (
                <TouchableOpacity
                  key={freq.value}
                  style={[
                    styles.selectionItem,
                    stopFrequency === freq.value && styles.selectionItemSelected,
                  ]}
                  onPress={() => setStopFrequency(freq.value)}
                >
                  <Text
                    style={[
                      styles.selectionText,
                      stopFrequency === freq.value && styles.selectionTextSelected,
                    ]}
                  >
                    {freq.label}
                  </Text>
                </TouchableOpacity>
              ))}

              <Text style={[styles.label, { marginTop: 24 }]}>Special Instructions</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={stopInstructions}
                onChangeText={setStopInstructions}
                placeholder="Any special instructions for this stop"
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={styles.deleteStopButton}
                onPress={() => {
                  setEditStopModalVisible(false);
                  if (editingStop) handleDeleteStop(editingStop.id);
                }}
              >
                <Trash2 size={18} color={Colors.error} />
                <Text style={styles.deleteStopButtonText}>Delete Stop</Text>
              </TouchableOpacity>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary]}
                  onPress={() => setEditStopModalVisible(false)}
                >
                  <Text style={styles.buttonSecondaryText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary]}
                  onPress={handleUpdateStop}
                >
                  <Text style={styles.buttonPrimaryText}>Update</Text>
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
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 16,
  },
  headerInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  headerActions: {
    flexDirection: 'row' as const,
    gap: 8,
    alignItems: 'center' as const,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  addButton: {
    width: 48,
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  manageStopsButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.background,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  manageStopsButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  routeCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  routeHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 12,
  },
  routeInfo: {
    flex: 1,
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  routeMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  routeMetaText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.background,
  },
  routeActions: {
    gap: 8,
  },
  editButton: {
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
  editButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  routeActionsRow: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  dispatchButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  dispatchButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.background,
  },
  deleteButton: {
    width: 44,
    backgroundColor: Colors.error,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
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
  form: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
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
  stopSelectionItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  stopSelectionItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.backgroundSecondary,
  },
  stopSelectionContent: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  stopSelectionInfo: {
    flex: 1,
    marginRight: 12,
  },
  stopSelectionCustomer: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  stopSelectionAddress: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  stopSelectionDetail: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  editStopButton: {
    padding: 8,
  },
  containerSizeGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  containerSizeButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    minWidth: 70,
    alignItems: 'center' as const,
  },
  containerSizeButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.backgroundSecondary,
  },
  containerSizeText: {
    fontSize: 14,
    color: Colors.text,
  },
  containerSizeTextSelected: {
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  noStopsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic' as const,
    marginBottom: 16,
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
  deleteStopButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.backgroundSecondary,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.error,
    marginTop: 24,
  },
  deleteStopButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.error,
  },
  helpText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic' as const,
  },
  stopSelectionLinked: {
    fontSize: 12,
    color: Colors.primary,
    marginBottom: 2,
  },
});
