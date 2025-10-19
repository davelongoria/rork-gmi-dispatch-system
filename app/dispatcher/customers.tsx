import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ScrollView,
  Switch,
  Linking,
} from 'react-native';
import { useData } from '@/contexts/DataContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Plus, Search, Building2, MapPin, Phone, Mail, X, FileText, Calendar, Package, Edit2, MessageSquare } from 'lucide-react-native';
import type { Customer, Report, CommercialStop, ContainerSize, ServiceFrequency, DayOfWeek, ResidentialCustomer } from '@/types';
import * as MailComposer from 'expo-mail-composer';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

export default function CustomersScreen() {
  const { customers, addCustomer, updateCustomer, deleteCustomer, jobs, dumpTickets, dumpSites, mileageLogs, addReport, dispatcherSettings, commercialStops, addCommercialStop, updateCommercialStop } = useData();
  const { theme } = useTheme();
  const colors = theme?.colors || {};
  
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customerFilter, setCustomerFilter] = useState<'all' | 'commercial' | 'residential'>('all');
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedRolloffCustomer, setSelectedRolloffCustomer] = useState<Customer | null>(null);
  const [commercialModalVisible, setCommercialModalVisible] = useState<boolean>(false);
  const [selectedCommercialStop, setSelectedCommercialStop] = useState<CommercialStop | null>(null);
  const [reportModalVisible, setReportModalVisible] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [reportStartDate, setReportStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reportEndDate, setReportEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [generatingReport, setGeneratingReport] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    billingAddress: '',
    notes: '',
  });

  const [commercialFormData, setCommercialFormData] = useState({
    jobName: '',
    customerId: '',
    address: '',
    containerSize: '2' as ContainerSize,
    containerCount: 1,
    serviceFrequency: 'ONCE_WEEK' as ServiceFrequency,
    serviceDays: [] as DayOfWeek[],
    specialInstructions: '',
  });

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const { residentialCustomers, addResidentialCustomer } = useData();
  const [residentialModalVisible, setResidentialModalVisible] = useState<boolean>(false);
  const [residentialFormData, setResidentialFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    serviceDay: 'MONDAY' as DayOfWeek,
    serviceFrequency: 'ONCE_WEEK' as 'ONCE_WEEK' | 'EVERY_OTHER_WEEK',
    weekOffset: 0,
    notes: '',
  });

  const filteredResidentialCustomers = residentialCustomers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCommercialStops = commercialStops.filter(s =>
    s.jobName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.customerName && s.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    s.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCustomer = () => {
    if (customerFilter === 'residential') {
      setResidentialFormData({
        name: '',
        address: '',
        phone: '',
        email: '',
        serviceDay: 'MONDAY',
        serviceFrequency: 'ONCE_WEEK',
        weekOffset: 0,
        notes: '',
      });
      setResidentialModalVisible(true);
    } else {
      setSelectedRolloffCustomer(null);
      setFormData({
        name: '',
        address: '',
        phone: '',
        email: '',
        billingAddress: '',
        notes: '',
      });
      setModalVisible(true);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.address) {
      Alert.alert('Error', 'Please fill in name and address');
      return;
    }

    if (selectedRolloffCustomer) {
      await updateCustomer(selectedRolloffCustomer.id, {
        name: formData.name,
        address: formData.address,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        billingAddress: formData.billingAddress || undefined,
        notes: formData.notes || undefined,
      });
      Alert.alert('Success', 'Customer updated successfully');
    } else {
      const newCustomer: Customer = {
        id: `customer-${Date.now()}`,
        name: formData.name,
        address: formData.address,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        billingAddress: formData.billingAddress || undefined,
        notes: formData.notes || undefined,
        active: true,
        createdAt: new Date().toISOString(),
      };
      await addCustomer(newCustomer);
      Alert.alert('Success', 'Customer added successfully');
    }
    setModalVisible(false);
  };

  const handleGenerateCustomerReport = (customer: Customer) => {
    setSelectedCustomer(customer);
    setReportStartDate(new Date().toISOString().split('T')[0]);
    setReportEndDate(new Date().toISOString().split('T')[0]);
    setReportModalVisible(true);
  };

  const generateCustomerReport = async () => {
    if (!selectedCustomer) return;
    
    setGeneratingReport(true);
    try {
      const startTime = new Date(reportStartDate).getTime();
      const endTime = new Date(reportEndDate).getTime() + 86400000;

      const customerJobs = jobs.filter(job => {
        if (job.customerId !== selectedCustomer.id) return false;
        if (!job.completedAt && !job.startedAt) return false;
        const jobDate = job.completedAt || job.startedAt;
        if (!jobDate) return false;
        const jobTime = new Date(jobDate).getTime();
        return jobTime >= startTime && jobTime < endTime;
      });

      const headers = [
        'Date',
        'Job Type',
        'Address',
        'Container Size',
        'Material',
        'Status',
        'Start Time',
        'End Time',
        'Start Mileage',
        'End Mileage',
        'Miles Driven',
        'Weight (lbs)',
        'Dump Site',
        'Driver',
        'Notes',
      ];

      const rows = customerJobs.map(job => {
        const dumpTicket = dumpTickets.find(t => t.jobId === job.id);
        const dumpSite = job.dumpSiteId ? dumpSites.find(d => d.id === job.dumpSiteId) : null;

        const jobMileageLogs = mileageLogs
          .filter(log => log.jobId === job.id)
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        const startMileage = jobMileageLogs[0]?.odometer || job.startMileage || 'N/A';
        const endMileage = jobMileageLogs[jobMileageLogs.length - 1]?.odometer || job.endMileage || 'N/A';
        const milesDriven =
          startMileage !== 'N/A' && endMileage !== 'N/A'
            ? String(Number(endMileage) - Number(startMileage))
            : 'N/A';

        return [
          job.completedAt ? new Date(job.completedAt).toLocaleDateString() : new Date(job.startedAt!).toLocaleDateString(),
          job.type,
          job.address,
          job.containerSize || 'N/A',
          job.material || 'N/A',
          job.status,
          job.startedAt ? new Date(job.startedAt).toLocaleTimeString() : 'N/A',
          job.completedAt ? new Date(job.completedAt).toLocaleTimeString() : 'N/A',
          String(startMileage),
          String(endMileage),
          milesDriven,
          dumpTicket?.netWeight ? String(dumpTicket.netWeight) : 'N/A',
          dumpSite?.name || 'N/A',
          jobMileageLogs[0]?.driverName || 'N/A',
          job.completionNotes || job.notes || 'N/A',
        ];
      });

      const csvRows = [
        headers.join(','),
        ...rows.map(row =>
          row.map(cell => {
            const cellStr = String(cell);
            if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
              return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
          }).join(',')
        ),
      ];
      const csvData = csvRows.join('\n');

      const report: Report = {
        id: `report-${Date.now()}`,
        name: `${selectedCustomer.name} Job History (${reportStartDate} to ${reportEndDate})`,
        type: 'CUSTOMER',
        customerId: selectedCustomer.id,
        startDate: reportStartDate,
        endDate: reportEndDate,
        description: `Job history for ${selectedCustomer.name} from ${reportStartDate} to ${reportEndDate} with ${customerJobs.length} jobs`,
        csvData,
        entriesCount: customerJobs.length,
        generatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      await addReport(report);

      Alert.alert(
        'Report Generated',
        `Report generated with ${customerJobs.length} jobs. Would you like to email it now?`,
        [
          { text: 'Later', style: 'cancel', onPress: () => setReportModalVisible(false) },
          { text: 'Email Now', onPress: () => emailReport(report) },
        ]
      );
    } catch (error) {
      console.error('Failed to generate customer report:', error);
      Alert.alert('Error', 'Failed to generate customer report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const emailReport = async (report: Report) => {
    try {
      const isAvailable = await MailComposer.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Email is not available on this device');
        return;
      }

      const fileName = `${report.name.replace(/\s+/g, '_')}_${new Date(report.generatedAt).toLocaleDateString().replace(/\//g, '-')}`;
      
      let attachments: string[] = [];

      if (Platform.OS !== 'web' && report.csvData) {
        const csvPath = `${FileSystem.documentDirectory}${fileName}.csv`;
        await FileSystem.writeAsStringAsync(csvPath, report.csvData, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        attachments.push(csvPath);
      }

      const customer = selectedCustomer;
      const emailBody = `
Report: ${report.name}
Customer: ${customer?.name}
Generated: ${new Date(report.generatedAt).toLocaleString()}
Date Range: ${report.startDate} to ${report.endDate}
Total Jobs: ${report.entriesCount}

${report.description || ''}

${Platform.OS === 'web' ? '\n\nCSV Data:\n' + report.csvData : ''}
      `.trim();

      const recipients = [];
      if (customer?.email) recipients.push(customer.email);
      if (dispatcherSettings?.reportEmail) recipients.push(dispatcherSettings.reportEmail);

      await MailComposer.composeAsync({
        recipients,
        subject: `Job History Report - ${customer?.name} - ${new Date().toLocaleDateString()}`,
        body: emailBody,
        attachments,
      });

      setReportModalVisible(false);
    } catch (error) {
      console.error('Failed to email report:', error);
      Alert.alert('Error', 'Failed to send email');
    }
  };

  const getCustomerJobCount = (customerId: string) => {
    return jobs.filter(j => j.customerId === customerId).length;
  };

  const handleAddCommercialStop = () => {
    setSelectedCommercialStop(null);
    setCommercialFormData({
      jobName: '',
      customerId: '',
      address: '',
      containerSize: '2',
      containerCount: 1,
      serviceFrequency: 'ONCE_WEEK',
      serviceDays: [],
      specialInstructions: '',
    });
    setCommercialModalVisible(true);
  };

  const handleEditCommercialStop = (stop: CommercialStop) => {
    setSelectedCommercialStop(stop);
    setCommercialFormData({
      jobName: stop.jobName,
      customerId: stop.customerId || '',
      address: stop.address,
      containerSize: stop.containerSize,
      containerCount: stop.containerCount,
      serviceFrequency: stop.serviceFrequency,
      serviceDays: stop.serviceDays,
      specialInstructions: stop.specialInstructions || '',
    });
    setCommercialModalVisible(true);
  };

  const handleSaveCommercialStop = async () => {
    if (!commercialFormData.jobName || !commercialFormData.address || commercialFormData.serviceDays.length === 0) {
      Alert.alert('Error', 'Please fill in job name, address, and select at least one service day');
      return;
    }

    const customer = commercialFormData.customerId ? customers.find(c => c.id === commercialFormData.customerId) : null;

    if (selectedCommercialStop) {
      await updateCommercialStop(selectedCommercialStop.id, {
        jobName: commercialFormData.jobName,
        customerId: commercialFormData.customerId || undefined,
        customerName: customer?.name,
        address: commercialFormData.address,
        containerSize: commercialFormData.containerSize,
        containerCount: commercialFormData.containerCount,
        serviceFrequency: commercialFormData.serviceFrequency,
        serviceDays: commercialFormData.serviceDays,
        specialInstructions: commercialFormData.specialInstructions || undefined,
      });
      Alert.alert('Success', 'Commercial stop updated successfully');
    } else {
      const newStop: CommercialStop = {
        id: `commercial-stop-${Date.now()}`,
        jobName: commercialFormData.jobName,
        customerId: commercialFormData.customerId || undefined,
        customerName: customer?.name,
        address: commercialFormData.address,
        containerSize: commercialFormData.containerSize,
        containerCount: commercialFormData.containerCount,
        serviceFrequency: commercialFormData.serviceFrequency,
        serviceDays: commercialFormData.serviceDays,
        specialInstructions: commercialFormData.specialInstructions || undefined,
        status: 'PENDING',
        active: true,
        createdAt: new Date().toISOString(),
      };

      await addCommercialStop(newStop);
      Alert.alert('Success', 'Commercial stop added successfully');
    }
    setCommercialModalVisible(false);
  };

  const toggleServiceDay = (day: DayOfWeek) => {
    const current = commercialFormData.serviceDays;
    if (current.includes(day)) {
      setCommercialFormData({ ...commercialFormData, serviceDays: current.filter(d => d !== day) });
    } else {
      setCommercialFormData({ ...commercialFormData, serviceDays: [...current, day] });
    }
  };

  const getStopRouteAssignments = (stop: CommercialStop) => {
    const assignments: string[] = [];
    stop.serviceDays.forEach(day => {
      const assignment = stop.routeAssignments?.find(a => a.dayOfWeek === day);
      if (assignment) {
        assignments.push(`${day.substring(0, 3)}: ${assignment.routeName}`);
      }
    });
    return assignments.length > 0 ? assignments.join(', ') : 'Not assigned to routes';
  };

  const handleCallCustomer = (phone: string) => {
    Alert.alert(
      'Call Customer',
      `Call ${phone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            const phoneNumber = Platform.select({
              ios: `telprompt:${phone}`,
              default: `tel:${phone}`,
            });
            if (phoneNumber) {
              Linking.openURL(phoneNumber);
            }
          }
        },
      ]
    );
  };

  const handleTextCustomer = (phone: string) => {
    Linking.openURL(`sms:${phone}`);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedRolloffCustomer(customer);
    setFormData({
      name: customer.name,
      address: customer.address,
      phone: customer.phone || '',
      email: customer.email || '',
      billingAddress: customer.billingAddress || '',
      notes: customer.notes || '',
    });
    setModalVisible(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    Alert.alert(
      'Delete Customer',
      `Are you sure you want to delete ${customer.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteCustomer(customer.id);
            Alert.alert('Success', 'Customer deleted successfully');
          },
        },
      ]
    );
  };

  const renderCustomer = ({ item }: { item: Customer }) => (
    <View style={styles.customerCard}>
      <View style={styles.customerHeader}>
        <View style={styles.customerIcon}>
          <Building2 size={24} color={Colors.background} />
        </View>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.name}</Text>
          <View style={styles.customerMeta}>
            <MapPin size={14} color={Colors.textSecondary} />
            <Text style={styles.customerMetaText}>{item.address}</Text>
          </View>
          {item.phone && (
            <View style={styles.customerMeta}>
              <Phone size={14} color={Colors.textSecondary} />
              <Text style={styles.customerMetaText}>{item.phone}</Text>
            </View>
          )}
          {item.email && (
            <View style={styles.customerMeta}>
              <Mail size={14} color={Colors.textSecondary} />
              <Text style={styles.customerMetaText}>{item.email}</Text>
            </View>
          )}
          <View style={styles.jobCountBadge}>
            <Text style={styles.jobCountText}>{getCustomerJobCount(item.id)} total jobs</Text>
          </View>
        </View>
      </View>
      <View style={styles.actionRow}>
        {item.phone && (
          <View style={styles.communicationButtons}>
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={() => handleCallCustomer(item.phone!)}
            >
              <Phone size={18} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={() => handleTextCustomer(item.phone!)}
            >
              <MessageSquare size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity 
          style={styles.reportButton} 
          onPress={() => handleGenerateCustomerReport(item)}
        >
          <FileText size={16} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      <View style={styles.customerActionsRow}>
        <TouchableOpacity 
          style={styles.customerActionButton} 
          onPress={() => handleEditCustomer(item)}
        >
          <Edit2 size={16} color={Colors.primary} />
          <Text style={styles.customerActionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.customerActionButton, styles.deleteButton]} 
          onPress={() => handleDeleteCustomer(item)}
        >
          <X size={16} color={Colors.error} />
          <Text style={[styles.customerActionButtonText, styles.deleteButtonText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCommercialStop = ({ item }: { item: CommercialStop }) => (
    <View style={styles.customerCard}>
      <View style={styles.customerHeader}>
        <View style={[styles.customerIcon, { backgroundColor: Colors.success }]}>
          <Package size={24} color={Colors.background} />
        </View>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.jobName}</Text>
          {item.customerName && (
            <View style={styles.customerMeta}>
              <Building2 size={14} color={Colors.textSecondary} />
              <Text style={styles.customerMetaText}>{item.customerName}</Text>
            </View>
          )}
          <View style={styles.customerMeta}>
            <MapPin size={14} color={Colors.textSecondary} />
            <Text style={styles.customerMetaText}>{item.address}</Text>
          </View>
          <View style={styles.commercialStopDetails}>
            <Text style={styles.commercialStopDetailText}>
              {item.containerCount}x {item.containerSize}yd • {item.serviceFrequency.replace(/_/g, ' ')}
            </Text>
          </View>
          <View style={styles.commercialStopDays}>
            {item.serviceDays.map(day => (
              <View key={day} style={styles.dayBadge}>
                <Text style={styles.dayBadgeText}>{day.substring(0, 3)}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.routeAssignmentText} numberOfLines={2}>
            {getStopRouteAssignments(item)}
          </Text>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.editButton} 
        onPress={() => handleEditCommercialStop(item)}
      >
        <Edit2 size={16} color={Colors.primary} />
        <Text style={styles.editButtonText}>Edit Stop</Text>
      </TouchableOpacity>
    </View>
  );

  const handleSaveResidentialCustomer = async () => {
    if (!residentialFormData.name || !residentialFormData.address) {
      Alert.alert('Error', 'Please fill in name and address');
      return;
    }

    const newCustomer: ResidentialCustomer = {
      id: `resi-customer-${Date.now()}`,
      name: residentialFormData.name,
      address: residentialFormData.address,
      phone: residentialFormData.phone || undefined,
      email: residentialFormData.email || undefined,
      serviceDay: residentialFormData.serviceDay,
      serviceFrequency: residentialFormData.serviceFrequency,
      weekOffset: residentialFormData.weekOffset,
      notes: residentialFormData.notes || undefined,
      active: true,
      createdAt: new Date().toISOString(),
    };

    await addResidentialCustomer(newCustomer);
    setResidentialModalVisible(false);
    Alert.alert('Success', 'Residential customer added successfully');
  };

  const Colors = colors;

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, customerFilter === 'all' && { backgroundColor: Colors.primary }]}
          onPress={() => setCustomerFilter('all')}
        >
          <Text style={[styles.filterButtonText, { color: customerFilter === 'all' ? Colors.background : Colors.text }]}>
            R/O
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, customerFilter === 'commercial' && { backgroundColor: Colors.primary }]}
          onPress={() => setCustomerFilter('commercial')}
        >
          <Text style={[styles.filterButtonText, { color: customerFilter === 'commercial' ? Colors.background : Colors.text }]}>
            Comm
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, customerFilter === 'residential' && { backgroundColor: Colors.primary }]}
          onPress={() => setCustomerFilter('residential')}
        >
          <Text style={[styles.filterButtonText, { color: customerFilter === 'residential' ? Colors.background : Colors.text }]}>
            Resi
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customers..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => {
            if (customerFilter === 'commercial') {
              handleAddCommercialStop();
            } else {
              handleAddCustomer();
            }
          }}
        >
          <Plus size={24} color={Colors.background} />
        </TouchableOpacity>
      </View>

      {customerFilter === 'commercial' ? (
        <FlatList
          data={filteredCommercialStops}
          renderItem={renderCommercialStop}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No commercial stops found</Text>
              <Text style={styles.emptySubtext}>Tap + to add your first commercial stop</Text>
            </View>
          }
        />
      ) : customerFilter === 'residential' ? (
        <FlatList
          data={filteredResidentialCustomers}
          renderItem={({ item }) => (
            <View style={styles.customerCard}>
              <View style={styles.customerHeader}>
                <View style={styles.customerIcon}>
                  <Building2 size={24} color={Colors.background} />
                </View>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{item.name}</Text>
                  <View style={styles.customerMeta}>
                    <MapPin size={14} color={Colors.textSecondary} />
                    <Text style={styles.customerMetaText}>{item.address}</Text>
                  </View>
                  {item.phone && (
                    <View style={styles.customerMeta}>
                      <Phone size={14} color={Colors.textSecondary} />
                      <Text style={styles.customerMetaText}>{item.phone}</Text>
                    </View>
                  )}
                  <View style={styles.commercialStopDetails}>
                    <Text style={styles.commercialStopDetailText}>
                      {item.serviceDay.substring(0, 3)} • {item.serviceFrequency === 'ONCE_WEEK' ? 'Weekly' : 'Bi-weekly'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No residential customers found</Text>
              <Text style={styles.emptySubtext}>Tap + to add your first residential customer</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={filteredCustomers}
          renderItem={renderCustomer}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No customers found</Text>
              <Text style={styles.emptySubtext}>Tap + to add your first customer</Text>
            </View>
          }
        />
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
              <Text style={styles.modalTitle}>{selectedRolloffCustomer ? 'Edit Customer' : 'Add Customer'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={text => setFormData({ ...formData, name: text })}
                placeholder="ABC Construction"
                placeholderTextColor={Colors.textSecondary}
              />

              <Text style={styles.label}>Address *</Text>
              <TextInput
                style={styles.input}
                value={formData.address}
                onChangeText={text => setFormData({ ...formData, address: text })}
                placeholder="123 Main St, City, State"
                placeholderTextColor={Colors.textSecondary}
              />

              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={text => setFormData({ ...formData, phone: text })}
                placeholder="555-0100"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={text => setFormData({ ...formData, email: text })}
                placeholder="contact@abc.com"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Billing Address</Text>
              <TextInput
                style={styles.input}
                value={formData.billingAddress}
                onChangeText={text => setFormData({ ...formData, billingAddress: text })}
                placeholder="Same as address or different"
                placeholderTextColor={Colors.textSecondary}
              />

              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.notes}
                onChangeText={text => setFormData({ ...formData, notes: text })}
                placeholder="Additional notes..."
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
                  onPress={handleSave}
                >
                  <Text style={styles.buttonPrimaryText}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={reportModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reportModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Customer Job Report</Text>
              <TouchableOpacity onPress={() => setReportModalVisible(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              {selectedCustomer && (
                <>
                  <View style={styles.customerInfoBox}>
                    <Text style={styles.customerInfoLabel}>Customer</Text>
                    <Text style={styles.customerInfoValue}>{selectedCustomer.name}</Text>
                    <Text style={styles.customerInfoAddress}>{selectedCustomer.address}</Text>
                  </View>

                  <View style={styles.dateRangeContainer}>
                    <View style={styles.dateField}>
                      <Text style={styles.label}>Start Date</Text>
                      <TextInput
                        style={styles.input}
                        value={reportStartDate}
                        onChangeText={setReportStartDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={Colors.textSecondary}
                      />
                    </View>
                    <View style={styles.dateField}>
                      <Text style={styles.label}>End Date</Text>
                      <TextInput
                        style={styles.input}
                        value={reportEndDate}
                        onChangeText={setReportEndDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={Colors.textSecondary}
                      />
                    </View>
                  </View>

                  <View style={styles.reportInfoBox}>
                    <Calendar size={20} color={Colors.primary} />
                    <Text style={styles.reportInfoText}>
                      This report will include all jobs completed for {selectedCustomer.name} between the selected dates.
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.generateReportButton, generatingReport && styles.generateReportButtonDisabled]}
                    onPress={generateCustomerReport}
                    disabled={generatingReport}
                  >
                    <FileText size={20} color={Colors.background} />
                    <Text style={styles.generateReportButtonText}>
                      {generatingReport ? 'Generating...' : 'Generate Report'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={commercialModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCommercialModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedCommercialStop ? 'Edit Commercial Stop' : 'Add Commercial Stop'}
              </Text>
              <TouchableOpacity onPress={() => setCommercialModalVisible(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <Text style={styles.label}>Job Name *</Text>
              <TextInput
                style={styles.input}
                value={commercialFormData.jobName}
                onChangeText={text => setCommercialFormData({ ...commercialFormData, jobName: text })}
                placeholder="Main Street Office"
                placeholderTextColor={Colors.textSecondary}
              />

              <Text style={styles.label}>Customer (Optional)</Text>
              <View style={styles.pickerContainer}>
                <TouchableOpacity 
                  style={styles.pickerButton}
                  onPress={() => {
                    Alert.alert('Select Customer', 'Choose a customer or leave blank', [
                      { text: 'None', onPress: () => setCommercialFormData({ ...commercialFormData, customerId: '' }) },
                      ...customers.map(c => ({
                        text: c.name,
                        onPress: () => setCommercialFormData({ ...commercialFormData, customerId: c.id })
                      }))
                    ]);
                  }}
                >
                  <Text style={styles.pickerButtonText}>
                    {commercialFormData.customerId ? customers.find(c => c.id === commercialFormData.customerId)?.name : 'Select Customer'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Address *</Text>
              <TextInput
                style={styles.input}
                value={commercialFormData.address}
                onChangeText={text => setCommercialFormData({ ...commercialFormData, address: text })}
                placeholder="123 Main St, City, State"
                placeholderTextColor={Colors.textSecondary}
              />

              <Text style={styles.label}>Container Size</Text>
              <View style={styles.containerSizeGrid}>
                {(['1', '1.5', '2', '4', '6', '8', 'COMPACTOR'] as ContainerSize[]).map(size => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.containerSizeButton,
                      commercialFormData.containerSize === size && styles.containerSizeButtonActive
                    ]}
                    onPress={() => setCommercialFormData({ ...commercialFormData, containerSize: size })}
                  >
                    <Text style={[
                      styles.containerSizeButtonText,
                      commercialFormData.containerSize === size && styles.containerSizeButtonTextActive
                    ]}>
                      {size === 'COMPACTOR' ? 'Comp' : `${size}yd`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Container Count</Text>
              <TextInput
                style={styles.input}
                value={String(commercialFormData.containerCount)}
                onChangeText={text => setCommercialFormData({ ...commercialFormData, containerCount: parseInt(text) || 1 })}
                placeholder="1"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="number-pad"
              />

              <Text style={styles.label}>Service Frequency</Text>
              <View style={styles.pickerContainer}>
                <TouchableOpacity 
                  style={styles.pickerButton}
                  onPress={() => {
                    const frequencies: ServiceFrequency[] = ['ONCE_WEEK', 'TWICE_WEEK', 'THREE_WEEK', 'FOUR_WEEK', 'FIVE_WEEK', 'SIX_WEEK', 'SEVEN_WEEK', 'EIGHT_WEEK', 'NINE_WEEK', 'TEN_WEEK', 'BIWEEKLY', 'MONTHLY', 'ON_CALL'];
                    Alert.alert('Select Frequency', 'Choose service frequency', frequencies.map(freq => ({
                      text: freq.replace(/_/g, ' '),
                      onPress: () => setCommercialFormData({ ...commercialFormData, serviceFrequency: freq })
                    })));
                  }}
                >
                  <Text style={styles.pickerButtonText}>
                    {commercialFormData.serviceFrequency.replace(/_/g, ' ')}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Service Days *</Text>
              <View style={styles.daysGrid}>
                {(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as DayOfWeek[]).map(day => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayButton,
                      commercialFormData.serviceDays.includes(day) && styles.dayButtonActive
                    ]}
                    onPress={() => toggleServiceDay(day)}
                  >
                    <Text style={[
                      styles.dayButtonText,
                      commercialFormData.serviceDays.includes(day) && styles.dayButtonTextActive
                    ]}>
                      {day.substring(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Special Instructions</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={commercialFormData.specialInstructions}
                onChangeText={text => setCommercialFormData({ ...commercialFormData, specialInstructions: text })}
                placeholder="Gate code, access instructions, etc."
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={3}
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary]}
                  onPress={() => setCommercialModalVisible(false)}
                >
                  <Text style={styles.buttonSecondaryText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary]}
                  onPress={handleSaveCommercialStop}
                >
                  <Text style={styles.buttonPrimaryText}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={residentialModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setResidentialModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Residential Customer</Text>
              <TouchableOpacity onPress={() => setResidentialModalVisible(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                value={residentialFormData.name}
                onChangeText={text => setResidentialFormData({ ...residentialFormData, name: text })}
                placeholder="John Doe"
                placeholderTextColor={Colors.textSecondary}
              />

              <Text style={styles.label}>Address *</Text>
              <TextInput
                style={styles.input}
                value={residentialFormData.address}
                onChangeText={text => setResidentialFormData({ ...residentialFormData, address: text })}
                placeholder="123 Main St, City, State"
                placeholderTextColor={Colors.textSecondary}
              />

              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={residentialFormData.phone}
                onChangeText={text => setResidentialFormData({ ...residentialFormData, phone: text })}
                placeholder="555-0100"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={residentialFormData.email}
                onChangeText={text => setResidentialFormData({ ...residentialFormData, email: text })}
                placeholder="john@example.com"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Service Day</Text>
              <View style={styles.daysGrid}>
                {(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as DayOfWeek[]).map(day => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayButton,
                      residentialFormData.serviceDay === day && styles.dayButtonActive
                    ]}
                    onPress={() => setResidentialFormData({ ...residentialFormData, serviceDay: day })}
                  >
                    <Text style={[
                      styles.dayButtonText,
                      residentialFormData.serviceDay === day && styles.dayButtonTextActive
                    ]}>
                      {day.substring(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Service Frequency</Text>
              <View style={styles.pickerContainer}>
                <TouchableOpacity 
                  style={styles.pickerButton}
                  onPress={() => {
                    Alert.alert('Select Frequency', 'Choose service frequency', [
                      { text: 'Once a week', onPress: () => setResidentialFormData({ ...residentialFormData, serviceFrequency: 'ONCE_WEEK' }) },
                      { text: 'Every other week', onPress: () => setResidentialFormData({ ...residentialFormData, serviceFrequency: 'EVERY_OTHER_WEEK' }) },
                    ]);
                  }}
                >
                  <Text style={styles.pickerButtonText}>
                    {residentialFormData.serviceFrequency === 'ONCE_WEEK' ? 'Once a week' : 'Every other week'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={residentialFormData.notes}
                onChangeText={text => setResidentialFormData({ ...residentialFormData, notes: text })}
                placeholder="Additional notes..."
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={3}
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary]}
                  onPress={() => setResidentialModalVisible(false)}
                >
                  <Text style={styles.buttonSecondaryText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary]}
                  onPress={handleSaveResidentialCustomer}
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

const createStyles = (Colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  searchContainer: {
    flexDirection: 'row' as const,
    padding: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: Colors.text,
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
  customerCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  customerHeader: {
    flexDirection: 'row' as const,
    marginBottom: 12,
  },
  customerIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  customerMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  customerMetaText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 6,
    flex: 1,
  },
  jobCountBadge: {
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start' as const,
  },
  jobCountText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  actionRow: {
    flexDirection: 'row' as const,
    gap: 8,
    alignItems: 'center' as const,
  },
  communicationButtons: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  reportButton: {
    width: 44,
    height: 44,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  reportButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
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
  reportModalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    maxHeight: '80%',
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
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top' as const,
  },
  buttonRow: {
    flexDirection: 'row' as const,
    gap: 12,
    marginTop: 24,
    marginBottom: 24,
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
  customerInfoBox: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  customerInfoLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  customerInfoValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  customerInfoAddress: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  dateRangeContainer: {
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: 16,
  },
  dateField: {
    flex: 1,
  },
  reportInfoBox: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  reportInfoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  generateReportButton: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 24,
  },
  generateReportButtonDisabled: {
    opacity: 0.5,
  },
  generateReportButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.background,
  },
  filterContainer: {
    flexDirection: 'row' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  commercialStopDetails: {
    marginTop: 6,
  },
  commercialStopDetailText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  commercialStopDays: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 6,
    marginTop: 8,
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
  routeAssignmentText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 6,
    fontStyle: 'italic' as const,
  },
  editButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.backgroundSecondary,
    padding: 12,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  containerSizeGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginTop: 8,
  },
  containerSizeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  containerSizeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  containerSizeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  containerSizeButtonTextActive: {
    color: Colors.background,
  },
  daysGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginTop: 8,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 60,
    alignItems: 'center' as const,
  },
  dayButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  dayButtonTextActive: {
    color: Colors.background,
  },
  pickerContainer: {
    marginTop: 8,
  },
  pickerButton: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center' as const,
    backgroundColor: Colors.background,
  },
  pickerButtonText: {
    fontSize: 16,
    color: Colors.text,
  },
  customerActionsRow: {
    flexDirection: 'row' as const,
    gap: 8,
    marginTop: 12,
  },
  customerActionButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.backgroundSecondary,
    padding: 12,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  customerActionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  deleteButton: {
    borderColor: Colors.error,
  },
  deleteButtonText: {
    color: Colors.error,
  },
});
