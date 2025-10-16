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
import { Plus, Warehouse, MapPin, X, Trash2, Edit } from 'lucide-react-native';
import type { Yard } from '@/types';

export default function YardsScreen() {
  const { yards, addYard, updateYard, deleteYard } = useData();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingYard, setEditingYard] = useState<Yard | null>(null);
  const [name, setName] = useState<string>('');
  const [address, setAddress] = useState<string>('');

  const activeYards = yards.filter(y => y.active);

  const handleCreateYard = () => {
    setEditingYard(null);
    setName('');
    setAddress('');
    setModalVisible(true);
  };

  const handleEditYard = (yard: Yard) => {
    setEditingYard(yard);
    setName(yard.name);
    setAddress(yard.address);
    setModalVisible(true);
  };

  const handleDeleteYard = (yard: Yard) => {
    Alert.alert(
      'Delete Yard',
      `Are you sure you want to delete ${yard.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await updateYard(yard.id, { active: false });
            Alert.alert('Success', 'Yard deleted successfully');
          },
        },
      ]
    );
  };

  const handleSaveYard = async () => {
    if (!name || !address) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (editingYard) {
      await updateYard(editingYard.id, {
        name,
        address,
      });
      Alert.alert('Success', 'Yard updated successfully');
    } else {
      const newYard: Yard = {
        id: `yard-${Date.now()}`,
        name,
        address,
        active: true,
        createdAt: new Date().toISOString(),
      };
      await addYard(newYard);
      Alert.alert('Success', 'Yard created successfully');
    }
    setModalVisible(false);
  };

  const renderYard = ({ item }: { item: Yard }) => (
    <View style={styles.yardCard}>
      <View style={styles.yardHeader}>
        <View style={styles.yardIcon}>
          <Warehouse size={24} color={Colors.primary} />
        </View>
        <View style={styles.yardInfo}>
          <Text style={styles.yardName}>{item.name}</Text>
          <View style={styles.yardMeta}>
            <MapPin size={14} color={Colors.textSecondary} />
            <Text style={styles.yardMetaText} numberOfLines={2}>{item.address}</Text>
          </View>
        </View>
      </View>
      <View style={styles.yardActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleEditYard(item)}>
          <Edit size={18} color={Colors.primary} />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButtonDelete} onPress={() => handleDeleteYard(item)}>
          <Trash2 size={18} color={Colors.error} />
          <Text style={styles.actionButtonTextDelete}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Warehouse size={20} color={Colors.primary} />
          <Text style={styles.headerText}>Drop Yards & Home Base</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleCreateYard}>
          <Plus size={24} color={Colors.background} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeYards}
        renderItem={renderYard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Warehouse size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No yards configured</Text>
            <Text style={styles.emptySubtext}>Tap + to add a drop yard or home base</Text>
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
              <Text style={styles.modalTitle}>{editingYard ? 'Edit Yard' : 'Add Yard'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <Text style={styles.label}>Yard Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g., Main Yard, Drop Yard A, Home Base"
                placeholderTextColor={Colors.textSecondary}
              />

              <Text style={styles.label}>Address *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter full address"
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
                  onPress={handleSaveYard}
                >
                  <Text style={styles.buttonPrimaryText}>{editingYard ? 'Save' : 'Create'}</Text>
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
  yardCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  yardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 12,
  },
  yardIcon: {
    width: 48,
    height: 48,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 12,
  },
  yardInfo: {
    flex: 1,
  },
  yardName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  yardMeta: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 6,
  },
  yardMetaText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
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
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
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
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 80,
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
  yardActions: {
    flexDirection: 'row' as const,
    gap: 8,
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
});
