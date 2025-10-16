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
} from 'react-native';
import { useData } from '@/contexts/DataContext';
import Colors from '@/constants/colors';
import { Plus, Search, Gauge, X } from 'lucide-react-native';
import type { Truck } from '@/types';

export default function TrucksScreen() {
  const { trucks, addTruck, updateTruck } = useData();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingTruck, setEditingTruck] = useState<Truck | null>(null);
  const [formData, setFormData] = useState({
    unitNumber: '',
    vin: '',
    licensePlate: '',
    odometer: '',
  });

  const filteredTrucks = trucks.filter(t =>
    t.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.licensePlate && t.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddTruck = () => {
    setEditingTruck(null);
    setFormData({ unitNumber: '', vin: '', licensePlate: '', odometer: '0' });
    setModalVisible(true);
  };

  const handleEditTruck = (truck: Truck) => {
    setEditingTruck(truck);
    setFormData({
      unitNumber: truck.unitNumber,
      vin: truck.vin || '',
      licensePlate: truck.licensePlate || '',
      odometer: truck.odometer.toString(),
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.unitNumber) {
      Alert.alert('Error', 'Please enter unit number');
      return;
    }

    const odometerValue = parseInt(formData.odometer) || 0;

    if (editingTruck) {
      await updateTruck(editingTruck.id, {
        unitNumber: formData.unitNumber,
        vin: formData.vin || undefined,
        licensePlate: formData.licensePlate || undefined,
        odometer: odometerValue,
      });
    } else {
      const newTruck: Truck = {
        id: `truck-${Date.now()}`,
        unitNumber: formData.unitNumber,
        vin: formData.vin || undefined,
        licensePlate: formData.licensePlate || undefined,
        odometer: odometerValue,
        active: true,
        createdAt: new Date().toISOString(),
      };
      await addTruck(newTruck);
    }

    setModalVisible(false);
    setFormData({ unitNumber: '', vin: '', licensePlate: '', odometer: '0' });
  };

  const renderTruck = ({ item }: { item: Truck }) => (
    <TouchableOpacity
      style={styles.truckCard}
      onPress={() => handleEditTruck(item)}
    >
      <View style={styles.truckIcon}>
        <Text style={styles.truckNumber}>{item.unitNumber}</Text>
      </View>
      <View style={styles.truckInfo}>
        <Text style={styles.truckUnit}>Unit {item.unitNumber}</Text>
        {item.licensePlate && (
          <Text style={styles.truckMeta}>Plate: {item.licensePlate}</Text>
        )}
        <View style={styles.odometerRow}>
          <Gauge size={14} color={Colors.textSecondary} />
          <Text style={styles.truckMeta}>
            {item.odometer.toLocaleString()} mi
          </Text>
        </View>
      </View>
      <View style={[styles.statusBadge, item.active ? styles.statusActive : styles.statusInactive]}>
        <Text style={styles.statusText}>{item.active ? 'Active' : 'Inactive'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search trucks..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddTruck}>
          <Plus size={24} color={Colors.background} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredTrucks}
        renderItem={renderTruck}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No trucks found</Text>
            <Text style={styles.emptySubtext}>Tap + to add your first truck</Text>
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
                {editingTruck ? 'Edit Truck' : 'Add Truck'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Unit Number *</Text>
              <TextInput
                style={styles.input}
                value={formData.unitNumber}
                onChangeText={text => setFormData({ ...formData, unitNumber: text })}
                placeholder="T-101"
                placeholderTextColor={Colors.textSecondary}
              />

              <Text style={styles.label}>VIN</Text>
              <TextInput
                style={styles.input}
                value={formData.vin}
                onChangeText={text => setFormData({ ...formData, vin: text })}
                placeholder="1HGBH41JXMN109186"
                placeholderTextColor={Colors.textSecondary}
                autoCapitalize="characters"
              />

              <Text style={styles.label}>License Plate</Text>
              <TextInput
                style={styles.input}
                value={formData.licensePlate}
                onChangeText={text => setFormData({ ...formData, licensePlate: text })}
                placeholder="ABC-1234"
                placeholderTextColor={Colors.textSecondary}
                autoCapitalize="characters"
              />

              <Text style={styles.label}>Odometer (miles)</Text>
              <TextInput
                style={styles.input}
                value={formData.odometer}
                onChangeText={text => setFormData({ ...formData, odometer: text })}
                placeholder="0"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="numeric"
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
            </View>
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
  truckCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  truckIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 12,
  },
  truckNumber: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.background,
  },
  truckInfo: {
    flex: 1,
  },
  truckUnit: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  truckMeta: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  odometerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: Colors.success,
  },
  statusInactive: {
    backgroundColor: Colors.textSecondary,
  },
  statusText: {
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
});
