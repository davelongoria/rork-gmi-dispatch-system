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
} from 'react-native';
import { useData } from '@/contexts/DataContext';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Plus, Calendar, User, Truck as TruckIcon, MapPin, Send, X, Package, ChevronRight, Trash2, RotateCcw } from 'lucide-react-native';
import type { Route, Job } from '@/types';

export default function RoutesScreen() {
  const { routes, drivers, trucks, jobs, addRoute, updateRoute, updateJob, deleteRoute, yards, dumpSites } = useData();
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [jobModalVisible, setJobModalVisible] = useState<boolean>(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [selectedTruck, setSelectedTruck] = useState<string>('');
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [selectedYard, setSelectedYard] = useState<string>('');
  const [selectedDumpSite, setSelectedDumpSite] = useState<string>('');

  const [showCompleted, setShowCompleted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'rolloff' | 'commercial' | 'residential' | 'container'>('rolloff');

  const todayRoutes = routes.filter(r => {
    const today = new Date().toISOString().split('T')[0];
    if (showCompleted) {
      return r.date === today;
    }
    return r.date === today && r.status !== 'COMPLETED';
  }).sort((a, b) => {
    const statusOrder = { PLANNED: 0, DISPATCHED: 1, IN_PROGRESS: 2, COMPLETED: 3 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  const handleCreateRoute = () => {
    setSelectedDriver('');
    setSelectedTruck('');
    setSelectedJobs([]);
    setSelectedYard('');
    setSelectedDumpSite('');
    setModalVisible(true);
  };

  const handleManageJobs = (route: Route) => {
    setSelectedRoute(route);
    setSelectedJobs([...route.jobIds]);
    setJobModalVisible(true);
  };

  const handleSaveRoute = async () => {
    if (!selectedDriver || !selectedTruck) {
      Alert.alert('Error', 'Please select driver and truck');
      return;
    }

    const driver = drivers.find(d => d.id === selectedDriver);
    const truck = trucks.find(t => t.id === selectedTruck);

    const newRoute: Route = {
      id: `route-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      driverId: selectedDriver,
      driverName: driver?.name,
      truckId: selectedTruck,
      truckUnitNumber: truck?.unitNumber,
      yardStartId: selectedYard || undefined,
      dumpSiteEndId: selectedDumpSite || undefined,
      jobIds: selectedJobs,
      status: 'PLANNED',
      createdAt: new Date().toISOString(),
    };

    await addRoute(newRoute);
    
    for (const jobId of selectedJobs) {
      await updateJob(jobId, { routeId: newRoute.id, status: 'ASSIGNED' });
    }
    
    setModalVisible(false);
    Alert.alert('Success', 'Route created successfully');
  };

  const handleSaveJobs = async () => {
    if (!selectedRoute) return;

    const oldJobIds = selectedRoute.jobIds;
    const removedJobs = oldJobIds.filter(id => !selectedJobs.includes(id));
    const addedJobs = selectedJobs.filter(id => !oldJobIds.includes(id));

    for (const jobId of removedJobs) {
      await updateJob(jobId, { routeId: undefined, status: 'PLANNED' });
    }

    for (const jobId of addedJobs) {
      await updateJob(jobId, { routeId: selectedRoute.id, status: 'ASSIGNED' });
    }

    await updateRoute(selectedRoute.id, { jobIds: selectedJobs });
    setJobModalVisible(false);
    Alert.alert('Success', 'Jobs updated successfully');
  };

  const toggleJobSelection = (jobId: string) => {
    setSelectedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const availableJobs = jobs.filter(j => 
    (j.status === 'PLANNED' || j.status === 'SUSPENDED') && !j.routeId
  );

  const getJobTypeColor = (type: Job['type']) => {
    switch (type) {
      case 'DELIVER':
        return colors.success;
      case 'PICKUP':
        return colors.accent;
      case 'SWITCH':
        return colors.warning;
      case 'ROUND_TRIP':
        return colors.primary;
      default:
        return colors.textSecondary;
    }
  };

  const getJobTypeLabel = (type: Job['type']) => {
    switch (type) {
      case 'DELIVER':
        return 'Deliver';
      case 'PICKUP':
        return 'Pickup';
      case 'SWITCH':
        return 'Switch';
      case 'ROUND_TRIP':
        return 'Round Trip';
      default:
        return type;
    }
  };

  const handleDispatchRoute = async (route: Route) => {
    Alert.alert(
      'Dispatch Route',
      `Dispatch route to ${route.driverName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dispatch',
          onPress: async () => {
            await updateRoute(route.id, {
              status: 'DISPATCHED',
              dispatchedAt: new Date().toISOString(),
            });
            Alert.alert('Success', 'Route dispatched successfully');
          },
        },
      ]
    );
  };

  const handleDeleteRoute = (route: Route) => {
    Alert.alert(
      'Delete Route',
      `Are you sure you want to delete this route? All assigned jobs will be unassigned.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            for (const jobId of route.jobIds) {
              await updateJob(jobId, { routeId: undefined, status: 'PLANNED' });
            }
            await deleteRoute(route.id);
            Alert.alert('Success', 'Route deleted successfully');
          },
        },
      ]
    );
  };

  const handleReopenRoute = (route: Route) => {
    Alert.alert(
      'Reopen Route',
      `Reopen this completed route for editing?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reopen',
          onPress: async () => {
            await updateRoute(route.id, {
              status: 'PLANNED',
              completedAt: undefined,
            });
            Alert.alert('Success', 'Route reopened successfully');
          },
        },
      ]
    );
  };

  const getStatusColor = (status: Route['status']) => {
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

  const renderRoute = ({ item }: { item: Route }) => (
    <View style={styles.routeCard}>
      <View style={styles.routeHeader}>
        <View style={styles.routeInfo}>
          <Text style={styles.routeTitle}>Route #{item.id.slice(-6)}</Text>
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
            <Text style={styles.routeMetaText}>{item.jobIds.length} jobs</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      {item.status === 'PLANNED' && (
        <View style={styles.routeActions}>
          <TouchableOpacity
            style={styles.manageJobsButton}
            onPress={() => handleManageJobs(item)}
          >
            <Package size={16} color={colors.primary} />
            <Text style={styles.manageJobsButtonText}>Manage Jobs</Text>
            <ChevronRight size={16} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.routeActionsRow}>
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
      {item.status === 'COMPLETED' && (
        <View style={styles.routeActions}>
          <TouchableOpacity
            style={styles.reopenButton}
            onPress={() => handleReopenRoute(item)}
          >
            <RotateCcw size={16} color={colors.primary} />
            <Text style={styles.reopenButtonText}>Reopen Route</Text>
          </TouchableOpacity>
        </View>
      )}
      {(item.status === 'DISPATCHED' || item.status === 'IN_PROGRESS') && (
        <View style={styles.routeActions}>
          <TouchableOpacity
            style={styles.manageJobsButton}
            onPress={() => handleManageJobs(item)}
          >
            <Package size={16} color={colors.primary} />
            <Text style={styles.manageJobsButtonText}>Manage Jobs</Text>
            <ChevronRight size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Calendar size={20} color={colors.primary} />
          <Text style={styles.headerText}>Routes</Text>
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

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'rolloff' && styles.tabActive]}
          onPress={() => setActiveTab('rolloff')}
        >
          <Text style={[styles.tabText, activeTab === 'rolloff' && styles.tabTextActive]}>
            Comm R/O
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'commercial' && styles.tabActive]}
          onPress={() => setActiveTab('commercial')}
        >
          <Text style={[styles.tabText, activeTab === 'commercial' && styles.tabTextActive]}>
            Commercial
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'residential' && styles.tabActive]}
          onPress={() => setActiveTab('residential')}
        >
          <Text style={[styles.tabText, activeTab === 'residential' && styles.tabTextActive]}>
            Resi
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'container' && styles.tabActive]}
          onPress={() => setActiveTab('container')}
        >
          <Text style={[styles.tabText, activeTab === 'container' && styles.tabTextActive]}>
            Cont.
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'rolloff' ? (
        <FlatList
          data={todayRoutes}
          renderItem={renderRoute}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No routes for today</Text>
              <Text style={styles.emptySubtext}>Tap + to create a new route</Text>
            </View>
          }
        />
      ) : activeTab === 'commercial' ? (
        <CommercialRoutesContent />
      ) : activeTab === 'residential' ? (
        <ResidentialRoutesContent />
      ) : (
        <ContainerRoutesContent />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Route</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <Text style={styles.label}>Select Driver</Text>
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

              <Text style={[styles.label, { marginTop: 24 }]}>Select Start Yard (Optional)</Text>
              {yards.filter(y => y.active).map(yard => (
                <TouchableOpacity
                  key={yard.id}
                  style={[
                    styles.selectionItem,
                    selectedYard === yard.id && styles.selectionItemSelected,
                  ]}
                  onPress={() => setSelectedYard(yard.id)}
                >
                  <Text
                    style={[
                      styles.selectionText,
                      selectedYard === yard.id && styles.selectionTextSelected,
                    ]}
                  >
                    {yard.name}
                  </Text>
                </TouchableOpacity>
              ))}

              <Text style={[styles.label, { marginTop: 24 }]}>Select Dump Site (Optional)</Text>
              {dumpSites.filter(d => d.active).map(dumpSite => (
                <TouchableOpacity
                  key={dumpSite.id}
                  style={[
                    styles.selectionItem,
                    selectedDumpSite === dumpSite.id && styles.selectionItemSelected,
                  ]}
                  onPress={() => setSelectedDumpSite(dumpSite.id)}
                >
                  <Text
                    style={[
                      styles.selectionText,
                      selectedDumpSite === dumpSite.id && styles.selectionTextSelected,
                    ]}
                  >
                    {dumpSite.name}
                  </Text>
                </TouchableOpacity>
              ))}

              <Text style={[styles.label, { marginTop: 24 }]}>Select Jobs (Optional)</Text>
              {availableJobs.length === 0 ? (
                <Text style={styles.noJobsText}>No available jobs. Create jobs first.</Text>
              ) : (
                availableJobs.map(job => (
                  <TouchableOpacity
                    key={job.id}
                    style={[
                      styles.jobSelectionItem,
                      selectedJobs.includes(job.id) && styles.jobSelectionItemSelected,
                    ]}
                    onPress={() => toggleJobSelection(job.id)}
                  >
                    <View style={styles.jobSelectionContent}>
                      <View style={styles.jobSelectionInfo}>
                        <Text style={styles.jobSelectionCustomer}>{job.customerName}</Text>
                        <Text style={styles.jobSelectionAddress} numberOfLines={1}>{job.address}</Text>
                        {job.status === 'SUSPENDED' && job.suspendedByDriverName && job.suspendedDate && (
                          <Text style={styles.suspendedInfo}>
                            Suspended by {job.suspendedByDriverName} on {new Date(job.suspendedDate).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                      <View style={[styles.jobTypeBadge, { backgroundColor: getJobTypeColor(job.type) }]}>
                        <Text style={styles.jobTypeText}>{getJobTypeLabel(job.type)}</Text>
                      </View>
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
                  <Text style={styles.buttonPrimaryText}>Create</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={jobModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setJobModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manage Jobs</Text>
              <TouchableOpacity onPress={() => setJobModalVisible(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <Text style={styles.label}>Assigned Jobs ({selectedJobs.length})</Text>
              {selectedRoute && selectedJobs.length > 0 && (
                <View style={styles.assignedJobsList}>
                  {selectedJobs.map(jobId => {
                    const job = jobs.find(j => j.id === jobId);
                    if (!job) return null;
                    return (
                      <View key={job.id} style={styles.assignedJobItem}>
                        <View style={styles.assignedJobInfo}>
                          <Text style={styles.assignedJobCustomer}>{job.customerName}</Text>
                          <Text style={styles.assignedJobAddress} numberOfLines={1}>{job.address}</Text>
                        </View>
                        <TouchableOpacity onPress={() => toggleJobSelection(job.id)}>
                          <X size={20} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}

              <Text style={[styles.label, { marginTop: 24 }]}>Available Jobs</Text>
              {availableJobs.length === 0 ? (
                <Text style={styles.noJobsText}>No available jobs</Text>
              ) : (
                availableJobs.map(job => (
                  <TouchableOpacity
                    key={job.id}
                    style={[
                      styles.jobSelectionItem,
                      selectedJobs.includes(job.id) && styles.jobSelectionItemSelected,
                    ]}
                    onPress={() => toggleJobSelection(job.id)}
                  >
                    <View style={styles.jobSelectionContent}>
                      <View style={styles.jobSelectionInfo}>
                        <Text style={styles.jobSelectionCustomer}>{job.customerName}</Text>
                        <Text style={styles.jobSelectionAddress} numberOfLines={1}>{job.address}</Text>
                        {job.status === 'SUSPENDED' && job.suspendedByDriverName && job.suspendedDate && (
                          <Text style={styles.suspendedInfo}>
                            Suspended by {job.suspendedByDriverName} on {new Date(job.suspendedDate).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                      <View style={[styles.jobTypeBadge, { backgroundColor: getJobTypeColor(job.type) }]}>
                        <Text style={styles.jobTypeText}>{getJobTypeLabel(job.type)}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary]}
                  onPress={() => setJobModalVisible(false)}
                >
                  <Text style={styles.buttonSecondaryText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary]}
                  onPress={handleSaveJobs}
                >
                  <Text style={styles.buttonPrimaryText}>Save</Text>
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
    marginBottom: 8,
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
  dispatchButton: {
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
  routeActions: {
    gap: 8,
  },
  manageJobsButton: {
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
  manageJobsButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  noJobsText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic' as const,
    marginBottom: 16,
  },
  jobSelectionItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: 8,
  },
  jobSelectionItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.backgroundSecondary,
  },
  jobSelectionContent: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  jobSelectionInfo: {
    flex: 1,
    marginRight: 12,
  },
  jobSelectionCustomer: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  jobSelectionAddress: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  jobTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  jobTypeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.background,
  },
  assignedJobsList: {
    marginBottom: 16,
  },
  assignedJobItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 12,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    marginBottom: 8,
  },
  assignedJobInfo: {
    flex: 1,
    marginRight: 12,
  },
  assignedJobCustomer: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 2,
  },
  assignedJobAddress: {
    fontSize: 12,
    color: colors.textSecondary,
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
  routeActionsRow: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  deleteButton: {
    width: 44,
    backgroundColor: colors.error,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  reopenButton: {
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
  reopenButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  suspendedInfo: {
    fontSize: 12,
    color: colors.warning,
    fontStyle: 'italic' as const,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row' as const,
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.background,
  },
  commercialContainer: {
    flex: 1,
    padding: 16,
    paddingTop: 32,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  commercialButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: colors.background,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  commercialButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  commercialDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    marginTop: 12,
    paddingHorizontal: 32,
  },
});

function CommercialRoutesContent() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);
  
  return (
    <View style={styles.commercialContainer}>
      <TouchableOpacity
        style={styles.commercialButton}
        onPress={() => router.push('/dispatcher/commercial-routes')}
      >
        <Package size={20} color={colors.primary} />
        <Text style={styles.commercialButtonText}>Manage Commercial Routes</Text>
        <ChevronRight size={20} color={colors.primary} />
      </TouchableOpacity>
      <Text style={styles.commercialDescription}>
        View and manage commercial frontload routes, stops, and schedules
      </Text>
    </View>
  );
}

function ResidentialRoutesContent() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);
  
  return (
    <View style={styles.commercialContainer}>
      <TouchableOpacity
        style={styles.commercialButton}
        onPress={() => router.push('/dispatcher/residential-routes')}
      >
        <Package size={20} color={colors.primary} />
        <Text style={styles.commercialButtonText}>Manage Residential Routes</Text>
        <ChevronRight size={20} color={colors.primary} />
      </TouchableOpacity>
      <Text style={styles.commercialDescription}>
        View and manage residential trash pickup routes and schedules
      </Text>
    </View>
  );
}

function ContainerRoutesContent() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);
  
  return (
    <View style={styles.commercialContainer}>
      <TouchableOpacity
        style={styles.commercialButton}
        onPress={() => router.push('/dispatcher/container-routes')}
      >
        <Package size={20} color={colors.primary} />
        <Text style={styles.commercialButtonText}>Manage Container Routes</Text>
        <ChevronRight size={20} color={colors.primary} />
      </TouchableOpacity>
      <Text style={styles.commercialDescription}>
        Delivery, pickup, and swap routes for toters and commercial containers
      </Text>
    </View>
  );
}
