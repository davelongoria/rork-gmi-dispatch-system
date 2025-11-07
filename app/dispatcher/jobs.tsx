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
  Platform,
} from 'react-native';
import { useData } from '@/contexts/DataContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Plus, Package, MapPin, Calendar, X, User, Trash2, Edit, Save, RefreshCw, Folder, CreditCard } from 'lucide-react-native';
import type { Job, JobType, RecurringJob, CardOnFile } from '@/types';

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
  const [recurringJobStep, setRecurringJobStep] = useState<'customer' | 'details'>('customer');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [jobType, setJobType] = useState<JobType>('DELIVER');
  const [address, setAddress] = useState<string>('');
  const [containerSize, setContainerSize] = useState<string>('');
  const [material, setMaterial] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [jobSiteBillingAddress, setJobSiteBillingAddress] = useState<string>('');
  const [jobSiteContactEmail, setJobSiteContactEmail] = useState<string>('');
  const [jobSiteContactPhone, setJobSiteContactPhone] = useState<string>('');
  const [cardName, setCardName] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvc, setCardCvc] = useState<string>('');
  const [cardBrand, setCardBrand] = useState<CardOnFile['brand']>('VISA');
  const [serviceDate, setServiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedDumpSite, setSelectedDumpSite] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');
  const [rJobSiteBillingAddress, setRJobSiteBillingAddress] = useState<string>('');
  const [rJobSiteContactEmail, setRJobSiteContactEmail] = useState<string>('');
  const [rJobSiteContactPhone, setRJobSiteContactPhone] = useState<string>('');
  const [rCardName, setRCardName] = useState<string>('');
  const [rCardNumber, setRCardNumber] = useState<string>('');
  const [rCardExpiry, setRCardExpiry] = useState<string>('');
  const [rCardCvc, setRCardCvc] = useState<string>('');
  const [rCardBrand, setRCardBrand] = useState<CardOnFile['brand']>('VISA');
  const [showRecurringJobs, setShowRecurringJobs] = useState<boolean>(false);
  const [selectedRecurringCustomer, setSelectedRecurringCustomer] = useState<string | null>(null);
  const [createFromTemplateModal, setCreateFromTemplateModal] = useState<boolean>(false);
  const [selectedRecurringJob, setSelectedRecurringJob] = useState<RecurringJob | null>(null);
  const [templateServiceDate, setTemplateServiceDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const unassignedJobs = jobs.filter(j => !j.routeId && j.status === 'PLANNED');
  const suspendedJobs = jobs.filter(j => j.status === 'SUSPENDED' && !j.willCompleteToday);
  
  console.log('Total jobs:', jobs.length);
  console.log('Unassigned jobs:', unassignedJobs.length);
  console.log('Suspended jobs:', suspendedJobs.length);

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
    setJobSiteBillingAddress('');
    setJobSiteContactEmail('');
    setJobSiteContactPhone('');
    setCardName('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvc('');
    setCardBrand('VISA');
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
    setJobSiteBillingAddress(job.jobSiteBillingAddress || '');
    setJobSiteContactEmail(job.jobSiteContactEmail || '');
    setJobSiteContactPhone(job.jobSiteContactPhone || '');
    setCardName(job.cardOnFile?.name || '');
    setCardNumber(job.cardOnFile?.number || '');
    setCardExpiry(job.cardOnFile?.expiry || '');
    setCardCvc(job.cardOnFile?.cvc || '');
    setCardBrand(job.cardOnFile?.brand || 'VISA');
    setModalVisible(true);
  };

  const handleDeleteJob = (job: Job) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Are you sure you want to delete this job for ${job.customerName}?`);
      if (confirmed) {
        console.log('Deleting job:', job.id);
        deleteJob(job.id)
          .then(() => {
            console.log('Job deleted successfully:', job.id);
            window.alert('Job deleted successfully');
          })
          .catch((error) => {
            console.error('Failed to delete job:', error);
            window.alert('Failed to delete job');
          });
      }
    } else {
      Alert.alert(
        'Delete Job',
        `Are you sure you want to delete this job for ${job.customerName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              console.log('Deleting job:', job.id);
              deleteJob(job.id)
                .then(() => {
                  console.log('Job deleted successfully:', job.id);
                  Alert.alert('Success', 'Job deleted successfully');
                })
                .catch((error) => {
                  console.error('Failed to delete job:', error);
                  Alert.alert('Error', 'Failed to delete job');
                });
            },
          },
        ]
      );
    }
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
        jobSiteBillingAddress: jobSiteBillingAddress || undefined,
        jobSiteContactEmail: jobSiteContactEmail || undefined,
        jobSiteContactPhone: jobSiteContactPhone || undefined,
        cardOnFile: cardNumber ? { name: cardName, number: cardNumber, expiry: cardExpiry, cvc: cardCvc, brand: cardBrand } : undefined,
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
        jobSiteBillingAddress: jobSiteBillingAddress || undefined,
        jobSiteContactEmail: jobSiteContactEmail || undefined,
        jobSiteContactPhone: jobSiteContactPhone || undefined,
        cardOnFile: cardNumber ? { name: cardName, number: cardNumber, expiry: cardExpiry, cvc: cardCvc, brand: cardBrand } : undefined,
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
    setRJobSiteBillingAddress('');
    setRJobSiteContactEmail('');
    setRJobSiteContactPhone('');
    setRCardName('');
    setRCardNumber('');
    setRCardExpiry('');
    setRCardCvc('');
    setRCardBrand('VISA');
    setRecurringJobStep('customer');
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
    setRJobSiteBillingAddress(recurringJob.jobSiteBillingAddress || '');
    setRJobSiteContactEmail(recurringJob.jobSiteContactEmail || '');
    setRJobSiteContactPhone(recurringJob.jobSiteContactPhone || '');
    setRCardName(recurringJob.cardOnFile?.name || '');
    setRCardNumber(recurringJob.cardOnFile?.number || '');
    setRCardExpiry(recurringJob.cardOnFile?.expiry || '');
    setRCardCvc(recurringJob.cardOnFile?.cvc || '');
    setRCardBrand(recurringJob.cardOnFile?.brand || 'VISA');
    setRecurringJobStep('details');
    setRecurringModalVisible(true);
  };

  const handleSelectCustomerForRecurring = (customerId: string) => {
    setSelectedCustomer(customerId);
    setRecurringJobStep('details');
  };

  const handleBackToCustomerSelection = () => {
    setRecurringJobStep('customer');
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
        jobSiteBillingAddress: rJobSiteBillingAddress || undefined,
        jobSiteContactEmail: rJobSiteContactEmail || undefined,
        jobSiteContactPhone: rJobSiteContactPhone || undefined,
        cardOnFile: rCardNumber ? { name: rCardName, number: rCardNumber, expiry: rCardExpiry, cvc: rCardCvc, brand: rCardBrand } : undefined,
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
        jobSiteBillingAddress: rJobSiteBillingAddress || undefined,
        jobSiteContactEmail: rJobSiteContactEmail || undefined,
        jobSiteContactPhone: rJobSiteContactPhone || undefined,
        cardOnFile: rCardNumber ? { name: rCardName, number: rCardNumber, expiry: rCardExpiry, cvc: rCardCvc, brand: rCardBrand } : undefined,
        createdAt: new Date().toISOString(),
      };
      await addRecurringJob(newRecurringJob);
      
      setJobType('DELIVER');
      setAddress('');
      setContainerSize('');
      setMaterial('');
      setNotes('');
      setProjectName('');
      setSelectedDumpSite('');
      setRJobSiteBillingAddress('');
      setRJobSiteContactEmail('');
      setRJobSiteContactPhone('');
      setRCardName('');
      setRCardNumber('');
      setRCardExpiry('');
      setRCardCvc('');
      setRCardBrand('VISA');
      
      if (Platform.OS === 'web') {
        const addAnother = window.confirm('Recurring job template created successfully. Add another for this customer?');
        if (!addAnother) {
          setRecurringModalVisible(false);
        }
      } else {
        Alert.alert(
          'Success',
          'Recurring job template created successfully. Add another for this customer?',
          [
            {
              text: 'Done',
              onPress: () => setRecurringModalVisible(false),
            },
            {
              text: 'Add Another',
              onPress: () => {},
            },
          ]
        );
      }
    }
  };

  const handleDeleteRecurringJob = (recurringJob: RecurringJob) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Are you sure you want to delete this recurring job template for ${recurringJob.customerName}?`);
      if (confirmed) {
        console.log('Deleting recurring job:', recurringJob.id);
        deleteRecurringJob(recurringJob.id)
          .then(() => {
            console.log('Recurring job deleted successfully:', recurringJob.id);
            window.alert('Recurring job template deleted');
          })
          .catch((error) => {
            console.error('Failed to delete recurring job:', error);
            window.alert('Failed to delete recurring job');
          });
      }
    } else {
      Alert.alert(
        'Delete Recurring Job',
        `Are you sure you want to delete this recurring job template for ${recurringJob.customerName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              console.log('Deleting recurring job:', recurringJob.id);
              deleteRecurringJob(recurringJob.id)
                .then(() => {
                  console.log('Recurring job deleted successfully:', recurringJob.id);
                  Alert.alert('Success', 'Recurring job template deleted');
                })
                .catch((error) => {
                  console.error('Failed to delete recurring job:', error);
                  Alert.alert('Error', 'Failed to delete recurring job');
                });
            },
          },
        ]
      );
    }
  };

  const handleCreateJobFromRecurring = (recurringJob: RecurringJob) => {
    setSelectedRecurringJob(recurringJob);
    setTemplateServiceDate(new Date().toISOString().split('T')[0]);
    setCreateFromTemplateModal(true);
  };

  const handleConfirmCreateFromTemplate = async () => {
    if (!selectedRecurringJob) return;
    
    const newJob: Job = {
      id: `job-${Date.now()}`,
      customerId: selectedRecurringJob.customerId,
      customerName: selectedRecurringJob.customerName,
      type: selectedRecurringJob.type,
      containerSize: selectedRecurringJob.containerSize,
      material: selectedRecurringJob.material,
      address: selectedRecurringJob.address,
      serviceDate: templateServiceDate,
      notes: selectedRecurringJob.notes,
      dumpSiteId: selectedRecurringJob.dumpSiteId,
      jobSiteBillingAddress: selectedRecurringJob.jobSiteBillingAddress,
      jobSiteContactEmail: selectedRecurringJob.jobSiteContactEmail,
      jobSiteContactPhone: selectedRecurringJob.jobSiteContactPhone,
      cardOnFile: selectedRecurringJob.cardOnFile,
      status: 'PLANNED',
      createdAt: new Date().toISOString(),
    };
    
    await addJob(newJob);
    setCreateFromTemplateModal(false);
    setSelectedRecurringJob(null);
    Alert.alert('Success', 'Job created from template');
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
              <Text style={styles.jobMetaText}>
                {item.containerSize}{item.material ? ` - ${item.material}` : ''}
              </Text>
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
          <Trash2 size={18} color={Colors.primary} />
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
              <Text style={styles.jobMetaText}>
                {item.containerSize}{item.material ? ` - ${item.material}` : ''}
              </Text>
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
          <User size={14} color={Colors.primary} />
          <Text style={styles.suspendedInfoText}>
            Suspended by {item.suspendedByDriverName}
            {item.suspendedDate && ` on ${new Date(item.suspendedDate).toLocaleDateString()}`}
          </Text>
        </View>
      )}
      {item.suspendedLocation && (
        <View style={styles.suspendedInfo}>
          <MapPin size={14} color={Colors.primary} />
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
          <Trash2 size={18} color={Colors.primary} />
          <Text style={styles.actionButtonTextDelete}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRecurringJob = ({ item }: { item: RecurringJob }) => {
    const displayName = item.projectName || item.address;
    return (
      <View style={styles.recurringJobCard}>
        <View style={styles.jobHeader}>
          <View style={styles.jobInfo}>
            <Text style={styles.jobTitle}>{displayName}</Text>
            <View style={styles.jobMeta}>
              <MapPin size={14} color={Colors.textSecondary} />
              <Text style={styles.jobMetaText} numberOfLines={1}>{item.address}</Text>
            </View>
            {item.containerSize && (
              <View style={styles.jobMeta}>
                <Package size={14} color={Colors.textSecondary} />
                <Text style={styles.jobMetaText}>
                  {item.containerSize}{item.material ? ` - ${item.material}` : ''}
                </Text>
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
            <Trash2 size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
        selectedRecurringCustomer ? (
          <View style={{ flex: 1 }}>
            <View style={styles.breadcrumbBar}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setSelectedRecurringCustomer(null)}
              >
                <Text style={styles.backButtonText}>← Back to Customers</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={recurringJobs.filter(rj => rj.customerId === selectedRecurringCustomer)}
              renderItem={renderRecurringJob}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No recurring jobs for this customer</Text>
                </View>
              }
            />
          </View>
        ) : (
          <FlatList
            data={(() => {
              const customerJobCounts = recurringJobs.reduce((acc, job) => {
                if (!acc[job.customerId]) {
                  acc[job.customerId] = { 
                    customerId: job.customerId,
                    customerName: job.customerName || 'Unknown Customer',
                    count: 0 
                  };
                }
                acc[job.customerId].count++;
                return acc;
              }, {} as Record<string, { customerId: string, customerName: string, count: number }>);
              return Object.values(customerJobCounts).sort((a, b) => 
                a.customerName.localeCompare(b.customerName)
              );
            })()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.customerCard}
                onPress={() => setSelectedRecurringCustomer(item.customerId)}
              >
                <View style={styles.customerCardContent}>
                  <View style={styles.customerCardIcon}>
                    <User size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.customerCardInfo}>
                    <Text style={styles.customerCardName}>{item.customerName}</Text>
                    <Text style={styles.customerCardCount}>
                      {item.count} recurring {item.count === 1 ? 'job' : 'jobs'}
                    </Text>
                  </View>
                  <Folder size={20} color={Colors.textSecondary} />
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={item => item.customerId}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No recurring job templates</Text>
                <Text style={styles.emptySubtext}>Tap + to create a recurring job template</Text>
              </View>
            }
          />
        )
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

              <Text style={[styles.label, { marginTop: 24 }]}>Job Site Billing Address</Text>
              <TextInput
                style={styles.input}
                value={jobSiteBillingAddress}
                onChangeText={setJobSiteBillingAddress}
                placeholder="Optional billing address for this job site"
                placeholderTextColor={Colors.textSecondary}
              />

              <Text style={styles.label}>Job Site Contact Email</Text>
              <TextInput
                style={styles.input}
                value={jobSiteContactEmail}
                onChangeText={setJobSiteContactEmail}
                placeholder="email@example.com"
                placeholderTextColor={Colors.textSecondary}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Text style={styles.label}>Job Site Contact Phone</Text>
              <TextInput
                style={styles.input}
                value={jobSiteContactPhone}
                onChangeText={setJobSiteContactPhone}
                placeholder="555-0100"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="phone-pad"
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

              <View style={styles.cardHeaderRow}>
                <CreditCard size={18} color={Colors.primary} />
                <Text style={[styles.label, { marginTop: 0 }]}>Card on File (Optional)</Text>
              </View>

              <View style={styles.cardBrandRow}>
                {(['VISA','MASTERCARD','AMEX','DISCOVER'] as CardOnFile['brand'][]).map(brand => (
                  <TouchableOpacity
                    key={brand}
                    style={[styles.brandChip, cardBrand === brand && styles.brandChipActive]}
                    onPress={() => setCardBrand(brand)}
                  >
                    <Text style={[styles.brandChipText, cardBrand === brand && styles.brandChipTextActive]}>{brand}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Name on Card</Text>
              <TextInput
                style={styles.input}
                value={cardName}
                onChangeText={setCardName}
                placeholder="Full name"
                placeholderTextColor={Colors.textSecondary}
              />

              <Text style={styles.label}>Card Number</Text>
              <TextInput
                style={styles.input}
                value={cardNumber}
                onChangeText={setCardNumber}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="number-pad"
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Expiry</Text>
                  <TextInput
                    style={styles.input}
                    value={cardExpiry}
                    onChangeText={setCardExpiry}
                    placeholder="MM/YY"
                    placeholderTextColor={Colors.textSecondary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Security Code</Text>
                  <TextInput
                    style={styles.input}
                    value={cardCvc}
                    onChangeText={setCardCvc}
                    placeholder="CVC"
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

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

              <Text style={[styles.label, { marginTop: 24 }]}>Job Site Billing Address</Text>
              <TextInput
                style={styles.input}
                value={rJobSiteBillingAddress}
                onChangeText={setRJobSiteBillingAddress}
                placeholder="Optional billing address for this job site"
                placeholderTextColor={Colors.textSecondary}
              />

              <Text style={styles.label}>Job Site Contact Email</Text>
              <TextInput
                style={styles.input}
                value={rJobSiteContactEmail}
                onChangeText={setRJobSiteContactEmail}
                placeholder="email@example.com"
                placeholderTextColor={Colors.textSecondary}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Text style={styles.label}>Job Site Contact Phone</Text>
              <TextInput
                style={styles.input}
                value={rJobSiteContactPhone}
                onChangeText={setRJobSiteContactPhone}
                placeholder="555-0100"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="phone-pad"
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

              <View style={styles.cardHeaderRow}>
                <CreditCard size={18} color={Colors.primary} />
                <Text style={[styles.label, { marginTop: 0 }]}>Card on File (Optional)</Text>
              </View>

              <View style={styles.cardBrandRow}>
                {(['VISA','MASTERCARD','AMEX','DISCOVER'] as CardOnFile['brand'][]).map(brand => (
                  <TouchableOpacity
                    key={brand}
                    style={[styles.brandChip, rCardBrand === brand && styles.brandChipActive]}
                    onPress={() => setRCardBrand(brand)}
                  >
                    <Text style={[styles.brandChipText, rCardBrand === brand && styles.brandChipTextActive]}>{brand}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Name on Card</Text>
              <TextInput
                style={styles.input}
                value={rCardName}
                onChangeText={setRCardName}
                placeholder="Full name"
                placeholderTextColor={Colors.textSecondary}
              />

              <Text style={styles.label}>Card Number</Text>
              <TextInput
                style={styles.input}
                value={rCardNumber}
                onChangeText={setRCardNumber}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="number-pad"
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Expiry</Text>
                  <TextInput
                    style={styles.input}
                    value={rCardExpiry}
                    onChangeText={setRCardExpiry}
                    placeholder="MM/YY"
                    placeholderTextColor={Colors.textSecondary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Security Code</Text>
                  <TextInput
                    style={styles.input}
                    value={rCardCvc}
                    onChangeText={setRCardCvc}
                    placeholder="CVC"
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

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

      <Modal
        visible={createFromTemplateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setCreateFromTemplateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Job from Template</Text>
              <TouchableOpacity onPress={() => setCreateFromTemplateModal(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              {selectedRecurringJob && (
                <View style={styles.templateInfoBox}>
                  <Text style={styles.templateInfoTitle}>{selectedRecurringJob.customerName}</Text>
                  <Text style={styles.templateInfoText}>{selectedRecurringJob.address}</Text>
                  <Text style={styles.templateInfoText}>
                    {getJobTypeLabel(selectedRecurringJob.type)}
                    {selectedRecurringJob.containerSize && ` - ${selectedRecurringJob.containerSize}`}
                  </Text>
                </View>
              )}

              <Text style={styles.label}>Service Date</Text>
              <TextInput
                style={styles.input}
                value={templateServiceDate}
                onChangeText={setTemplateServiceDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textSecondary}
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary]}
                  onPress={() => setCreateFromTemplateModal(false)}
                >
                  <Text style={styles.buttonSecondaryText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary]}
                  onPress={handleConfirmCreateFromTemplate}
                >
                  <Text style={styles.buttonPrimaryText}>Create Job</Text>
                </TouchableOpacity>
              </View>
            </View>
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
  cardHeaderRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  cardBrandRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginBottom: 8,
  },
  brandChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  brandChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  brandChipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  brandChipTextActive: {
    color: Colors.background,
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
    borderColor: Colors.primary,
  },
  actionButtonTextDelete: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
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
    borderColor: Colors.primary,
  },
  suspendedBadge: {
    backgroundColor: Colors.primary,
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
    color: Colors.primary,
    flex: 1,
  },
  suspendedNotesBox: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  suspendedNotesLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginBottom: 4,
  },
  suspendedNotesText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  templateInfoBox: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  templateInfoTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  templateInfoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  breadcrumbBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  customerCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  customerCardContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  customerCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  customerCardInfo: {
    flex: 1,
  },
  customerCardName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  customerCardCount: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
