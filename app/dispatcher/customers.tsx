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
} from 'react-native';
import { useData } from '@/contexts/DataContext';
import Colors from '@/constants/colors';
import { Plus, Search, Building2, MapPin, Phone, Mail, X, FileText, Calendar } from 'lucide-react-native';
import type { Customer, Report } from '@/types';
import * as MailComposer from 'expo-mail-composer';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

export default function CustomersScreen() {
  const { customers, addCustomer, jobs, dumpTickets, dumpSites, mileageLogs, addReport, dispatcherSettings } = useData();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [modalVisible, setModalVisible] = useState<boolean>(false);
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

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCustomer = () => {
    setFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      billingAddress: '',
      notes: '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.address) {
      Alert.alert('Error', 'Please fill in name and address');
      return;
    }

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
    setModalVisible(false);
    Alert.alert('Success', 'Customer added successfully');
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
      <TouchableOpacity 
        style={styles.reportButton} 
        onPress={() => handleGenerateCustomerReport(item)}
      >
        <FileText size={16} color={Colors.primary} />
        <Text style={styles.reportButtonText}>Generate Report</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
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
        <TouchableOpacity style={styles.addButton} onPress={handleAddCustomer}>
          <Plus size={24} color={Colors.background} />
        </TouchableOpacity>
      </View>

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

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Customer</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
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
  reportButton: {
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
});
