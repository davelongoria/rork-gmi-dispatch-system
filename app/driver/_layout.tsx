import { Stack } from 'expo-router';
import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export default function DriverLayout() {
  const { theme } = useTheme();
  const colors = theme.colors;

  const renderHeader = () => {
    const HeaderWithLogo = () => (
      <View style={styles.headerContainer}>
        <Image
          source={{ uri: theme.logo }}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    );
    HeaderWithLogo.displayName = 'HeaderWithLogo';
    return HeaderWithLogo;
  };

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.background,
        headerTitleStyle: {
          fontWeight: '600' as const,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Driver Dashboard',
          headerShown: true,
          headerTitle: renderHeader(),
        }}
      />
      <Stack.Screen
        name="dvir"
        options={{
          title: 'Vehicle Inspection',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="fuel"
        options={{
          title: 'Fuel Log',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="dump-ticket"
        options={{
          title: 'Dump Ticket',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="commercial-route"
        options={{
          title: 'Commercial Route',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="messages"
        options={{
          title: 'Messages',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="route-details"
        options={{
          title: 'Route Details',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="navigate"
        options={{
          title: 'Navigate',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="residential-route"
        options={{
          title: 'Residential Route',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="container-route"
        options={{
          title: 'Container Route',
          headerShown: true,
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  logo: {
    width: 120,
    height: 36,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
});
