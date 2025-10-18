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
import { useTheme } from '@/contexts/ThemeContext';
import { Plus, Search, MapPin, Clock, Phone, X, Edit2, Trash2 } from 'lucide-react-native';
import type { DumpSite } from '@/types';

export default function DumpSitesScreen() {
  const { dumpSites, addDumpSite, updateDumpSite, deleteDumpSite } = useData();
  const { theme } = useTheme();
  const colors = theme?.colors || {};
  
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contactName: '',
    contactPhone: '',
    hours: '',
    acceptedMaterials: '',
  });

  const filteredSites = dumpSites.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddSite = () => {
    setEditingId(null);
    setFormData({
      name: '',
      address: '',
      contactName: '',
      contactPhone: '',
      hours: '',
      acceptedMaterials: '',
    });
    setModalVisible(true);
  };

  const handleEditSite = (site: DumpSite) => {
    setEditingId(site.id);
    setFormData({
      name: site.name,
      address: site.address,
      contactName: site.contactName || '',
      contactPhone: site.contactPhone || '',
      hours: site.hours || '',
      acceptedMaterials: site.acceptedMaterials.join(', '),
    });
    setModalVisible(true);
  };

  const handleDeleteSite = (site: DumpSite) => {
    Alert.alert(
      'Delete Dump Site',
      `Are you sure you want to delete "${site.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteDumpSite(site.id);
            Alert.alert('Success', 'Dump site deleted successfully');
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!formData.name || !formData.address) {
      Alert.alert('Error', 'Please fill in name and address');
      return;
    }

    const materials = formData.acceptedMaterials
      .split(',')
      .map(m => m.trim())
      .filter(m => m.length > 0);

    if (editingId) {
      await updateDumpSite(editingId, {
        name: formData.name,
        address: formData.address,
        contactName: formData.contactName || undefined,
        contactPhone: formData.contactPhone || undefined,
        hours: formData.hours || undefined,
        acceptedMaterials: materials,
      });
      setModalVisible(false);
      Alert.alert('Success', 'Dump site updated successfully');
    } else {
      const newSite: DumpSite = {
        id: `site-${Date.now()}`,
        name: formData.name,
        address: formData.address,
        contactName: formData.contactName || undefined,
        contactPhone: formData.contactPhone || undefined,
        hours: formData.hours || undefined,
        acceptedMaterials: materials,
        active: true,
        createdAt: new Date().toISOString(),
      };

      await addDumpSite(newSite);
      setModalVisible(false);
      Alert.alert('Success', 'Dump site added successfully');
    }
  };

  const Colors = colors;

  const renderSite = ({ item }: { item: DumpSite }) => (
    <View style={styles.siteCard}>
      <View style={styles.siteHeader}>
        <View style={styles.siteIcon}>
          <MapPin size={24} color={Colors.background} />
        </View>
        <View style={styles.siteInfo}>
          <Text style={styles.siteName}>{item.name}</Text>
          <View style={styles.siteMeta}>
            <MapPin size={14} color={Colors.textSecondary} />
            <Text style={styles.siteMetaText}>{item.address}</Text>
          </View>
          {item.hours && (
            <View style={styles.siteMeta}>
              <Clock size={14} color={Colors.textSecondary} />
              <Text style={styles.siteMetaText}>{item.hours}</Text>
            </View>
          )}
          {item.contactPhone && (
            <View style={styles.siteMeta}>
              <Phone size={14} color={Colors.textSecondary} />
              <Text style={styles.siteMetaText}>{item.contactPhone}</Text>
            </View>
          )}
          {item.acceptedMaterials.length > 0 && (
            <View style={styles.materialsContainer}>
              {item.acceptedMaterials.map((material, idx) => (
                <View key={idx} style={styles.materialBadge}>
                  <Text style={styles.materialText}>{material}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditSite(item)}
        >
          <Edit2 size={18} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteSite(item)}
        >
          <Trash2 size={18} color={Colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search dump sites..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddSite}>
          <Plus size={24} color={Colors.background} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredSites}
        renderItem={renderSite}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No dump sites found</Text>
            <Text style={styles.emptySubtext}>Tap + to add your first dump site</Text>
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
              <Text style={styles.modalTitle}>{editingId ? 'Edit Dump Site' : 'Add Dump Site'}</Text>
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
                placeholder="City Landfill"
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

              <Text style={styles.label}>Contact Name</Text>
              <TextInput
                style={styles.input}
                value={formData.contactName}
                onChangeText={text => setFormData({ ...formData, contactName: text })}
                placeholder="John Doe"
                placeholderTextColor={Colors.textSecondary}
              />

              <Text style={styles.label}>Contact Phone</Text>
              <TextInput
                style={styles.input}
                value={formData.contactPhone}
                onChangeText={text => setFormData({ ...formData, contactPhone: text })}
                placeholder="555-0100"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Hours</Text>
              <TextInput
                style={styles.input}
                value={formData.hours}
                onChangeText={text => setFormData({ ...formData, hours: text })}
                placeholder="Mon-Fri 7am-5pm"
                placeholderTextColor={Colors.textSecondary}
              />

              <Text style={styles.label}>Accepted Materials (comma separated)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.acceptedMaterials}
                onChangeText={text => setFormData({ ...formData, acceptedMaterials: text })}
                placeholder="Concrete, Asphalt, Dirt, Debris"
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
  siteCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  siteHeader: {
    flexDirection: 'row' as const,
  },
  siteIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 12,
  },
  siteInfo: {
    flex: 1,
  },
  siteName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  siteMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  siteMetaText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 6,
    flex: 1,
  },
  materialsContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    marginTop: 8,
    gap: 6,
  },
  materialBadge: {
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  materialText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500' as const,
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
  actions: {
    flexDirection: 'row' as const,
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  editButton: {
    backgroundColor: Colors.backgroundSecondary,
  },
  deleteButton: {
    backgroundColor: Colors.backgroundSecondary,
  },
});
