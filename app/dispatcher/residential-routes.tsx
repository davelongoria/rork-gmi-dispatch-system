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
import { useTheme } from '@/contexts/ThemeContext';
import { Plus, Calendar, User, Truck as TruckIcon, MapPin, Send, X, Trash2, Edit3, GripVertical, ChevronUp, ChevronDown } from 'lucide-react-native';
import type { ResidentialRoute, ResidentialStop, DayOfWeek } from '@/types';

const DAYS_OF_WEEK: { value: DayOfWeek; label: string }[] = [
  { value: 'MONDAY', label: 'Monday' },
  { value: 'TUESDAY', label: 'Tuesday' },
  { value: 'WEDNESDAY', label: 'Wednesday' },
  { value: 'THURSDAY', label: 'Thursday' },
  { value: 'FRIDAY', label: 'Friday' },
  { value: 'SATURDAY', label: 'Saturday' },
  { value: 'SUNDAY', label: 'Sunday' },
];

export default function ResidentialRoutesScreen() {
  const { 
    residentialRoutes,
    residentialStops,
    drivers, 
    trucks,
    addResidentialRoute, 
    updateResidentialRoute, 
    deleteResidentialRoute,
  } = useData();

  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);

  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedRoute, setSelectedRoute] = useState<ResidentialRoute | null>(null);
  const [routeName, setRouteName] = useState<string>('');
  const [routeDayOfWeek, setRouteDayOfWeek] = useState<DayOfWeek>('MONDAY');
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [selectedTruck, setSelectedTruck] = useState<string>('');
  const [selectedStops, setSelectedStops] = useState<string[]>([]);
  const [isReorderMode, setIsReorderMode] = useState<boolean>(false);
  const [showCompleted, setShowCompleted] = useState<boolean>(false);

  const getCurrentWeekRoutes = () => {
    return residentialRoutes.filter((r: ResidentialRoute) => {
      if (!showCompleted && r.status === 'COMPLETED') return false;
      return true;
    }).sort((a: ResidentialRoute, b: ResidentialRoute) => {
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
    setSelectedDriver('');
    setSelectedTruck('');
    setSelectedStops([]);
    setSelectedRoute(null);
    setModalVisible(true);
  };

  const handleEditRoute = (route: ResidentialRoute) => {
    setSelectedRoute(route);
    setRouteName(route.name);
    setRouteDayOfWeek(route.dayOfWeek);
    setSelectedDriver(route.driverId || '');
    setSelectedTruck(route.truckId || '');
    setSelectedStops([...route.customerIds]);
    setIsReorderMode(false);
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
      await updateResidentialRoute(selectedRoute.id, {
        name: routeName,
        dayOfWeek: routeDayOfWeek,
        driverId: selectedDriver,
        driverName: driver?.name,
        truckId: selectedTruck,
        truckUnitNumber: truck?.unitNumber,
        customerIds: selectedStops,
      });
      Alert.alert('Success', 'Route updated successfully');
    } else {
      const newRouteId = `rr-${Date.now()}`;
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      const newRoute: ResidentialRoute = {
        id: newRouteId,
        name: routeName,
        dayOfWeek: routeDayOfWeek,
        date: dateStr,
        driverId: selectedDriver,
        driverName: driver?.name,
        truckId: selectedTruck,
        truckUnitNumber: truck?.unitNumber,
        customerIds: selectedStops,
        status: 'PLANNED',
        routeType: 'RESIDENTIAL_TRASH',
        createdAt: new Date().toISOString(),
      };

      await addResidentialRoute(newRoute);
      Alert.alert('Success', 'Route created successfully');
    }
    
    setModalVisible(false);
  };

  const toggleStopSelection = (stopId: string) => {
    setSelectedStops(prev => 
      prev.includes(stopId) 
        ? prev.filter(id => id !== stopId)
        : [...prev, stopId]
    );
  };

  const moveStopUp = (index: number) => {
    if (index === 0) return;
    const newStops = [...selectedStops];
    [newStops[index - 1], newStops[index]] = [newStops[index], newStops[index - 1]];
    setSelectedStops(newStops);
  };

  const moveStopDown = (index: number) => {
    if (index === selectedStops.length - 1) return;
    const newStops = [...selectedStops];
    [newStops[index], newStops[index + 1]] = [newStops[index + 1], newStops[index]];
    setSelectedStops(newStops);
  };

  const availableStops = residentialStops.filter((s: ResidentialStop) => 
    s.active && s.serviceDay === routeDayOfWeek
  );

  const handleDispatchRoute = async (route: ResidentialRoute) => {
    Alert.alert(
      'Dispatch Route',
      `Dispatch route to ${route.driverName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dispatch',
          onPress: async () => {
            await updateResidentialRoute(route.id, {
              status: 'DISPATCHED',
              dispatchedAt: new Date().toISOString(),
            });
            Alert.alert('Success', 'Route dispatched successfully');
          },
        },
      ]
    );
  };

  const handleDeleteRoute = (route: ResidentialRoute) => {
    Alert.alert(
      'Delete Route',
      `Are you sure you want to delete this route?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteResidentialRoute(route.id);
            Alert.alert('Success', 'Route deleted successfully');
          },
        },
      ]
    );
  };

  const getStatusColor = (status: ResidentialRoute['status']) => {
    switch (status) {
      case 'PLANNED':
        return colors.textSecondary;
      case 'DISPATCHED':
        return colors.accent;
      case 'IN_PROGRESS':
        return colors.primary;
      case 'COMPLETED':
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  const getDayLabel = (day: DayOfWeek) => {
    return DAYS_OF_WEEK.find(d => d.value === day)?.label || day;
  };

  const renderRoute = ({ item }: { item: ResidentialRoute }) => (
    <View style={styles.routeCard}>
      <View style={styles.routeHeader}>
        <View style={styles.routeInfo}>
          <View style={styles.routeTitleRow}>
            <Text style={styles.routeTitle}>{item.name}</Text>
            <View style={styles.dayBadge}>
              <Text style={styles.dayBadgeText}>{getDayLabel(item.dayOfWeek)}</Text>
            </View>
          </View>
          <View style={styles.routeMeta}>
            <User size={14} color={colors.textSecondary} />
            <Text style={styles.routeMetaText}>{item.driverName || 'Unassigned'}</Text>
          </View>
          <View style={styles.routeMeta}>
            <TruckIcon size={14} color={colors.textSecondary} />
            <Text style={styles.routeMetaText}>{item.truckUnitNumber || 'No truck'}</Text>
          </View>
          <View style={styles.routeMeta}>
            <MapPin size={14} color={colors.textSecondary} />
            <Text style={styles.routeMetaText}>{item.customerIds.length} stops</Text>
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
              <Edit3 size={16} color={colors.primary} />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dispatchButton}
              onPress={() => handleDispatchRoute(item)}
            >
              <Send size={16} color={colors.background} />
              <Text style={styles.dispatchButtonText}>Dispatch</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteRoute(item)}
            >
              <Trash2 size={16} color={colors.background} />
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
          <Calendar size={20} color={colors.primary} />
          <Text style={styles.headerText}>Residential Routes</Text>
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
            <Plus size={24} color={colors.background} />
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
            <Text style={styles.emptyText}>No residential routes</Text>
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
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <Text style={styles.label}>Route Name</Text>
              <TextInput
                style={styles.input}
                value={routeName}
                onChangeText={setRouteName}
                placeholder="e.g., North Side Monday"
                placeholderTextColor={colors.textSecondary}
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

              <View style={styles.stopsHeader}>
                <Text style={[styles.label, { marginTop: 24, marginBottom: 12 }]}>Select Stops for {getDayLabel(routeDayOfWeek)}</Text>
                {selectedStops.length > 0 && (
                  <TouchableOpacity
                    style={styles.reorderButton}
                    onPress={() => setIsReorderMode(!isReorderMode)}
                  >
                    <GripVertical size={18} color={colors.primary} />
                    <Text style={styles.reorderButtonText}>
                      {isReorderMode ? 'Done' : 'Reorder'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {isReorderMode ? (
                selectedStops.length === 0 ? (
                  <Text style={styles.noStopsText}>No stops selected yet.</Text>
                ) : (
                  selectedStops.map((stopId, index) => {
                    const stop = residentialStops.find(s => s.id === stopId);
                    if (!stop) return null;
                    return (
                      <View key={stop.id} style={styles.reorderStopItem}>
                        <View style={styles.reorderStopContent}>
                          <View style={styles.reorderStopNumber}>
                            <Text style={styles.reorderStopNumberText}>{index + 1}</Text>
                          </View>
                          <View style={styles.reorderStopInfo}>
                            <Text style={styles.stopSelectionCustomer}>
                              {stop.customerName || stop.address}
                            </Text>
                            <Text style={styles.stopSelectionAddress} numberOfLines={1}>
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
                            disabled={index === selectedStops.length - 1}
                            style={[
                              styles.reorderActionButton,
                              index === selectedStops.length - 1 && styles.reorderActionButtonDisabled,
                            ]}
                          >
                            <ChevronDown size={20} color={index === selectedStops.length - 1 ? colors.textSecondary : colors.primary} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )
              ) : (
                availableStops.length === 0 ? (
                  <Text style={styles.noStopsText}>No stops available for this day.</Text>
                ) : (
                  availableStops.map((stop: ResidentialStop) => (
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
                          <Text style={styles.stopSelectionCustomer}>
                            {stop.customerName || stop.address}
                          </Text>
                          <Text style={styles.stopSelectionAddress} numberOfLines={1}>
                            {stop.address}
                          </Text>
                          <Text style={styles.stopSelectionDetail}>
                            {stop.serviceDay}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
                )
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
    paddingTop: 0,
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
    alignItems: 'flex-start' as const,
    marginBottom: 12,
  },
  routeInfo: {
    flex: 1,
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
  },
  routeMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  routeMetaText: {
    fontSize: 14,
    color: colors.textSecondary,
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
    color: colors.background,
  },
  routeActions: {
    gap: 8,
  },
  editButton: {
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
  editButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary,
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
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  dispatchButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.background,
  },
  deleteButton: {
    width: 44,
    backgroundColor: colors.error,
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
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
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
  form: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 12,
  },
  input: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  selectionItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: 8,
  },
  selectionItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.backgroundSecondary,
  },
  selectionText: {
    fontSize: 16,
    color: colors.text,
  },
  selectionTextSelected: {
    fontWeight: '600' as const,
    color: colors.primary,
  },
  stopSelectionItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: 8,
  },
  stopSelectionItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.backgroundSecondary,
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
    color: colors.text,
    marginBottom: 4,
  },
  stopSelectionAddress: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  stopSelectionDetail: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  noStopsText: {
    fontSize: 14,
    color: colors.textSecondary,
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
    backgroundColor: colors.primary,
  },
  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.background,
  },
  buttonSecondary: {
    backgroundColor: colors.backgroundSecondary,
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
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
    borderColor: colors.border,
    minWidth: 80,
    alignItems: 'center' as const,
  },
  dayButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  dayButtonText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600' as const,
  },
  dayButtonTextSelected: {
    color: colors.background,
  },
  routeTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 8,
  },
  dayBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dayBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.background,
  },
  stopsHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
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
  reorderStopItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 16,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    marginBottom: 8,
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
});
