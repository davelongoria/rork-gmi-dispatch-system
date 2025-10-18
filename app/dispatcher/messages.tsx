import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Platform,
  Linking,
  PanResponder,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { MessageCircle, Send, Phone, X } from 'lucide-react-native';
import type { Message, Driver } from '@/types';

export default function DispatcherMessagesScreen() {
  const { messages, addMessage, drivers } = useData();
  const { user } = useAuth();
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const modalTranslateY = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          modalTranslateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 150) {
          Animated.timing(modalTranslateY, {
            toValue: 800,
            duration: 250,
            useNativeDriver: true,
          }).start(() => {
            setSelectedDriverId(null);
            modalTranslateY.setValue(0);
          });
        } else {
          Animated.spring(modalTranslateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  const activeDrivers = useMemo(() => 
    drivers.filter(d => d.active),
    [drivers]
  );

  const filteredDrivers = useMemo(() => {
    if (!searchQuery.trim()) return activeDrivers;
    const query = searchQuery.toLowerCase();
    return activeDrivers.filter(d =>
      d.name.toLowerCase().includes(query) ||
      d.phone.toLowerCase().includes(query)
    );
  }, [activeDrivers, searchQuery]);

  const conversationsByDriver = useMemo(() => {
    const convos = new Map<string, Message[]>();
    messages.forEach(msg => {
      if (msg.fromUserId === user?.id) {
        if (!convos.has(msg.toUserId)) {
          convos.set(msg.toUserId, []);
        }
        convos.get(msg.toUserId)?.push(msg);
      } else if (msg.toUserId === user?.id) {
        if (!convos.has(msg.fromUserId)) {
          convos.set(msg.fromUserId, []);
        }
        convos.get(msg.fromUserId)?.push(msg);
      }
    });
    return convos;
  }, [messages, user?.id]);

  const unreadCountByDriver = useMemo(() => {
    const counts = new Map<string, number>();
    messages.forEach(msg => {
      if (msg.toUserId === user?.id && !msg.readAt) {
        const count = counts.get(msg.fromUserId) || 0;
        counts.set(msg.fromUserId, count + 1);
      }
    });
    return counts;
  }, [messages, user?.id]);

  const selectedConversation = useMemo(() => {
    if (!selectedDriverId) return [];
    const msgs = conversationsByDriver.get(selectedDriverId) || [];
    return msgs.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [conversationsByDriver, selectedDriverId]);

  const selectedDriver = useMemo(() => 
    drivers.find(d => d.id === selectedDriverId),
    [drivers, selectedDriverId]
  );

  const handleSendMessage = useCallback(async () => {
    if (!messageText.trim() || !selectedDriverId || !user) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      fromUserId: user.id,
      fromUserName: user.name,
      toUserId: selectedDriverId,
      toUserName: selectedDriver?.name,
      body: messageText.trim(),
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    await addMessage(newMessage);
    setMessageText('');
  }, [messageText, selectedDriverId, user, selectedDriver, addMessage]);

  const handleCallDriver = useCallback((phone: string) => {
    const phoneNumber = Platform.select({
      ios: `telprompt:${phone}`,
      default: `tel:${phone}`,
    });
    if (phoneNumber) {
      Linking.openURL(phoneNumber);
    }
  }, []);

  const handleTextDriver = useCallback((phone: string) => {
    Linking.openURL(`sms:${phone}`);
  }, []);

  const renderDriverItem = ({ item }: { item: Driver }) => {
    const unreadCount = unreadCountByDriver.get(item.id) || 0;
    const conversation = conversationsByDriver.get(item.id) || [];
    const lastMessage = conversation[conversation.length - 1];

    return (
      <TouchableOpacity
        style={styles.driverItem}
        onPress={() => setSelectedDriverId(item.id)}
      >
        <View style={styles.driverInfo}>
          <View style={styles.driverNameRow}>
            <Text style={styles.driverName}>{item.name}</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <Text style={styles.driverPhone}>{item.phone}</Text>
          {lastMessage && (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {lastMessage.fromUserId === user?.id ? 'You: ' : ''}
              {lastMessage.body}
            </Text>
          )}
        </View>
        <MessageCircle size={24} color={Colors.primary} />
      </TouchableOpacity>
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = item.fromUserId === user?.id;
    return (
      <View style={[styles.messageContainer, isMine ? styles.myMessage : styles.theirMessage]}>
        <View style={[styles.messageBubble, isMine ? styles.myBubble : styles.theirBubble]}>
          <Text style={[styles.messageText, isMine ? styles.myMessageText : styles.theirMessageText]}>
            {item.body}
          </Text>
          <Text style={[styles.messageTime, isMine ? styles.myMessageTime : styles.theirMessageTime]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search drivers..."
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredDrivers}
        renderItem={renderDriverItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MessageCircle size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No drivers found</Text>
          </View>
        }
      />

      <Modal
        visible={!!selectedDriverId}
        animationType="slide"
        onRequestClose={() => setSelectedDriverId(null)}
      >
        <Animated.View 
          style={[
            styles.modalWrapper, 
            { transform: [{ translateY: modalTranslateY }] }
          ]}
        >
          <SafeAreaView style={styles.modalContainer} edges={['bottom']}>
            <View style={styles.modalHeader} {...panResponder.panHandlers}>
              <View style={styles.dragIndicatorContainer}>
                <View style={styles.dragIndicator} />
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedDriverId(null)}
              >
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            <View style={styles.modalHeaderInfo}>
              <Text style={styles.modalTitle}>{selectedDriver?.name}</Text>
              <Text style={styles.modalPhone}>{selectedDriver?.phone}</Text>
            </View>
            {selectedDriver && (
              <View style={styles.communicationButtons}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleCallDriver(selectedDriver.phone)}
                >
                  <Phone size={20} color={Colors.background} />
                  <Text style={styles.actionButtonText}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleTextDriver(selectedDriver.phone)}
                >
                  <MessageCircle size={20} color={Colors.background} />
                  <Text style={styles.actionButtonText}>SMS</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <FlatList
            data={selectedConversation}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesContent}
            inverted={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MessageCircle size={48} color={Colors.textSecondary} />
                <Text style={styles.emptyText}>No messages yet</Text>
              </View>
            }
          />

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.messageInput}
              placeholder="Type a message..."
              placeholderTextColor={Colors.textSecondary}
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={!messageText.trim()}
            >
              <Send size={20} color={Colors.background} />
            </TouchableOpacity>
          </View>
          </SafeAreaView>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: Colors.background,
  },
  searchInput: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  listContent: {
    padding: 16,
  },
  driverItem: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  driverInfo: {
    flex: 1,
    marginRight: 12,
  },
  driverNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  driverPhone: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  badge: {
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: Colors.background,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  modalWrapper: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dragIndicatorContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  closeButton: {
    marginBottom: 12,
  },
  modalHeaderInfo: {
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.background,
  },
  modalPhone: {
    fontSize: 14,
    color: Colors.background,
    opacity: 0.8,
    marginTop: 4,
  },
  communicationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
  },
  theirMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
  },
  myBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: Colors.card,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
  },
  myMessageText: {
    color: Colors.background,
  },
  theirMessageText: {
    color: Colors.text,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  myMessageTime: {
    color: Colors.background,
    opacity: 0.7,
    textAlign: 'right',
  },
  theirMessageTime: {
    color: Colors.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: 'flex-end',
    gap: 12,
  },
  messageInput: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
