import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Platform,
  Linking,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { MessageCircle, Send, Phone } from 'lucide-react-native';
import type { Message } from '@/types';

export default function DriverMessagesScreen() {
  const { messages, addMessage } = useData();
  const { user } = useAuth();
  const [messageText, setMessageText] = useState<string>('');
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  const dispatcherId = 'disp-1';
  const dispatcherName = 'John Dispatcher';
  const dispatcherPhone = '555-0100';

  const conversation = useMemo(() => {
    const msgs = messages.filter(
      msg =>
        (msg.fromUserId === user?.id && msg.toUserId === dispatcherId) ||
        (msg.fromUserId === dispatcherId && msg.toUserId === user?.id)
    );
    return msgs.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [messages, user?.id, dispatcherId]);

  useEffect(() => {
    if (conversation.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [conversation.length]);

  const handleSendMessage = useCallback(async () => {
    if (!messageText.trim() || !user) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      fromUserId: user.id,
      fromUserName: user.name,
      toUserId: dispatcherId,
      toUserName: dispatcherName,
      body: messageText.trim(),
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    await addMessage(newMessage);
    setMessageText('');
  }, [messageText, user, dispatcherId, dispatcherName, addMessage]);

  const handleCallDispatcher = useCallback(() => {
    const phoneNumber = Platform.select({
      ios: `telprompt:${dispatcherPhone}`,
      default: `tel:${dispatcherPhone}`,
    });
    if (phoneNumber) {
      Linking.openURL(phoneNumber);
    }
  }, [dispatcherPhone]);

  const handleTextDispatcher = useCallback(() => {
    Linking.openURL(`sms:${dispatcherPhone}`);
  }, [dispatcherPhone]);

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
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <Stack.Screen
        options={{
          title: 'Message Dispatcher',
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleCallDispatcher}
              >
                <Phone size={20} color={Colors.background} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleTextDispatcher}
              >
                <MessageCircle size={20} color={Colors.background} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <FlatList
        ref={flatListRef}
        data={conversation}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MessageCircle size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Send a message to the dispatcher</Text>
          </View>
        }
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
    marginRight: 8,
  },
  headerButton: {
    padding: 8,
  },
  messagesContent: {
    padding: 16,
    flexGrow: 1,
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
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
