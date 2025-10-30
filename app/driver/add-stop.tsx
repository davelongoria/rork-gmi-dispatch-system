import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Package, MapPin, User, X } from 'lucide-react-native';
import type { Job, JobType } from '@/types';
import { US_STATES } from '@/constants/states';

export default function DriverAddStopScreen() {
  const { user } = useAuth();
  const { 
    customers, 
    dumpSites, 
    addJob, 
    routes, 
    updateRoute,
    containerRoutes,
    updateContainerRoute,
  } = useData();
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);

  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [jobType, setJobType] = useState<JobType>('DELIVER');
  const [address, setAddress] = useState<string>('');
  const [containerSize, setContainerSize] = useState<string>('');
  const [material, setMaterial] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [selectedDumpSite, setSelectedDumpSite] = useState<string>('');
  const [truckMileage, setTruckMileage] = useState<string>('');
  const [mileageState, setMileageState] = useState<string>('');

  const today = new Date().toISOString().split('T')[0];
  const todayRoutes = routes.filter(r => {
    return r.date === today && r.driverId === user?.id && (r.status === 'IN_PROGRESS' || r.status === 'COMPLETED');
  });

  const todayContainerRoutes = containerRoutes.filter(r => {
    return r.date === today && r.driverId === user?.id && (r.status === 'IN_PROGRESS' || r.status === 'COMPLETED');
  });

  const hasActiveRoute = todayRoutes.length > 0 || todayContainerRoutes.length > 0;

  const handleSaveJob = async () => {
    if (!selectedCustomer || !address) {
      Alert.alert('Error', 'Please fill in customer and address');
      return;
    }

    if (!truckMileage) {
      Alert.alert('Error', 'Please enter truck mileage');
      return;
    }

    if (!mileageState) {
      Alert.alert('Error', 'Please select a state');
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomer);

    const newJob: Job = {
      id: `job-${Date.now()}`,
      customerId: selectedCustomer,
      customerName: customer?.name,
      type: jobType,
      containerSize,
      material,
      address,
      serviceDate: today,
      notes,
      dumpSiteId: selectedDumpSite || undefined,
      status: 'PLANNED',
      startMileage: parseFloat(truckMileage),
      createdAt: new Date().toISOString(),
    };

    await addJob(newJob);

    if (hasActiveRoute) {
      Alert.alert(
        'Add to Current Route',
        'Would you like to add this job to your current route?',
        [
          {
            text: 'No',
            onPress: () => {
              Alert.alert('Success', 'Job created successfully');
              router.back();
            },
          },
          {
            text: 'Yes',
            onPress: async () => {
              if (todayRoutes.length > 0) {
                const activeRoute = todayRoutes[0];
                const updatedJobIds = [...activeRoute.jobIds, newJob.id];
                
                const routeUpdates: any = {
                  jobIds: updatedJobIds,
                };
                
                if (activeRoute.status === 'COMPLETED') {
                  routeUpdates.status = 'IN_PROGRESS';
                  routeUpdates.completedAt = undefined;
                  console.log('Reopening completed route:', activeRoute.id);
                }
                
                await updateRoute(activeRoute.id, routeUpdates);
                
                await addJob({
                  ...newJob,
                  routeId: activeRoute.id,
                  status: 'ASSIGNED',
                });
                
                const message = activeRoute.status === 'COMPLETED' 
                  ? 'Route reopened and job added' 
                  : 'Job added to your route';
                Alert.alert('Success', message);
              } else if (todayContainerRoutes.length > 0) {
                const activeRoute = todayContainerRoutes[0];
                const updatedJobIds = [...activeRoute.jobIds, newJob.id];
                
                const routeUpdates: any = {
                  jobIds: updatedJobIds,
                };
                
                if (activeRoute.status === 'COMPLETED') {
                  routeUpdates.status = 'IN_PROGRESS';
                  routeUpdates.completedAt = undefined;
                  console.log('Reopening completed container route:', activeRoute.id);
                }
                
                await updateContainerRoute(activeRoute.id, routeUpdates);
                
                await addJob({
                  ...newJob,
                  routeId: activeRoute.id,
                  status: 'ASSIGNED',
                });
                
                const message = activeRoute.status === 'COMPLETED' 
                  ? 'Route reopened and job added' 
                  : 'Job added to your route';
                Alert.alert('Success', message);
              }
              
              router.back();
            },
          },
        ]
      );
    } else {
      Alert.alert('Success', 'Job created successfully');
      router.back();
    }
  };

  const jobTypes: JobType[] = ['DELIVER', 'PICKUP', 'SWITCH', 'ROUND_TRIP'];

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

  const getJobTypeColor = (type: JobType) => {
    switch (type) {
      case 'DELIVER':
        return colors.success;
      case 'PICKUP':
        return colors.accent;
      case 'SWITCH':
        return '#FF9500';
      case 'ROUND_TRIP':
        return colors.primary;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Add Stop',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoBox}>
          <Package size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            Create a rolloff job and add it to your current route
          </Text>
        </View>

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
        <ScrollView style={styles.customerScrollView} contentContainerStyle={styles.customerScrollContent}>
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
                <User size={16} color={selectedCustomer === customer.id ? colors.primary : colors.textSecondary} />
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
        </ScrollView>

        <Text style={[styles.label, { marginTop: 24 }]}>Service Address</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder="Enter service address"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.label}>Container Size</Text>
        <TextInput
          style={styles.input}
          value={containerSize}
          onChangeText={setContainerSize}
          placeholder="e.g., 20 yard, 30 yard"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.label}>Material</Text>
        <TextInput
          style={styles.input}
          value={material}
          onChangeText={setMaterial}
          placeholder="e.g., Construction debris, Scrap metal"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.label}>Truck Mileage (Required)</Text>
        <TextInput
          style={styles.input}
          value={truckMileage}
          onChangeText={setTruckMileage}
          placeholder="Enter current truck mileage"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
        />

        <Text style={styles.label}>State (Required)</Text>
        <ScrollView style={styles.stateScrollView} contentContainerStyle={styles.stateGrid}>
          {US_STATES.map((state) => (
            <TouchableOpacity
              key={state.code}
              style={[
                styles.stateButton,
                mileageState === state.code && styles.stateButtonSelected,
              ]}
              onPress={() => setMileageState(state.code)}
            >
              <Text
                style={[
                  styles.stateButtonText,
                  mileageState === state.code && styles.stateButtonTextSelected,
                ]}
              >
                {state.code}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

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
                <MapPin size={16} color={selectedDumpSite === dumpSite.id ? colors.primary : colors.textSecondary} />
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
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={3}
        />

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonSecondaryText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={handleSaveJob}
          >
            <Text style={styles.buttonPrimaryText}>Save Stop</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  infoBox: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
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
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 2,
    borderColor: colors.border,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  typeButtonTextSelected: {
    color: colors.background,
  },
  customerScrollView: {
    maxHeight: 200,
    marginBottom: 16,
  },
  customerScrollContent: {
    gap: 8,
  },
  selectionItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  selectionItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.backgroundSecondary,
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
    color: colors.text,
  },
  selectionTextSelected: {
    fontWeight: '600' as const,
    color: colors.primary,
  },
  customerAddress: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top' as const,
  },
  stateScrollView: {
    maxHeight: 200,
    marginBottom: 16,
  },
  stateGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    paddingBottom: 8,
  },
  stateButton: {
    width: 56,
    height: 40,
    backgroundColor: colors.background,
    borderRadius: 8,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: colors.border,
  },
  stateButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stateButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  stateButtonTextSelected: {
    color: colors.background,
  },
  dumpSiteSelector: {
    marginBottom: 16,
    gap: 8,
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
    color: colors.textSecondary,
    marginTop: 2,
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
    backgroundColor: colors.background,
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
});
