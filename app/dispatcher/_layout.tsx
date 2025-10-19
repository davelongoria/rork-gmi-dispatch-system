import { Tabs } from 'expo-router';
import React from 'react';
import {
  LayoutDashboard,
  Users,
  Truck,
  Route,
  FileText,
  MapPin,
  Building2,
  Package,
  Warehouse,
  Settings,
  MessageCircle,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

export default function DispatcherLayout() {
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.background,
        headerTitleStyle: {
          fontWeight: '600' as const,
        },
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="drivers"
        options={{
          title: 'Drivers',
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="trucks"
        options={{
          title: 'Trucks',
          tabBarIcon: ({ color, size }) => <Truck size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="routes"
        options={{
          title: 'Routes',
          tabBarIcon: ({ color, size }) => <Route size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color, size }) => <Package size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="dump-sites"
        options={{
          title: 'Dump Sites',
          tabBarIcon: ({ color, size }) => <MapPin size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: 'Customers',
          tabBarIcon: ({ color, size }) => <Building2 size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="yards"
        options={{
          title: 'Yards',
          tabBarIcon: ({ color, size }) => <Warehouse size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color, size}) => <FileText size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sync-data"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="commercial-routes"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="residential-routes"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="container-routes"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
