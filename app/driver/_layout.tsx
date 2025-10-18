import { Stack } from 'expo-router';
import React from 'react';
import Colors from '@/constants/colors';

export default function DriverLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.primary,
        },
        headerTintColor: Colors.background,
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
    </Stack>
  );
}
