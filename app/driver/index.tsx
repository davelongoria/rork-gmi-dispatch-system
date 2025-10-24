import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Clock,
  FileCheck,
  Fuel,
  FileText,
  LogOut,
  Play,
  Square,
  ArrowRight,
  MessageCircle,
  X,
} from 'lucide-react-native';
import * as Location from 'expo-location';
import type { TimeLog } from '@/types';

export default function DriverDashboard() {
  const { user, logout } = useAuth();
  const { timeLogs, routes, commercialRoutes, residentialRoutes, containerRoutes, addTimeLog, dvirs, fuelLogs, dumpTickets, jobs, addMileageLog, trucks } = useData();
  const { theme } = useTheme();
  const colors = theme.colors;
  const router = useRouter();
  const [isClockedIn, setIsClockedIn] = useState<boolean>(false);
  const [isOnLunch, setIsOnLunch] = useState<boolean>(false);
  const [currentShiftStart, setCurrentShiftStart] = useState<string | null>(null);
  const [showOdometerModal, setShowOdometerModal] = useState<boolean>(false);
  const [odometerReading, setOdometerReading] = useState<string>('');
  const [odometerAction, setOdometerAction] = useState<'clock-in' | 'clock-out' | null>(null);

  useEffect(() => {
    const userTimeLogs = timeLogs.filter(log => log.driverId === user?.id);
    const lastLog = userTimeLogs[userTimeLogs.length - 1];

    if (lastLog) {
      if (lastLog.type === 'CLOCK_IN') {
        setIsClockedIn(true);
        setCurrentShiftStart(lastLog.timestamp);
      } else if (lastLog.type === 'LUNCH_START') {
        setIsClockedIn(true);
        setIsOnLunch(true);
      } else if (lastLog.type === 'LUNCH_END') {
        setIsClockedIn(true);
        setIsOnLunch(false);
      } else if (lastLog.type === 'CLOCK_OUT') {
        setIsClockedIn(false);
        setIsOnLunch(false);
        setCurrentShiftStart(null);
      }
    }
  }, [timeLogs, user?.id]);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return { latitude: undefined, longitude: undefined };
      }
      const location = await Location.getCurrentPositionAsync({});
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Failed to get location:', error);
      return { latitude: undefined, longitude: undefined };
    }
  };

  const handleClockIn = async () => {
    setOdometerReading('');
    setOdometerAction('clock-in');
    setShowOdometerModal(true);
  };

  const handleClockOut = async () => {
    const today = new Date().toISOString().split('T')[0];
    const todayDVIRs = dvirs.filter(d => {
      return new Date(d.timestamp).toISOString().split('T')[0] === today && d.driverId === user?.id;
    });
    const hasPostTrip = todayDVIRs.some(d => d.type === 'POST_TRIP');

    const todayRoutes = routes.filter(r => {
      return r.date === today && r.driverId === user?.id;
    });

    
    const routesWithIncompleteJobs = todayRoutes.filter(r => {
      const routeJobs = r.jobIds
        .map(jId => jobs.find(j => j.id === jId))
        .filter(j => j !== undefined);
      return routeJobs.some(j => 
        j.status !== 'COMPLETED' && 
        !(j.status === 'SUSPENDED' && !j.willCompleteToday)
      );
    });
    
    if (routesWithIncompleteJobs.length > 0) {
      Alert.alert(
        'Incomplete Routes',
        `You have ${routesWithIncompleteJobs.length} route(s) with incomplete jobs. Please complete all routes before clocking out.`,
        [{ text: 'OK' }]
      );
      return;
    }

    if (!hasPostTrip) {
      Alert.alert(
        'Post-Trip Required',
        'You must complete a post-trip inspection before clocking out.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Do Inspection',
            onPress: () => router.push('/driver/dvir' as any),
          },
        ]
      );
      return;
    }

    Alert.alert(
      'Clock Out',
      'Are you sure you want to clock out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clock Out',
          onPress: async () => {
            setOdometerReading('');
            setOdometerAction('clock-out');
            setShowOdometerModal(true);
          },
        },
      ]
    );
  };

  const handleLunchStart = async () => {
    const location = await getLocation();
    const timeLog: TimeLog = {
      id: `timelog-${Date.now()}`,
      driverId: user?.id || '',
      driverName: user?.name,
      type: 'LUNCH_START',
      timestamp: new Date().toISOString(),
      latitude: location.latitude,
      longitude: location.longitude,
      createdAt: new Date().toISOString(),
    };
    await addTimeLog(timeLog);
    setIsOnLunch(true);
    Alert.alert('Success', 'Lunch break started');
  };

  const handleLunchEnd = async () => {
    const location = await getLocation();
    const timeLog: TimeLog = {
      id: `timelog-${Date.now()}`,
      driverId: user?.id || '',
      driverName: user?.name,
      type: 'LUNCH_END',
      timestamp: new Date().toISOString(),
      latitude: location.latitude,
      longitude: location.longitude,
      createdAt: new Date().toISOString(),
    };
    await addTimeLog(timeLog);
    setIsOnLunch(false);
    Alert.alert('Success', 'Lunch break ended');
  };

  const handleLogout = async () => {
    if (isClockedIn) {
      Alert.alert('Warning', 'Please clock out before logging out');
      return;
    }
    await logout();
    router.replace('/' as any);
  };

  const todayRoutes = routes.filter(r => {
    const today = new Date().toISOString().split('T')[0];
    return r.date === today && r.driverId === user?.id;
  });

  const todayCommercialRoutes = commercialRoutes.filter(r => {
    const today = new Date().toISOString().split('T')[0];
    return r.date === today && r.driverId === user?.id;
  });

  const todayResidentialRoutes = residentialRoutes.filter(r => {
    const today = new Date().toISOString().split('T')[0];
    return r.date === today && r.driverId === user?.id;
  });

  const todayContainerRoutes = containerRoutes.filter(r => {
    const today = new Date().toISOString().split('T')[0];
    return r.date === today && r.driverId === user?.id;
  });

  const activeRoutes = todayRoutes.filter(r => r.status !== 'COMPLETED');
  const completedRoutes = todayRoutes.filter(r => r.status === 'COMPLETED');
  const activeCommercialRoutes = todayCommercialRoutes.filter(r => r.status !== 'COMPLETED');
  const completedCommercialRoutes = todayCommercialRoutes.filter(r => r.status === 'COMPLETED');
  const activeResidentialRoutes = todayResidentialRoutes.filter(r => r.status !== 'COMPLETED');
  const completedResidentialRoutes = todayResidentialRoutes.filter(r => r.status === 'COMPLETED');
  const activeContainerRoutes = todayContainerRoutes.filter(r => r.status !== 'COMPLETED');
  const completedContainerRoutes = todayContainerRoutes.filter(r => r.status === 'COMPLETED');

  const todayDVIRs = dvirs.filter(d => {
    const today = new Date().toISOString().split('T')[0];
    return new Date(d.timestamp).toISOString().split('T')[0] === today && d.driverId === user?.id;
  });

  const getShiftDuration = () => {
    if (!currentShiftStart) return '0h 0m';
    const start = new Date(currentShiftStart);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello</Text>
            <Text style={styles.userName}>{user?.name}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <LogOut size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.statusCard, isClockedIn ? styles.statusCardActive : styles.statusCardInactive]}>
          <View style={styles.statusHeader}>
            <Clock size={24} color={colors.background} />
            <Text style={styles.statusTitle}>
              {isClockedIn ? (isOnLunch ? 'On Lunch Break' : 'Clocked In') : 'Not Clocked In'}
            </Text>
          </View>
          {isClockedIn && currentShiftStart && (
            <Text style={styles.statusTime}>Shift Duration: {getShiftDuration()}</Text>
          )}
          <View style={styles.statusButtons}>
            {!isClockedIn ? (
              <TouchableOpacity style={styles.clockButton} onPress={handleClockIn}>
                <Play size={20} color={colors.background} />
                <Text style={styles.clockButtonText}>Clock In</Text>
              </TouchableOpacity>
            ) : (
              <>
                {!isOnLunch ? (
                  <>
                    <TouchableOpacity style={styles.lunchButton} onPress={handleLunchStart}>
                      <Text style={styles.lunchButtonText}>Start Lunch</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.clockOutButton} onPress={handleClockOut}>
                      <Square size={20} color={colors.background} />
                      <Text style={styles.clockButtonText}>Clock Out</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity style={styles.clockButton} onPress={handleLunchEnd}>
                    <Play size={20} color={colors.background} />
                    <Text style={styles.clockButtonText}>End Lunch</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{todayRoutes.length + todayCommercialRoutes.length + todayResidentialRoutes.length + todayContainerRoutes.length}</Text>
            <Text style={styles.statLabel}>Routes Today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{todayDVIRs.length}</Text>
            <Text style={styles.statLabel}>Inspections</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{fuelLogs.filter(f => f.driverId === user?.id).length}</Text>
            <Text style={styles.statLabel}>Fuel Logs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{dumpTickets.filter(d => d.driverId === user?.id).length}</Text>
            <Text style={styles.statLabel}>Dump Tickets</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/driver/dvir' as any)}
        >
          <View style={styles.actionIcon}>
            <FileCheck size={24} color={colors.primary} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Vehicle Inspection (DVIR)</Text>
            <Text style={styles.actionSubtitle}>Pre-trip or post-trip inspection</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, !isClockedIn && styles.actionButtonDisabled]}
          onPress={() => router.push('/driver/fuel' as any)}
          disabled={!isClockedIn}
        >
          <View style={styles.actionIcon}>
            <Fuel size={24} color={colors.primary} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Log Fuel</Text>
            <Text style={styles.actionSubtitle}>Record fuel purchase and receipt</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, !isClockedIn && styles.actionButtonDisabled]}
          onPress={() => router.push('/driver/dump-ticket' as any)}
          disabled={!isClockedIn}
        >
          <View style={styles.actionIcon}>
            <FileText size={24} color={colors.primary} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Dump Ticket</Text>
            <Text style={styles.actionSubtitle}>Capture dump ticket and weights</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/driver/messages' as any)}
        >
          <View style={styles.actionIcon}>
            <MessageCircle size={24} color={colors.primary} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Message Dispatcher</Text>
            <Text style={styles.actionSubtitle}>Send messages to dispatcher</Text>
          </View>
        </TouchableOpacity>

        {activeRoutes.length > 0 && (
          <View style={styles.routesSection}>
            <Text style={styles.sectionTitle}>Active Routes</Text>
            {activeRoutes.map(route => {
              const hasPreTrip = todayDVIRs.some(d => d.type === 'PRE_TRIP');
              const canStartRoute = isClockedIn && hasPreTrip;
              
              return (
                <TouchableOpacity 
                  key={route.id} 
                  style={[styles.routeCard, !canStartRoute && route.status === 'DISPATCHED' && styles.routeCardDisabled]}
                  onPress={() => {
                    if (!isClockedIn) {
                      Alert.alert('Clock In Required', 'You must clock in before accessing your route.');
                      return;
                    }
                    if (!hasPreTrip && route.status === 'DISPATCHED') {
                      Alert.alert(
                        'Pre-Trip Required',
                        'You must complete a pre-trip inspection before starting your route.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Do Inspection', onPress: () => router.push('/driver/dvir' as any) },
                        ]
                      );
                      return;
                    }
                    router.push(`/driver/route-details?id=${route.id}` as any);
                  }}
                >
                  <View style={styles.routeHeader}>
                    <Text style={styles.routeTitle}>Route #{route.id.slice(-6)}</Text>
                    <View style={[styles.routeBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.routeBadgeText}>{route.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.routeInfo}>{route.jobIds.length} jobs assigned</Text>
                  {!canStartRoute && route.status === 'DISPATCHED' && (
                    <Text style={styles.routeWarning}>
                      {!isClockedIn ? '⚠️ Clock in required' : '⚠️ Pre-trip inspection required'}
                    </Text>
                  )}
                  <View style={styles.routeFooter}>
                    <Text style={styles.routeFooterText}>Tap to view details</Text>
                    <ArrowRight size={16} color={colors.primary} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {activeCommercialRoutes.length > 0 && (
          <View style={styles.routesSection}>
            <Text style={styles.sectionTitle}>Active Commercial Routes</Text>
            {activeCommercialRoutes.map(route => {
              const hasPreTrip = todayDVIRs.some(d => d.type === 'PRE_TRIP');
              const canStartRoute = isClockedIn && hasPreTrip;
              
              return (
                <TouchableOpacity 
                  key={route.id} 
                  style={[styles.routeCard, !canStartRoute && route.status === 'DISPATCHED' && styles.routeCardDisabled]}
                  onPress={() => {
                    if (!isClockedIn) {
                      Alert.alert('Clock In Required', 'You must clock in before accessing your route.');
                      return;
                    }
                    if (!hasPreTrip && route.status === 'DISPATCHED') {
                      Alert.alert(
                        'Pre-Trip Required',
                        'You must complete a pre-trip inspection before starting your route.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Do Inspection', onPress: () => router.push('/driver/dvir' as any) },
                        ]
                      );
                      return;
                    }
                    router.push(`/driver/commercial-route?routeId=${route.id}` as any);
                  }}
                >
                  <View style={styles.routeHeader}>
                    <Text style={styles.routeTitle}>{route.name}</Text>
                    <View style={[styles.routeBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.routeBadgeText}>{route.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.routeInfo}>{route.stopIds.length} stops assigned</Text>
                  {!canStartRoute && route.status === 'DISPATCHED' && (
                    <Text style={styles.routeWarning}>
                      {!isClockedIn ? '⚠️ Clock in required' : '⚠️ Pre-trip inspection required'}
                    </Text>
                  )}
                  <View style={styles.routeFooter}>
                    <Text style={styles.routeFooterText}>Tap to view details</Text>
                    <ArrowRight size={16} color={colors.primary} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {completedRoutes.length > 0 && (
          <View style={styles.routesSection}>
            <Text style={styles.sectionTitle}>Completed Today</Text>
            {completedRoutes.map(route => (
              <TouchableOpacity 
                key={route.id} 
                style={styles.routeCard}
                onPress={() => router.push(`/driver/route-details?id=${route.id}` as any)}
              >
                <View style={styles.routeHeader}>
                  <Text style={styles.routeTitle}>Route #{route.id.slice(-6)}</Text>
                  <View style={[styles.routeBadge, { backgroundColor: colors.success }]}>
                    <Text style={styles.routeBadgeText}>COMPLETED</Text>
                  </View>
                </View>
                <Text style={styles.routeInfo}>{route.jobIds.length} jobs</Text>
                {route.completedAt && (
                  <Text style={styles.routeInfo}>
                    Completed at {new Date(route.completedAt).toLocaleTimeString()}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {completedCommercialRoutes.length > 0 && (
          <View style={styles.routesSection}>
            <Text style={styles.sectionTitle}>Completed Commercial Routes Today</Text>
            {completedCommercialRoutes.map(route => (
              <TouchableOpacity 
                key={route.id} 
                style={styles.routeCard}
                onPress={() => router.push(`/driver/commercial-route?routeId=${route.id}` as any)}
              >
                <View style={styles.routeHeader}>
                  <Text style={styles.routeTitle}>{route.name}</Text>
                  <View style={[styles.routeBadge, { backgroundColor: colors.success }]}>
                    <Text style={styles.routeBadgeText}>COMPLETED</Text>
                  </View>
                </View>
                <Text style={styles.routeInfo}>{route.stopIds.length} stops</Text>
                {route.completedAt && (
                  <Text style={styles.routeInfo}>
                    Completed at {new Date(route.completedAt).toLocaleTimeString()}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeResidentialRoutes.length > 0 && (
          <View style={styles.routesSection}>
            <Text style={styles.sectionTitle}>Active Residential Routes</Text>
            {activeResidentialRoutes.map(route => {
              const hasPreTrip = todayDVIRs.some(d => d.type === 'PRE_TRIP');
              const canStartRoute = isClockedIn && hasPreTrip;
              
              return (
                <TouchableOpacity 
                  key={route.id} 
                  style={[styles.routeCard, !canStartRoute && route.status === 'DISPATCHED' && styles.routeCardDisabled]}
                  onPress={() => {
                    if (!isClockedIn) {
                      Alert.alert('Clock In Required', 'You must clock in before accessing your route.');
                      return;
                    }
                    if (!hasPreTrip && route.status === 'DISPATCHED') {
                      Alert.alert(
                        'Pre-Trip Required',
                        'You must complete a pre-trip inspection before starting your route.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Do Inspection', onPress: () => router.push('/driver/dvir' as any) },
                        ]
                      );
                      return;
                    }
                    router.push(`/driver/residential-route?routeId=${route.id}` as any);
                  }}
                >
                  <View style={styles.routeHeader}>
                    <Text style={styles.routeTitle}>{route.name}</Text>
                    <View style={[styles.routeBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.routeBadgeText}>{route.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.routeInfo}>{route.customerIds.length} stops assigned</Text>
                  {!canStartRoute && route.status === 'DISPATCHED' && (
                    <Text style={styles.routeWarning}>
                      {!isClockedIn ? '⚠️ Clock in required' : '⚠️ Pre-trip inspection required'}
                    </Text>
                  )}
                  <View style={styles.routeFooter}>
                    <Text style={styles.routeFooterText}>Tap to view details</Text>
                    <ArrowRight size={16} color={colors.primary} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {completedResidentialRoutes.length > 0 && (
          <View style={styles.routesSection}>
            <Text style={styles.sectionTitle}>Completed Residential Routes Today</Text>
            {completedResidentialRoutes.map(route => (
              <TouchableOpacity 
                key={route.id} 
                style={styles.routeCard}
                onPress={() => router.push(`/driver/residential-route?routeId=${route.id}` as any)}
              >
                <View style={styles.routeHeader}>
                  <Text style={styles.routeTitle}>{route.name}</Text>
                  <View style={[styles.routeBadge, { backgroundColor: colors.success }]}>
                    <Text style={styles.routeBadgeText}>COMPLETED</Text>
                  </View>
                </View>
                <Text style={styles.routeInfo}>{route.customerIds.length} stops</Text>
                {route.completedAt && (
                  <Text style={styles.routeInfo}>
                    Completed at {new Date(route.completedAt).toLocaleTimeString()}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeContainerRoutes.length > 0 && (
          <View style={styles.routesSection}>
            <Text style={styles.sectionTitle}>Active Container Routes</Text>
            {activeContainerRoutes.map(route => {
              const hasPreTrip = todayDVIRs.some(d => d.type === 'PRE_TRIP');
              const canStartRoute = isClockedIn && hasPreTrip;
              
              return (
                <TouchableOpacity 
                  key={route.id} 
                  style={[styles.routeCard, !canStartRoute && route.status === 'DISPATCHED' && styles.routeCardDisabled]}
                  onPress={() => {
                    if (!isClockedIn) {
                      Alert.alert('Clock In Required', 'You must clock in before accessing your route.');
                      return;
                    }
                    if (!hasPreTrip && route.status === 'DISPATCHED') {
                      Alert.alert(
                        'Pre-Trip Required',
                        'You must complete a pre-trip inspection before starting your route.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Do Inspection', onPress: () => router.push('/driver/dvir' as any) },
                        ]
                      );
                      return;
                    }
                    router.push(`/driver/container-route?routeId=${route.id}` as any);
                  }}
                >
                  <View style={styles.routeHeader}>
                    <Text style={styles.routeTitle}>{route.name}</Text>
                    <View style={[styles.routeBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.routeBadgeText}>{route.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.routeInfo}>{route.jobIds.length} jobs assigned</Text>
                  {!canStartRoute && route.status === 'DISPATCHED' && (
                    <Text style={styles.routeWarning}>
                      {!isClockedIn ? '⚠️ Clock in required' : '⚠️ Pre-trip inspection required'}
                    </Text>
                  )}
                  <View style={styles.routeFooter}>
                    <Text style={styles.routeFooterText}>Tap to view details</Text>
                    <ArrowRight size={16} color={colors.primary} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {completedContainerRoutes.length > 0 && (
          <View style={styles.routesSection}>
            <Text style={styles.sectionTitle}>Completed Container Routes Today</Text>
            {completedContainerRoutes.map(route => (
              <TouchableOpacity 
                key={route.id} 
                style={styles.routeCard}
                onPress={() => router.push(`/driver/container-route?routeId=${route.id}` as any)}
              >
                <View style={styles.routeHeader}>
                  <Text style={styles.routeTitle}>{route.name}</Text>
                  <View style={[styles.routeBadge, { backgroundColor: colors.success }]}>
                    <Text style={styles.routeBadgeText}>COMPLETED</Text>
                  </View>
                </View>
                <Text style={styles.routeInfo}>{route.jobIds.length} jobs</Text>
                {route.completedAt && (
                  <Text style={styles.routeInfo}>
                    Completed at {new Date(route.completedAt).toLocaleTimeString()}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showOdometerModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowOdometerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Odometer Reading</Text>
              <TouchableOpacity onPress={() => setShowOdometerModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <Text style={styles.inputLabel}>Current Odometer Reading</Text>
              <TextInput
                style={styles.input}
                value={odometerReading}
                onChangeText={setOdometerReading}
                placeholder="Enter odometer reading"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                autoFocus
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary]}
                  onPress={() => setShowOdometerModal(false)}
                >
                  <Text style={styles.buttonSecondaryText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary]}
                  onPress={async () => {
                    const odometer = odometerReading ? parseFloat(odometerReading) : undefined;
                    const location = await getLocation();

                    if (odometerAction === 'clock-in') {
                      const timeLog: TimeLog = {
                        id: `timelog-${Date.now()}`,
                        driverId: user?.id || '',
                        driverName: user?.name,
                        type: 'CLOCK_IN',
                        timestamp: new Date().toISOString(),
                        latitude: location.latitude,
                        longitude: location.longitude,
                        createdAt: new Date().toISOString(),
                      };
                      await addTimeLog(timeLog);
                      setIsClockedIn(true);
                      setCurrentShiftStart(timeLog.timestamp);
                      
                      setShowOdometerModal(false);
                      Alert.alert('Success', 'Clocked in successfully');
                    } else if (odometerAction === 'clock-out') {
                      const timeLog: TimeLog = {
                        id: `timelog-${Date.now()}`,
                        driverId: user?.id || '',
                        driverName: user?.name,
                        type: 'CLOCK_OUT',
                        timestamp: new Date().toISOString(),
                        latitude: location.latitude,
                        longitude: location.longitude,
                        createdAt: new Date().toISOString(),
                      };
                      await addTimeLog(timeLog);

                      if (odometer) {
                        const todayRoutes = routes.filter(r => {
                          const today = new Date().toISOString().split('T')[0];
                          return r.date === today && r.driverId === user?.id && r.truckId;
                        });
                        
                        if (todayRoutes.length > 0 && todayRoutes[0].truckId) {
                          const truck = trucks.find(t => t.id === todayRoutes[0].truckId);
                          if (truck) {
                            await addMileageLog({
                              id: `ml_${Date.now()}`,
                              driverId: user?.id || '',
                              driverName: user?.name,
                              truckId: truck.id,
                              truckUnitNumber: truck.unitNumber,
                              timestamp: new Date().toISOString(),
                              odometer,
                              createdAt: new Date().toISOString(),
                            });
                          }
                        }
                      }

                      setIsClockedIn(false);
                      setIsOnLunch(false);
                      setCurrentShiftStart(null);
                      
                      setShowOdometerModal(false);
                      Alert.alert('Success', 'Clocked out successfully');
                    }

                    setOdometerAction(null);
                  }}
                >
                  <Text style={styles.buttonPrimaryText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
  statusCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  statusCardActive: {
    backgroundColor: colors.success,
  },
  statusCardInactive: {
    backgroundColor: colors.textSecondary,
  },
  statusHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
    gap: 12,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.background,
  },
  statusTime: {
    fontSize: 16,
    color: colors.background,
    opacity: 0.9,
    marginBottom: 16,
  },
  statusButtons: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  clockButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  clockOutButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: colors.error,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  lunchButton: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 12,
  },
  clockButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.background,
  },
  lunchButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.background,
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
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center' as const,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row' as const,
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center' as const,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  routesSection: {
    marginTop: 24,
  },
  routeCard: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  routeHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  routeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  routeBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.background,
  },
  routeInfo: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  routeFooter: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.backgroundSecondary,
  },
  routeFooterText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600' as const,
  },
  routeCardDisabled: {
    opacity: 0.6,
  },
  routeWarning: {
    fontSize: 13,
    color: colors.error,
    fontWeight: '600' as const,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end' as const,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.backgroundSecondary,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
  },
  form: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
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
    backgroundColor: colors.backgroundSecondary,
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
});
