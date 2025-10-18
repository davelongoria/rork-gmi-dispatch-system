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
import { Plus, Package, MapPin, Calendar, X, User, Trash2, Edit, Save, RefreshCw, Folder } from 'lucide-react-native';
import type { Job, JobType, RecurringJob } from '@/types';

export default function JobsScreen() {
  const { 
    jobs, 
    customers, 
    dumpSites, 
    addJob, 
    updateJob, 
    deleteJob,
    recurringJobs,
    addRecurringJob,
    updateRecurringJob,
    deleteRecurringJob,
  } = useData();
  const { theme } = useTheme();
  const colors = theme?.colors || {};
  
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [recurringModalVisible, setRecurringModalVisible] = useState<boolean>(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [editingRecurringJob, setEditingRecurringJob] = useState<RecurringJob | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [jobType, setJobType] = useState<JobType>('DELIVER');
  const [address, setAddress] = useState<string>('');
  const [containerSize, setContainerSize] = useState<string>('');
  const [material, setMaterial] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [serviceDate, setServiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedDumpSite, setSelectedDumpSite] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');
  const [showRecurringJobs, setShowRecurringJobs] = useState<boolean>(false);

  const unassignedJobs = jobs.filter(j => !j.routeId && j.status === 'PLANNED');
  const suspendedJobs = jobs.filter(j => j.status === 'SUSPENDED' && !j.willCompleteToday);

  const handleCreateJob = () => {
    setEditingJob(null);
    setSelectedCustomer('');
    setJobType('DELIVER');
    setAddress('');
    setContainerSize('');
    setMaterial('');
    setNotes('');
    setServiceDate(new Date().toISOString().split('T')[0]);
    setSelectedDumpSite('');
    setModalVisible(true);
  };

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    setSelectedCustomer(job.customerId);
    setJobType(job.type);
    setAddress(job.address);
    setContainerSize(job.containerSize || '');
    setMaterial(job.material || '');
    setNotes(job.notes || '');
    setServiceDate(job.serviceDate);
    setSelectedDumpSite(job.dumpSiteId || '');
    setModalVisible(true);
  };

  const handleDeleteJob = (job: Job) => {
    Alert.alert(
      'Delete Job',
      `Are you sure you want to delete this job for ${job.customerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteJob(job.id);
            Alert.alert('Success', 'Job deleted successfully');
          },
        },
      ]
    );
  };

  const handleSaveJob = async () => {
    if (!selectedCustomer || !address) {
      Alert.alert('Error', 'Please fill in customer and address');
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomer);

    if (editingJob) {
      await updateJob(editingJob.id, {
        customerId: selectedCustomer,
        customerName: customer?.name,
        type: jobType,
        containerSize,
        material,
        address,
        serviceDate,
        notes,
        dumpSiteId: selectedDumpSite || undefined,
      });
      Alert.alert('Success', 'Job updated successfully');
    } else {
      const newJob: Job = {
        id: `job-${Date.now()}`,
        customerId: selectedCustomer,
        customerName: customer?.name,
        type: jobType,
        containerSize,
        material,
        address,
        serviceDate,
        notes,
        dumpSiteId: selectedDumpSite || undefined,
        status: 'PLANNED',
        createdAt: new Date().toISOString(),
      };
      await addJob(newJob);
      Alert.alert('Success', 'Job created successfully');
    }
    setModalVisible(false);
  };

  const handleCreateRecurringJob = () => {
    setEditingRecurringJob(null);
    setSelectedCustomer('');
    setJobType('DELIVER');
    setAddress('');
    setContainerSize('');
    setMaterial('');
    setNotes('');
    setProjectName('');
    setSelectedDumpSite('');
    setRecurringModalVisible(true);
  };

  const handleEditRecurringJob = (recurringJob: RecurringJob) => {
    setEditingRecurringJob(recurringJob);
    setSelectedCustomer(recurringJob.customerId);
    setJobType(recurringJob.type);
    setAddress(recurringJob.address);
    setContainerSize(recurringJob.containerSize || '');
    setMaterial(recurringJob.material || '');
    setNotes(recurringJob.notes || '');
    setProjectName(recurringJob.projectName || '');
    setSelectedDumpSite(recurringJob.dumpSiteId || '');
    setRecurringModalVisible(true);
  };

  const handleSaveRecurringJob = async () => {
    if (!selectedCustomer || !address) {
      Alert.alert('Error', 'Please fill in customer and address');
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomer);

    if (editingRecurringJob) {
      await updateRecurringJob(editingRecurringJob.id, {
        customerId: selectedCustomer,
        customerName: customer?.name,
        type: jobType,
        containerSize,
        material,
        address,
        notes,
        projectName,
        dumpSiteId: selectedDumpSite || undefined,
      });
      Alert.alert('Success', 'Recurring job updated successfully');
    } else {
      const newRecurringJob: RecurringJob = {
        id: `recurring-job-${Date.now()}`,
        customerId: selectedCustomer,
        customerName: customer?.name,
        type: jobType,
        containerSize,
        material,
        address,
        notes,
        projectName,
        dumpSiteId: selectedDumpSite || undefined,
        createdAt: new Date().toISOString(),
      };
      await addRecurringJob(newRecurringJob);
      Alert.alert('Success', 'Recurring job template created successfully');
    }
    setRecurringModalVisible(false);
  };

  const handleDeleteRecurringJob = (recurringJob: RecurringJob) => {
    Alert.alert(
      'Delete Recurring Job',
      `Are you sure you want to delete this recurring job template for ${recurringJob.customerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteRecurringJob(recurringJob.id);
            Alert.alert('Success', 'Recurring job template deleted');
          },
        },
      ]
    );
  };

  const handleCreateJobFromRecurring = (recurringJob: RecurringJob) => {
    Alert.prompt(
      'Create Job from Template',
      'Enter service date (YYYY-MM-DD):',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async (inputDate) => {
            const date = inputDate || new Date().toISOString().split('T')[0];
            
            const newJob: Job = {
              id: `job-${Date.now()}`,
              customerId: recurringJob.customerId,
              customerName: recurringJob.customerName,
              type: recurringJob.type,
              containerSize: recurringJob.containerSize,
              material: recurringJob.material,
              address: recurringJob.address,
              serviceDate: date,
              notes: recurringJob.notes,
              dumpSiteId: recurringJob.dumpSiteId,
              status: 'PLANNED',
              createdAt: new Date().toISOString(),
            };
            
            await addJob(newJob);
            Alert.alert('Success', 'Job created from template');
          },
        },
      ],
      'plain-text',
      new Date().toISOString().split('T')[0]
    );
  };

  const getJobTypeColor = (type: JobType) => {
    switch (type) {
      case 'DELIVER':
        return Colors.success;
      case 'PICKUP':
        return Colors.accent;
      case 'SWITCH':
        return Colors.warning;
      case 'ROUND_TRIP':
        return Colors.primary;
      default:
        return Colors.textSecondary;
    }
  };

  const getJobTypeLabel = (type: JobType) => {
    switch (type) {
      case 'DELIVER':
        return 'Deliver';
      case 'PICKUP':
        return 'Pickup';
      case 'SWITCH':
        return 'Switch Out';
      case 'ROUND_TRIP':
        return 'Round Trip';
      default:
        return type;
    }
  };

  const renderJob = ({ item }: { item: Job }) => (
    <View style={styles.jobCard}>
      <View style={styles.jobHeader}>
        <View style={styles.jobInfo}>
          <Text style={styles.jobTitle}>{item.customerName}</Text>
          <View style={styles.jobMeta}>
            <MapPin size={14} color={Colors.textSecondary} />
            <Text style={styles.jobMetaText} numberOfLines={1}>{item.address}</Text>
          </View>
          {item.containerSize && (
            <View style={styles.jobMeta}>
              <Package size={14} color={Colors.textSecondary} />
              <Text style={styles.jobMetaText}>{item.containerSize} - {item.material}</Text>
            </View>
          )}
          <View style={styles.jobMeta}>
            <Calendar size={14} color={Colors.textSecondary} />
            <Text style={styles.jobMetaText}>{item.serviceDate}</Text>
          </View>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: getJobTypeColor(item.type) }]}>
          <Text style={styles.typeText}>{getJobTypeLabel(item.type)}</Text>
        </View>
      </View>
      <View style={styles.jobActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleEditJob(item)}>
          <Edit size={18} color={Colors.primary} />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButtonDelete} onPress={() => handleDeleteJob(item)}>
          <Trash2 size={18} color={Colors.error} />
          <Text style={styles.actionButtonTextDelete}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSuspendedJob = ({ item }: { item: Job }) => (
    <View style={styles.suspendedJobCard}>
      <View style={styles.suspendedBadge}>
        <Text style={styles.suspendedBadgeText}>SUSPENDED</Text>
      </View>
      <View style={styles.jobHeader}>
        <View style={styles.jobInfo}>
          <Text style={styles.jobTitle}>{item.customerName}</Text>
          <View style={styles.jobMeta}>
            <MapPin size={14} color={Colors.textSecondary} />
            <Text style={styles.jobMetaText} numberOfLines={1}>{item.address}</Text>
          </View>
          {item.containerSize && (
            <View style={styles.jobMeta}>
              <Package size={14} color={Colors.textSecondary} />
              <Text style={styles.jobMetaText}>{item.containerSize} - {item.material}</Text>
            </View>
          )}
          <View style={styles.jobMeta}>
            <Calendar size={14} color={Colors.textSecondary} />
            <Text style={styles.jobMetaText}>{item.serviceDate}</Text>
          </View>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: getJobTypeColor(item.type) }]}>
          <Text style={styles.typeText}>{getJobTypeLabel(item.type)}</Text>
        </View>
      </View>
      {item.suspendedByDriverName && (
        <View style={styles.suspendedInfo}>
          <User size={14} color={Colors.error} />
          <Text style={styles.suspendedInfoText}>
            Suspended by {item.suspendedByDriverName}
            {item.suspendedDate && ` on ${new Date(item.suspendedDate).toLocaleDateString()}`}
          </Text>
        </View>
      )}
      {item.suspendedLocation && (
        <View style={styles.suspendedInfo}>
          <MapPin size={14} color={Colors.error} />
          <Text style={styles.suspendedInfoText}>Location: {item.suspendedLocation}</Text>
        </View>
      )}
      {item.suspendedNotes && (
        <View style={styles.suspendedNotesBox}>
          <Text style={styles.suspendedNotesLabel}>Notes:</Text>
          <Text style={styles.suspendedNotesText}>{item.suspendedNotes}</Text>
        </View>
      )}
      <View style={styles.jobActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleEditJob(item)}>
          <Edit size={18} color={Colors.primary} />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButtonDelete} onPress={() => handleDeleteJob(item)}>
          <Trash2 size={18} color={Colors.error} />
          <Text style={styles.actionButtonTextDelete}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRecurringJob = ({ item }: { item: RecurringJob }) => (
    <View style={styles.recurringJobCard}>
      <View style={styles.jobHeader}>
        <View style={styles.jobInfo}>
          <View style={styles.recurringBadgeRow}>
            <Text style={styles.jobTitle}>{item.customerName}</Text>
            {item.projectName && (
              <View style={styles.projectBadge}>
                <Folder size={12} color={Colors.background} />
                <Text style={styles.projectBadgeText}>{item.projectName}</Text>
              </View>
            )}
          </View>
          <View style={styles.jobMeta}>
            <MapPin size={14} color={Colors.textSecondary} />
            <Text style={styles.jobMetaText} numberOfLines={1}>{item.address}</Text>
          </View>
          {item.containerSize && (
            <View style={styles.jobMeta}>
              <Package size={14} color={Colors.textSecondary} />
              <Text style={styles.jobMetaText}>{item.containerSize} - {item.material}</Text>
            </View>
          )}
        </View>
        <View style={[styles.typeBadge, { backgroundColor: getJobTypeColor(item.type) }]}>
          <Text style={styles.typeText}>{getJobTypeLabel(item.type)}</Text>
        </View>
      </View>
      <View style={styles.jobActions}>
        <TouchableOpacity 
          style={styles.actionButtonCreate} 
          onPress={() => handleCreateJobFromRecurring(item)}
        >
          <Plus size={18} color={Colors.success} />
          <Text style={styles.actionButtonTextCreate}>Create Job</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => handleEditRecurringJob(item)}
        >
          <Edit size={18} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButtonDelete} 
          onPress={() => handleDeleteRecurringJob(item)}
        >
          <Trash2 size={18} color={Colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const jobTypes: JobType[] = ['DELIVER', 'PICKUP', 'SWITCH', 'ROUND_TRIP'];

  const Colors = colors;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Package size={20} color={Colors.primary} />
          <Text style={styles.headerText}>
            {showRecurringJobs ? 'Recurring Jobs' : 'Unassigned Jobs'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.toggleButton} 
            onPress={() => setShowRecurringJobs(!showRecurringJobs)}
          >
            <RefreshCw size={20} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={showRecurringJobs ? handleCreateRecurringJob : handleCreateJob}
          >
            <Plus size={24} color={Colors.background} />
          </TouchableOpacity>
        </View>
      </View>

      {showRecurringJobs ? (
        <FlatList
          data={recurringJobs}
          renderItem={renderRecurringJob}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No recurring job templates</Text>
              <Text style={styles.emptySubtext}>Tap + to create a recurring job template</Text>
            </View>
          }
        />
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {suspendedJobs.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Suspended Jobs ({suspendedJobs.length})</Text>
              {suspendedJobs.map(job => (
                <View key={job.id}>
                  {renderSuspendedJob({ item: job })}
                </View>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Unassigned Jobs ({unassignedJobs.length})</Text>
            {unassignedJobs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No unassigned jobs</Text>
                <Text style={styles.emptySubtext}>Tap + to create a new job</Text>
              </View>
            ) : (
              unassignedJobs.map(job => (
                <View key={job.id}>
                  {renderJob({ item: job })}
                </View>
              ))
            )}
          </View>
        </ScrollView>
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
              <Text style={styles.modalTitle}>{editingJob ? 'Edit Job' : 'Create Job'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <Text style={styles.label}>Job Type</Text>
              <View style={styles.typeSelector}>
                {jobTypes.map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      jobType === type && { backgroundColor: getJobTypeColor(type) },
                    ]}
                    onPress={() => setJobType(type)}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        jobType === type && styles.typeButtonTextSelected,
                      ]}
                    >
                      {getJobTypeLabel(type)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Customer</Text>
              {customers.filter(c => c.active).map(customer => (
                <TouchableOpacity
                  key={customer.id}
                  style={[
                    styles.selectionItem,
                    selectedCustomer === customer.id && styles.selectionItemSelected,
                  ]}
                  onPress={() => setSelectedCustomer(customer.id)}
                >
                  <View style={styles.customerItem}>
                    <User size={16} color={selectedCustomer === customer.id ? Colors.primary : Colors.textSecondary} />
                    <View style={styles.customerInfo}>
                      <Text
                        style={[
                          styles.selectionText,
                          selectedCustomer === customer.id && styles.selectionTextSelected,
                        ]}
                      >
                        {customer.name}
                      </Text>
                      <Text style={styles.customerAddress} numberOfLines={1}>{customer.address}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}

              <Text style={[styles.label, { marginTop: 24 }]}>Service Address</Text>
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter service address"
                placeholderTextColor={Colors.textSecondary}
              />

              <Text style={styles.label}>Container Size</Text>
              <TextInput
                style={styles.input}
                value={containerSize}
                onChangeText={setContainerSize}
                placeholder="e.g., 20 yard, 30 yard"
                placeholderTextColor={Colors.textSecondary}
              />

              <Text style={styles.label}>Material</Text>
              <TextInput
                style={styles.input}
                value={material}
                onChangeText={setMaterial}
                placeholder="e.g., Construction debris, Scrap metal"
                placeholderTextColor={Colors.textSecondary}
              />

              <Text style={styles.label}>Service Date</Text>
              <TextInput
                style={styles.input}
                value={serviceDate}
                onChangeText={setServiceDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textSecondary}
              />

              <Text style={styles.label}>Dump Site (Optional)</Text>
              <View style={styles.dumpSiteSelector}>
                <TouchableOpacity
                  style={[
                    styles.selectionItem,
                    !selectedDumpSite && styles.selectionItemSelected,
                  ]}
                  onPress={() => setSelectedDumpSite('')}
                >
                  <Text
                    style={[
                      styles.selectionText,
                      !selectedDumpSite && styles.selectionTextSelected,
                    ]}
                  >
                    No dump site assigned
                  </Text>
                </TouchableOpacity>
                {dumpSites.filter(d => d.active).map(dumpSite => (
                  <TouchableOpacity
                    key={dumpSite.id}
                    style={[
                      styles.selectionItem,
                      selectedDumpSite === dumpSite.id && styles.selectionItemSelected,
                    ]}
                    onPress={() => setSelectedDumpSite(dumpSite.id)}
                  >
                    <View style={styles.dumpSiteItem}>
                      <MapPin size={16} color={selectedDumpSite === dumpSite.id ? Colors.primary : Colors.textSecondary} />
                      <View style={styles.dumpSiteInfo}>
                        <Text
                          style={[
                            styles.selectionText,
                            selectedDumpSite === dumpSite.id && styles.selectionTextSelected,
                          ]}
                        >
                          {dumpSite.name}
                        </Text>
                        <Text style={styles.dumpSiteAddress} numberOfLines={1}>{dumpSite.address}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { marginTop: 24 }]}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Additional notes"
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={3}
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.buttonSecondaryText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary]}
                  onPress={handleSaveJob}
                >
                  <Text style={styles.buttonPrimaryText}>{editingJob ? 'Save' : 'Create'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={recurringModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setRecurringModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingRecurringJob ? 'Edit Recurring Job' : 'Create Recurring Job'}
              </Text>
              <TouchableOpacity onPress={() => setRecurringModalVisible(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <View style={styles.infoBox}>
                <RefreshCw size={20} color={Colors.primary} />
                <Text style={styles.infoText}>
                  Recurring job templates can be quickly reused to create new jobs for ongoing projects.
                </Text>
              </View>

              <Text style={styles.label}>Project Name (Optional)</Text>
              <TextInput
                style={styles.input}
                value={projectName}
                onChangeText={setProjectName}
                placeholder="e.g., Downtown Construction Project"
                placeholderTextColor={Colors.textSecondary}
              />

              <Text style={styles.label}>Job Type</Text>
              <View style={styles.typeSelector}>
                {jobTypes.map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      jobType === type && { backgroundColor: getJobTypeColor(type) },
                    ]}
                    onPress={() => setJobType(type)}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        jobType === type && styles.typeButtonTextSelected,
                      ]}
                    >
                      {getJobTypeLabel(type)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Customer</Text>
              {customers.filter(c => c.active).map(customer => (
                <TouchableOpacity
                  key={customer.id}
                  style={[
                    styles.selectionItem,
                    selectedCustomer === customer.id && styles.selectionItemSelected,
                  ]}
                  onPress={() => setSelectedCustomer(customer.id)}
                >
                  <View style={styles.customerItem}>
                    <User size={16} color={selectedCustomer === customer.id ? Colors.primary : Colors.textSecondary} />
                    <View style={styles.customerInfo}>
                      <Text
                        style={[
                          styles.selectionText,
                          selectedCustomer === customer.id && styles.selectionTextSelected,
                        ]}
                      >
                        {customer.name}
                      </Text>
                      <Text style={styles.customerAddress} numberOfLines={1}>{customer.address}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}

              <Text style={[styles.label, { marginTop: 24 }]}>Service Address</Text>
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter service address"
                placeholderTextColor={Colors.textSecondary}
              />

              <Text style={styles.label}>Container Size</Text>
              <TextInput
                style={styles.input}
                value={containerSize}
                onChangeText={setContainerSize}
                placeholder="e.g., 20 yard, 30 yard"
                placeholderTextColor={Colors.textSecondary}
              />

              <Text style={styles.label}>Material</Text>
              <TextInput
                style={styles.input}
                value={material}
                onChangeText={setMaterial}
                placeholder="e.g., Construction debris, Scrap metal"
                placeholderTextColor={Colors.textSecondary}
              />

              <Text style={styles.label}>Dump Site (Optional)</Text>
              <View style={styles.dumpSiteSelector}>
                <TouchableOpacity
                  style={[
                    styles.selectionItem,
                    !selectedDumpSite && styles.selectionItemSelected,
                  ]}
                  onPress={() => setSelectedDumpSite('')}
                >
                  <Text
                    style={[
                      styles.selectionText,
                      !selectedDumpSite && styles.selectionTextSelected,
                    ]}
                  >
                    No dump site assigned
                  </Text>
                </TouchableOpacity>
                {dumpSites.filter(d => d.active).map(dumpSite => (
                  <TouchableOpacity
                    key={dumpSite.id}
                    style={[
                      styles.selectionItem,
                      selectedDumpSite === dumpSite.id && styles.selectionItemSelected,
                    ]}
                    onPress={() => setSelectedDumpSite(dumpSite.id)}
                  >
                    <View style={styles.dumpSiteItem}>
                      <MapPin size={16} color={selectedDumpSite === dumpSite.id ? Colors.primary : Colors.textSecondary} />
                      <View style={styles.dumpSiteInfo}>
                        <Text
                          style={[
                            styles.selectionText,
                            selectedDumpSite === dumpSite.id && styles.selectionTextSelected,
                          ]}
                        >
                          {dumpSite.name}
                        </Text>
                        <Text style={styles.dumpSiteAddress} numberOfLines={1}>{dumpSite.address}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { marginTop: 24 }]}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Additional notes"
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={3}
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary]}
                  onPress={() => setRecurringModalVisible(false)}
                >
                  <Text style={styles.buttonSecondaryText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary]}
                  onPress={handleSaveRecurringJob}
                >
                  <Save size={18} color={Colors.background} />
                  <Text style={styles.buttonPrimaryText}>
                    {editingRecurringJob ? 'Save' : 'Save Template'}
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

const createStyles = (Colors: any) => StyleSheet.create({
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
  },
  toggleButton: {
    width: 48,
    height: 48,
    backgroundColor: Colors.background,
    borderRadius: 12,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  addButton: {
    width: 48,
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  jobCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  recurringJobCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  jobHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
  },
  jobInfo: {
    flex: 1,
    marginRight: 12,
  },
  recurringBadgeRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 8,
  },
  projectBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  projectBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.background,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  jobMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  jobMetaText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 6,
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.background,
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
  infoBox: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  typeSelector: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginBottom: 24,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  typeButtonTextSelected: {
    color: Colors.background,
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
  customerItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  customerInfo: {
    flex: 1,
  },
  selectionText: {
    fontSize: 16,
    color: Colors.text,
  },
  selectionTextSelected: {
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  customerAddress: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  input: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top' as const,
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
    flexDirection: 'row' as const,
    gap: 8,
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
  jobActions: {
    flexDirection: 'row' as const,
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.backgroundSecondary,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  actionButtonDelete: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.backgroundSecondary,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  actionButtonTextDelete: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.error,
  },
  actionButtonCreate: {
    flex: 2,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.backgroundSecondary,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  actionButtonTextCreate: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  dumpSiteSelector: {
    marginBottom: 16,
  },
  dumpSiteItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  dumpSiteInfo: {
    flex: 1,
  },
  dumpSiteAddress: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  suspendedJobCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.error,
  },
  suspendedBadge: {
    backgroundColor: Colors.error,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start' as const,
    marginBottom: 12,
  },
  suspendedBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.background,
    letterSpacing: 1,
  },
  suspendedInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  suspendedInfoText: {
    fontSize: 13,
    color: Colors.error,
    flex: 1,
  },
  suspendedNotesBox: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
  },
  suspendedNotesLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.error,
    marginBottom: 4,
  },
  suspendedNotesText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
});
