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
import { Plus, Calendar, User, Truck as TruckIcon, MapPin, Send, X, Package, Trash2, Edit3, ArrowUpDown, History, MoveRight, List, Search } from 'lucide-react-native';
import type { CommercialRoute, CommercialStop, ContainerSize, ServiceFrequency, DayOfWeek, StopRouteAssignment } from '@/types';

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
const DAYS_OF_WEEK: { value: DayOfWeek; label: string }[] = [
  { value: 'MONDAY', label: 'Monday' },
  { value: 'TUESDAY', label: 'Tuesday' },
  { value: 'WEDNESDAY', label: 'Wednesday' },
  { value: 'THURSDAY', label: 'Thursday' },
  { value: 'FRIDAY', label: 'Friday' },
  { value: 'SATURDAY', label: 'Saturday' },
  { value: 'SUNDAY', label: 'Sunday' },
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
  const [reorderModalVisible, setReorderModalVisible] = useState<boolean>(false);
  const [historyModalVisible, setHistoryModalVisible] = useState<boolean>(false);
  const [selectedRoute, setSelectedRoute] = useState<CommercialRoute | null>(null);
  const [selectedStop, setSelectedStop] = useState<CommercialStop | null>(null);
  const [routeName, setRouteName] = useState<string>('');
  const [routeDayOfWeek, setRouteDayOfWeek] = useState<DayOfWeek>('MONDAY');
  const [routeScheduledFor, setRouteScheduledFor] = useState<string>('');
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [selectedTruck, setSelectedTruck] = useState<string>('');
  const [selectedStops, setSelectedStops] = useState<string[]>([]);
  const [manageStopsRouteId, setManageStopsRouteId] = useState<string | null>(null);
  const [reorderedStops, setReorderedStops] = useState<string[]>([]);
  
  const [stopJobName, setStopJobName] = useState<string>('');
  const [stopCustomerId, setStopCustomerId] = useState<string>('');
  const [stopAddress, setStopAddress] = useState<string>('');
  const [stopContainerSize, setStopContainerSize] = useState<ContainerSize>('2');
  const [stopContainerCount, setStopContainerCount] = useState<string>('1');
  const [stopFrequency, setStopFrequency] = useState<ServiceFrequency>('ONCE_WEEK');
  const [stopServiceDays, setStopServiceDays] = useState<DayOfWeek[]>([]);
  const [stopInstructions, setStopInstructions] = useState<string>('');
  const [editingStop, setEditingStop] = useState<CommercialStop | null>(null);

  const [showCompleted, setShowCompleted] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'routes' | 'jobs'>('routes');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const getStopAssignmentForDay = (stop: CommercialStop, day: DayOfWeek): StopRouteAssignment | undefined => {
    return stop.routeAssignments?.find(a => a.dayOfWeek === day);
  };

  const isStopAssignedToAnotherRoute = (stopId: string, day: DayOfWeek, currentRouteId?: string): boolean => {
    const stop = commercialStops.find(s => s.id === stopId);
    if (!stop) return false;
    const assignment = getStopAssignmentForDay(stop, day);
    return assignment !== undefined && assignment.routeId !== currentRouteId;
  };

  const getAssignedRouteForStopDay = (stopId: string, day: DayOfWeek): CommercialRoute | undefined => {
    const stop = commercialStops.find(s => s.id === stopId);
    if (!stop) return undefined;
    const assignment = getStopAssignmentForDay(stop, day);
    if (!assignment) return undefined;
    return commercialRoutes.find(r => r.id === assignment.routeId);
  };

  const moveStopToRoute = async (stopId: string, fromRouteId: string, toRouteId: string, day: DayOfWeek) => {
    const fromRoute = commercialRoutes.find(r => r.id === fromRouteId);
    const toRoute = commercialRoutes.find(r => r.id === toRouteId);
    const stop = commercialStops.find(s => s.id === stopId);
    
    if (!fromRoute || !toRoute || !stop) return;

    await updateCommercialRoute(fromRouteId, {
      stopIds: fromRoute.stopIds.filter(id => id !== stopId),
    });

    await updateCommercialRoute(toRouteId, {
      stopIds: [...toRoute.stopIds, stopId],
    });

    const updatedAssignments = stop.routeAssignments?.filter(a => a.dayOfWeek !== day) || [];
    updatedAssignments.push({
      dayOfWeek: day,
      routeId: toRouteId,
      routeName: toRoute.name,
    });

    await updateCommercialStop(stopId, {
      routeAssignments: updatedAssignments,
    });

    Alert.alert('Success', `Stop moved from ${fromRoute.name} to ${toRoute.name}`);
  };

  const handleReorderStops = () => {
    if (!selectedRoute) return;
    setReorderedStops([...selectedRoute.stopIds]);
    setReorderModalVisible(true);
  };

  const moveStopUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...reorderedStops];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setReorderedStops(newOrder);
  };

  const moveStopDown = (index: number) => {
    if (index === reorderedStops.length - 1) return;
    const newOrder = [...reorderedStops];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setReorderedStops(newOrder);
  };

  const saveStopOrder = async () => {
    if (!selectedRoute) return;
    await updateCommercialRoute(selectedRoute.id, {
      stopIds: reorderedStops,
    });
    setReorderModalVisible(false);
    Alert.alert('Success', 'Stop order updated');
  };

  const viewStopHistory = (stop: CommercialStop) => {
    setSelectedStop(stop);
    setHistoryModalVisible(true);
  };

  const getCurrentWeekRoutes = () => {
    return commercialRoutes.filter((r: CommercialRoute) => {
      if (!showCompleted && r.status === 'COMPLETED') return false;
      return true;
    }).sort((a: CommercialRoute, b: CommercialRoute) => {
      const dayOrder: Record<string, number> = { 
        MONDAY: 0, TUESDAY: 1, WEDNESDAY: 2, THURSDAY: 3, FRIDAY: 4, SATURDAY: 5, SUNDAY: 6 
      };
      const dayDiff = dayOrder[a.dayOfWeek] - dayOrder[b.dayOfWeek];
      if (dayDiff !== 0) return dayDiff;
      
      const statusOrder: Record<string, number> = { PLANNED: 0, DISPATCHED: 1, IN_PROGRESS: 2, COMPLETED: 3 };
      return statusOrder[a.status] - statusOrder[b.status];
    });
  };

  const todayRoutes = getCurrentWeekRoutes();

  const handleCreateRoute = () => {
    setRouteName('');
    setRouteDayOfWeek('MONDAY');
    setRouteScheduledFor('');
    setSelectedDriver('');
    setSelectedTruck('');
    setSelectedStops([]);
    setSelectedRoute(null);
    setManageStopsRouteId(null);
    setModalVisible(true);
  };

  const handleEditRoute = (route: CommercialRoute) => {
    setSelectedRoute(route);
    setRouteName(route.name);
    setRouteDayOfWeek(route.dayOfWeek);
    setRouteScheduledFor(route.scheduledFor || '');
    setSelectedDriver(route.driverId || '');
    setSelectedTruck(route.truckId || '');
    setSelectedStops([...route.stopIds]);
    setManageStopsRouteId(null);
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
      const oldStopIds = selectedRoute.stopIds;
      const removedStops = oldStopIds.filter(id => !selectedStops.includes(id));
      const addedStops = selectedStops.filter(id => !oldStopIds.includes(id));

      for (const stopId of removedStops) {
        const stop = commercialStops.find(s => s.id === stopId);
        if (stop) {
          const updatedAssignments = stop.routeAssignments?.filter(a => a.routeId !== selectedRoute.id) || [];
          await updateCommercialStop(stopId, { routeAssignments: updatedAssignments });
        }
      }

      for (const stopId of addedStops) {
        const stop = commercialStops.find(s => s.id === stopId);
        if (stop) {
          const updatedAssignments = stop.routeAssignments || [];
          updatedAssignments.push({
            dayOfWeek: routeDayOfWeek,
            routeId: selectedRoute.id,
            routeName: routeName,
          });
          await updateCommercialStop(stopId, { routeAssignments: updatedAssignments });
        }
      }

      await updateCommercialRoute(selectedRoute.id, {
        name: routeName,
        dayOfWeek: routeDayOfWeek,
        scheduledFor: routeScheduledFor || undefined,
        driverId: selectedDriver,
        driverName: driver?.name,
        truckId: selectedTruck,
        truckUnitNumber: truck?.unitNumber,
        stopIds: selectedStops,
      });
      Alert.alert('Success', 'Route updated successfully');
    } else {
      const newRouteId = `cr-${Date.now()}`;
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      const newRoute: CommercialRoute = {
        id: newRouteId,
        name: routeName,
        dayOfWeek: routeDayOfWeek,
        scheduledFor: routeScheduledFor || undefined,
        date: dateStr,
        driverId: selectedDriver,
        driverName: driver?.name,
        truckId: selectedTruck,
        truckUnitNumber: truck?.unitNumber,
        stopIds: selectedStops,
        status: 'PLANNED',
        routeType: 'COMMERCIAL_FRONTLOAD',
        createdAt: new Date().toISOString(),
      };

      for (const stopId of selectedStops) {
        const stop = commercialStops.find(s => s.id === stopId);
        if (stop) {
          const updatedAssignments = stop.routeAssignments || [];
          updatedAssignments.push({
            dayOfWeek: routeDayOfWeek,
            routeId: newRouteId,
            routeName: routeName,
          });
          await updateCommercialStop(stopId, { routeAssignments: updatedAssignments });
        }
      }

      await addCommercialRoute(newRoute);
      console.log('Commercial route created:', newRoute);
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
    setStopServiceDays([]);
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
    setStopServiceDays(stop.serviceDays || []);
    setStopInstructions(stop.specialInstructions || '');
    setEditStopModalVisible(true);
  };

  const handleSaveStop = async () => {
    if (!stopJobName.trim() || !stopAddress.trim()) {
      Alert.alert('Error', 'Please enter job name and address');
      return;
    }
    if (stopServiceDays.length === 0) {
      Alert.alert('Error', 'Please select at least one service day');
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
      serviceDays: stopServiceDays,
      routeAssignments: [],
      specialInstructions: stopInstructions,
      status: 'PENDING',
      history: [],
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
    if (stopServiceDays.length === 0) {
      Alert.alert('Error', 'Please select at least one service day');
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
      serviceDays: stopServiceDays,
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

  const availableStops = commercialStops.filter((s: CommercialStop) => 
    s.active && s.serviceDays?.includes(routeDayOfWeek)
  );

  const handleDispatchRoute = async (route: CommercialRoute) => {
    if (!route.driverId || !route.truckId) {
      Alert.alert('Error', 'Please assign a driver and truck before dispatching');
      return;
    }

    if (route.stopIds.length === 0) {
      Alert.alert('Error', 'Please add stops to the route before dispatching');
      return;
    }

    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

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
              date: dateStr,
            });
            console.log('Commercial route dispatched:', route.id, 'for date:', dateStr);
            Alert.alert('Success', `Route dispatched to ${route.driverName} for today`);
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
            for (const stopId of route.stopIds) {
              const stop = commercialStops.find(s => s.id === stopId);
              if (stop) {
                const updatedAssignments = stop.routeAssignments?.filter(a => a.routeId !== route.id) || [];
                await updateCommercialStop(stopId, { routeAssignments: updatedAssignments });
              }
            }
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

  const getDayLabel = (day: DayOfWeek) => {
    return DAYS_OF_WEEK.find(d => d.value === day)?.label || day;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderRoute = ({ item }: { item: CommercialRoute }) => (
    <View style={styles.routeCard}>
      <View style={styles.routeHeader}>
        <View style={styles.routeInfo}>
          <View style={styles.routeTitleRow}>
            <Text style={styles.routeTitle}>{item.name}</Text>
            <View style={styles.dayBadge}>
              <Text style={styles.dayBadgeText}>{getDayLabel(item.dayOfWeek)}</Text>
            </View>
          </View>
          {item.scheduledFor && (
            <View style={styles.rescheduledBadge}>
              <Calendar size={12} color={Colors.warning} />
              <Text style={styles.rescheduledText}>Rescheduled to {formatDate(item.scheduledFor)}</Text>
            </View>
          )}
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
          <View style={styles.routeActionsRow}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => handleEditRoute(item)}
            >
              <Edit3 size={16} color={Colors.primary} />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reorderButton}
              onPress={() => {
                setSelectedRoute(item);
                handleReorderStops();
              }}
            >
              <ArrowUpDown size={16} color={Colors.primary} />
              <Text style={styles.reorderButtonText}>Reorder</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.routeActionsRow}>
            <TouchableOpacity
              style={styles.manageStopsButtonInRoute}
              onPress={() => {
                setSelectedRoute(item);
                setManageStopsRouteId(item.id);
              }}
            >
              <Package size={16} color={Colors.primary} />
              <Text style={styles.manageStopsButtonInRouteText}>Stops</Text>
            </TouchableOpacity>
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



      <FlatList
        data={todayRoutes}
        renderItem={renderRoute}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No commercial routes</Text>
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

              <Text style={[styles.label, { marginTop: 24 }]}>Recurring Day of Week</Text>
              <View style={styles.dayButtonsGrid}>
                {DAYS_OF_WEEK.map(day => (
                  <TouchableOpacity
                    key={day.value}
                    style={[
                      styles.dayButton,
                      routeDayOfWeek === day.value && styles.dayButtonSelected,
                    ]}
                    onPress={() => setRouteDayOfWeek(day.value)}
                  >
                    <Text
                      style={[
                        styles.dayButtonText,
                        routeDayOfWeek === day.value && styles.dayButtonTextSelected,
                      ]}
                    >
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.helpText}>
                This route will recur every week on this day. You can reschedule specific weeks below.
              </Text>

              <Text style={[styles.label, { marginTop: 24 }]}>Schedule For Different Day (Optional)</Text>
              <TextInput
                style={styles.input}
                value={routeScheduledFor}
                onChangeText={setRouteScheduledFor}
                placeholder="YYYY-MM-DD (e.g., 2025-01-15 for holiday)"
                placeholderTextColor={Colors.textSecondary}
              />
              <Text style={styles.helpText}>
                Use this to reschedule a route for a different day (e.g., run Monday route on Tuesday due to holiday).
              </Text>

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

              {manageStopsRouteId && (
                <>
                  <Text style={[styles.label, { marginTop: 24 }]}>Manage Stops for {DAYS_OF_WEEK.find(d => d.value === routeDayOfWeek)?.label}</Text>
                  <TouchableOpacity 
                    style={styles.addStopButton}
                    onPress={handleCreateStop}
                  >
                    <Plus size={20} color={Colors.primary} />
                    <Text style={styles.addStopButtonText}>Add New Stop</Text>
                  </TouchableOpacity>
                </>
              )}

              <Text style={[styles.label, { marginTop: 24 }]}>Select Stops for {DAYS_OF_WEEK.find(d => d.value === routeDayOfWeek)?.label}</Text>
              {availableStops.length === 0 ? (
                <Text style={styles.noStopsText}>No stops available for this day. Create stops with {DAYS_OF_WEEK.find(d => d.value === routeDayOfWeek)?.label} service day first.</Text>
              ) : (
                availableStops.map((stop: CommercialStop) => {
                  const isAssignedToAnother = isStopAssignedToAnotherRoute(stop.id, routeDayOfWeek, selectedRoute?.id);
                  const assignedRoute = isAssignedToAnother ? getAssignedRouteForStopDay(stop.id, routeDayOfWeek) : undefined;
                  
                  const routeAssignmentDisplay = stop.serviceDays.map(day => {
                    const assignment = stop.routeAssignments?.find(a => a.dayOfWeek === day);
                    return `${day.substring(0, 3)}: ${assignment?.routeName || 'Unassigned'}`;
                  }).join(' • ');
                  
                  return (
                    <View key={stop.id} style={styles.stopContainer}>
                      <TouchableOpacity
                        style={[
                          styles.stopSelectionItem,
                          selectedStops.includes(stop.id) && styles.stopSelectionItemSelected,
                          isAssignedToAnother && styles.stopSelectionItemDisabled,
                        ]}
                        onPress={() => !isAssignedToAnother && toggleStopSelection(stop.id)}
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
                            <Text style={styles.routeAssignmentDaysText} numberOfLines={2}>
                              {routeAssignmentDisplay}
                            </Text>
                            {isAssignedToAnother && assignedRoute && (
                              <Text style={styles.stopAssignedText}>
                                ✗ Assigned to {assignedRoute.name}
                              </Text>
                            )}
                          </View>
                          <View style={styles.stopActions}>
                            <TouchableOpacity 
                              onPress={() => viewStopHistory(stop)}
                              style={styles.iconButton}
                            >
                              <History size={16} color={Colors.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity 
                              onPress={() => handleEditStop(stop)}
                              style={styles.iconButton}
                            >
                              <Edit3 size={16} color={Colors.primary} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </TouchableOpacity>
                      {isAssignedToAnother && assignedRoute && (
                        <TouchableOpacity
                          style={styles.moveButton}
                          onPress={() => {
                            Alert.alert(
                              'Move Stop',
                              `Move this stop from ${assignedRoute.name} to ${selectedRoute ? selectedRoute.name : 'this route'}?`,
                              [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                  text: 'Move',
                                  onPress: async () => {
                                    if (selectedRoute) {
                                      await moveStopToRoute(stop.id, assignedRoute.id, selectedRoute.id, routeDayOfWeek);
                                      setSelectedStops(prev => [...prev, stop.id]);
                                    }
                                  },
                                },
                              ]
                            );
                          }}
                        >
                          <MoveRight size={16} color={Colors.background} />
                          <Text style={styles.moveButtonText}>Move to This Route</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })
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

              <Text style={[styles.label, { marginTop: 24 }]}>Service Days *</Text>
              <View style={styles.dayButtonsGrid}>
                {DAYS_OF_WEEK.map(day => (
                  <TouchableOpacity
                    key={day.value}
                    style={[
                      styles.dayButton,
                      stopServiceDays.includes(day.value) && styles.dayButtonSelected,
                    ]}
                    onPress={() => {
                      setStopServiceDays(prev => 
                        prev.includes(day.value)
                          ? prev.filter(d => d !== day.value)
                          : [...prev, day.value]
                      );
                    }}
                  >
                    <Text
                      style={[
                        styles.dayButtonText,
                        stopServiceDays.includes(day.value) && styles.dayButtonTextSelected,
                      ]}
                    >
                      {day.label.slice(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.helpText}>
                Select which days this stop should be serviced. You can then assign this stop to routes for these specific days.
              </Text>

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
                  onPress={() => setStopCustomerId(customer.id)}
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

              <Text style={[styles.label, { marginTop: 24 }]}>Service Days *</Text>
              <View style={styles.dayButtonsGrid}>
                {DAYS_OF_WEEK.map(day => (
                  <TouchableOpacity
                    key={day.value}
                    style={[
                      styles.dayButton,
                      stopServiceDays.includes(day.value) && styles.dayButtonSelected,
                    ]}
                    onPress={() => {
                      setStopServiceDays(prev => 
                        prev.includes(day.value)
                          ? prev.filter(d => d !== day.value)
                          : [...prev, day.value]
                      );
                    }}
                  >
                    <Text
                      style={[
                        styles.dayButtonText,
                        stopServiceDays.includes(day.value) && styles.dayButtonTextSelected,
                      ]}
                    >
                      {day.label.slice(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

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

      <Modal
        visible={reorderModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setReorderModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reorder Stops</Text>
              <TouchableOpacity onPress={() => setReorderModalVisible(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <Text style={styles.helpText}>
                Arrange stops in the order the driver will service them. Use arrows to move stops up or down.
              </Text>
              
              {reorderedStops.map((stopId, index) => {
                const stop = commercialStops.find(s => s.id === stopId);
                if (!stop) return null;
                
                return (
                  <View key={stopId} style={styles.reorderStopItem}>
                    <View style={styles.reorderStopNumber}>
                      <Text style={styles.reorderStopNumberText}>{index + 1}</Text>
                    </View>
                    <View style={styles.reorderStopInfo}>
                      <Text style={styles.reorderStopName}>{stop.jobName}</Text>
                      <Text style={styles.reorderStopAddress} numberOfLines={1}>{stop.address}</Text>
                    </View>
                    <View style={styles.reorderStopActions}>
                      <TouchableOpacity
                        style={[styles.reorderArrow, index === 0 && styles.reorderArrowDisabled]}
                        onPress={() => moveStopUp(index)}
                        disabled={index === 0}
                      >
                        <Text style={styles.reorderArrowText}>▲</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.reorderArrow, index === reorderedStops.length - 1 && styles.reorderArrowDisabled]}
                        onPress={() => moveStopDown(index)}
                        disabled={index === reorderedStops.length - 1}
                      >
                        <Text style={styles.reorderArrowText}>▼</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary]}
                  onPress={() => setReorderModalVisible(false)}
                >
                  <Text style={styles.buttonSecondaryText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary]}
                  onPress={saveStopOrder}
                >
                  <Text style={styles.buttonPrimaryText}>Save Order</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={historyModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Stop History</Text>
              <TouchableOpacity onPress={() => setHistoryModalVisible(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              {selectedStop && (
                <>
                  <Text style={styles.historyStopName}>{selectedStop.jobName}</Text>
                  <Text style={styles.historyStopAddress}>{selectedStop.address}</Text>

                  <Text style={[styles.label, { marginTop: 24 }]}>Service History</Text>
                  {(!selectedStop.history || selectedStop.history.length === 0) ? (
                    <Text style={styles.noHistoryText}>No service history yet</Text>
                  ) : (
                    selectedStop.history.map((entry) => (
                      <View key={entry.id} style={styles.historyEntry}>
                        <View style={styles.historyEntryHeader}>
                          <Text style={styles.historyEntryDate}>
                            {new Date(entry.timestamp).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </Text>
                          <View style={[styles.historyStatusBadge, { 
                            backgroundColor: entry.status === 'COMPLETED' ? Colors.success : 
                                           entry.status === 'NOT_OUT' ? Colors.warning : 
                                           entry.status === 'BLOCKED' ? Colors.error : Colors.textSecondary 
                          }]}>
                            <Text style={styles.historyStatusText}>{entry.status}</Text>
                          </View>
                        </View>
                        {entry.driverName && (
                          <Text style={styles.historyEntryDriver}>Driver: {entry.driverName}</Text>
                        )}
                        {entry.notes && (
                          <Text style={styles.historyEntryNotes}>{entry.notes}</Text>
                        )}
                        {entry.photos && entry.photos.length > 0 && (
                          <Text style={styles.historyEntryPhotos}>{entry.photos.length} photo(s) attached</Text>
                        )}
                      </View>
                    ))
                  )}
                </>
              )}

              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary, { marginTop: 24 }]}
                onPress={() => setHistoryModalVisible(false)}
              >
                <Text style={styles.buttonPrimaryText}>Close</Text>
              </TouchableOpacity>
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
  manageStopsButtonInRoute: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.backgroundSecondary,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  manageStopsButtonInRouteText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  addStopButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.backgroundSecondary,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginBottom: 12,
  },
  addStopButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  routeAssignmentDaysText: {
    fontSize: 11,
    color: Colors.accent,
    marginTop: 6,
    fontWeight: '600' as const,
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
  editButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  reorderButton: {
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
  reorderButtonText: {
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
  stopContainer: {
    marginBottom: 8,
  },
  stopSelectionItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  stopSelectionItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.backgroundSecondary,
  },
  stopSelectionItemDisabled: {
    borderColor: Colors.error,
    backgroundColor: Colors.backgroundSecondary,
    opacity: 0.6,
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
  stopActions: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  iconButton: {
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
  dayButtonsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  dayButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    minWidth: 80,
    alignItems: 'center' as const,
  },
  dayButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  dayButtonText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  dayButtonTextSelected: {
    color: Colors.background,
  },
  routeTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 8,
  },
  dayBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dayBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.background,
  },
  rescheduledBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start' as const,
    marginBottom: 8,
  },
  rescheduledText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.warning,
  },
  stopAssignedText: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: '600' as const,
    marginTop: 4,
  },
  moveButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.accent,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  moveButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.background,
  },
  reorderStopItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.backgroundSecondary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  reorderStopNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  reorderStopNumberText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.background,
  },
  reorderStopInfo: {
    flex: 1,
  },
  reorderStopName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  reorderStopAddress: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  reorderStopActions: {
    flexDirection: 'column' as const,
    gap: 4,
  },
  reorderArrow: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  reorderArrowDisabled: {
    backgroundColor: Colors.border,
    opacity: 0.5,
  },
  reorderArrowText: {
    fontSize: 16,
    color: Colors.background,
  },
  historyStopName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  historyStopAddress: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  noHistoryText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic' as const,
    textAlign: 'center' as const,
    paddingVertical: 24,
  },
  historyEntry: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  historyEntryHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  historyEntryDate: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  historyStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  historyStatusText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.background,
  },
  historyEntryDriver: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  historyEntryNotes: {
    fontSize: 13,
    color: Colors.text,
    marginBottom: 4,
  },
  historyEntryPhotos: {
    fontSize: 12,
    color: Colors.primary,
    fontStyle: 'italic' as const,
  },
});
