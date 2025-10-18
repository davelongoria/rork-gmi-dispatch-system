import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Users,
  Truck,
  Route,
  CheckCircle,
  Clock,
  AlertTriangle,
  LogOut,
  MapPin,
  Building2,
} from 'lucide-react-native';

export default function DispatcherDashboard() {
  const { user, logout } = useAuth();
  const { drivers, trucks, routes, jobs } = useData();
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState<boolean>(false);

  const activeDrivers = drivers.filter(d => d.active).length;
  const activeTrucks = trucks.filter(t => t.active).length;
  const todayRoutes = routes.filter(r => {
    const today = new Date().toISOString().split('T')[0];
    return r.date === today;
  });
  const completedToday = todayRoutes.filter(r => r.status === 'COMPLETED').length;
  const inProgressToday = todayRoutes.filter(r => r.status === 'IN_PROGRESS').length;
  const pendingJobs = jobs.filter(j => j.status === 'PLANNED' || j.status === 'ASSIGNED').length;

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace('/' as any);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.userName}>{user?.name}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <LogOut size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.statCardPrimary]}>
            <View style={styles.statIconContainer}>
              <Users size={28} color={colors.background} />
            </View>
            <Text style={styles.statValue}>{activeDrivers}</Text>
            <Text style={styles.statLabel}>Active Drivers</Text>
          </View>

          <View style={[styles.statCard, styles.statCardSecondary]}>
            <View style={styles.statIconContainer}>
              <Truck size={28} color={colors.background} />
            </View>
            <Text style={styles.statValue}>{activeTrucks}</Text>
            <Text style={styles.statLabel}>Active Trucks</Text>
          </View>

          <View style={[styles.statCard, styles.statCardSuccess]}>
            <View style={styles.statIconContainer}>
              <Route size={28} color={colors.background} />
            </View>
            <Text style={styles.statValue}>{todayRoutes.length}</Text>
            <Text style={styles.statLabel}>Today's Routes</Text>
          </View>

          <View style={[styles.statCard, styles.statCardWarning]}>
            <View style={styles.statIconContainer}>
              <AlertTriangle size={28} color={colors.background} />
            </View>
            <Text style={styles.statValue}>{pendingJobs}</Text>
            <Text style={styles.statLabel}>Pending Jobs</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today&apos;s Activity</Text>
          
          <View style={styles.activityCard}>
            <View style={styles.activityRow}>
              <View style={styles.activityIcon}>
                <CheckCircle size={20} color={colors.success} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityLabel}>Completed Routes</Text>
                <Text style={styles.activityValue}>{completedToday} routes</Text>
              </View>
            </View>

            <View style={styles.activityRow}>
              <View style={styles.activityIcon}>
                <Clock size={20} color={colors.accent} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityLabel}>In Progress</Text>
                <Text style={styles.activityValue}>{inProgressToday} routes</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/dispatcher/routes' as any)}
          >
            <Route size={24} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Create New Route</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/dispatcher/drivers' as any)}
          >
            <Users size={24} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Manage Drivers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/dispatcher/trucks' as any)}
          >
            <Truck size={24} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Manage Trucks</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/dispatcher/dump-sites' as any)}
          >
            <MapPin size={24} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Manage Dump Sites</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/dispatcher/customers' as any)}
          >
            <Building2 size={24} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Manage Customers</Text>
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
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  statsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    marginHorizontal: -6,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    margin: '1%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center' as const,
  },
  statCardPrimary: {
    backgroundColor: colors.primary,
  },
  statCardSecondary: {
    backgroundColor: colors.secondary,
  },
  statCardSuccess: {
    backgroundColor: colors.success,
  },
  statCardWarning: {
    backgroundColor: colors.accent,
  },
  statIconContainer: {
    marginBottom: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: colors.background,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: colors.background,
    opacity: 0.9,
    textAlign: 'center' as const,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 12,
  },
  activityCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
  },
  activityRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  activityValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  actionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginLeft: 12,
  },
});
