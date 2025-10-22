import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MailComposer from 'expo-mail-composer';
import { useData } from '@/contexts/DataContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  FileText,
  Download,
  Fuel,
  Truck,
  FileCheck,
  Clock,
  Mail,
  Eye,
  Edit2,
  Trash2,
  X,
  Gauge,
  Calendar,
} from 'lucide-react-native';
import type { Report } from '@/types';

export default function ReportsScreen() {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);
  const {
    fuelLogs,
    dumpTickets,
    dvirs,
    timeLogs,
    mileageLogs,
    drivers,
    trucks,
    reports,
    addReport,
    updateReport,
    deleteReport,
    dispatcherSettings,
    jobs,
    routes,
    dumpSites,
    commercialRoutes,
    commercialStops,
    residentialRoutes,
    residentialStops,
    containerRoutes,
  } = useData();

  const [generating, setGenerating] = useState<string | null>(null);
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [previewDriverId, setPreviewDriverId] = useState<string | null>(null);
  const [previewDate, setPreviewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [previewModalVisible, setPreviewModalVisible] = useState<boolean>(false);
  const [previewType, setPreviewType] = useState<'DRIVER_DAY' | 'COMMERCIAL' | 'RESIDENTIAL' | 'CONTAINER' | null>(null);
  const [previewRouteId, setPreviewRouteId] = useState<string | null>(null);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const generateCSV = (headers: string[], rows: string[][]): string => {
    const csvRows = [
      headers.join(','),
      ...rows.map(row =>
        row.map(cell => {
          const cellStr = String(cell);
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(',')
      ),
    ];
    return csvRows.join('\n');
  };

  const filterByDateRange = <T extends { date?: string; timestamp?: string }>(
    items: T[],
    start: string,
    end: string
  ): T[] => {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime() + 86400000;
    
    return items.filter(item => {
      const dateStr = item.date || item.timestamp;
      if (!dateStr) return false;
      const itemTime = new Date(dateStr).getTime();
      return itemTime >= startTime && itemTime < endTime;
    });
  };

  const generateFuelReport = async () => {
    setGenerating('fuel');
    try {
      const filtered = filterByDateRange(fuelLogs, startDate, endDate);
      const headers = [
        'Date',
        'Driver',
        'Truck',
        'Odometer',
        'Gallons',
        'Price/Gal',
        'Total Cost',
        'Station',
        'State',
      ];
      const rows = filtered.map(log => [
        log.date,
        log.driverName || 'Unknown',
        log.truckUnitNumber || 'Unknown',
        String(log.odometer),
        String(log.gallons),
        log.pricePerGallon.toFixed(2),
        log.totalCost.toFixed(2),
        log.stationName || 'N/A',
        log.state || 'N/A',
      ]);

      const csvData = generateCSV(headers, rows);

      const report: Report = {
        id: `report-${Date.now()}`,
        name: `Fuel & Mileage Report (${startDate} to ${endDate})`,
        type: 'FUEL',
        startDate,
        endDate,
        description: `Fuel logs from ${filtered.length} entries`,
        csvData,
        entriesCount: filtered.length,
        generatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      await addReport(report);
      Alert.alert('Success', `Report generated with ${filtered.length} entries`);
    } catch (error) {
      console.error('Failed to generate fuel report:', error);
      Alert.alert('Error', 'Failed to generate report');
    } finally {
      setGenerating(null);
    }
  };

  const generateDumpTicketReport = async () => {
    setGenerating('dump');
    try {
      const filtered = filterByDateRange(dumpTickets, startDate, endDate);
      const headers = [
        'Date',
        'Driver',
        'Truck',
        'Dump Site',
        'Ticket #',
        'Gross Weight',
        'Tare Weight',
        'Net Weight',
        'Fee',
      ];
      const rows = filtered.map(ticket => [
        ticket.date,
        ticket.driverName || 'Unknown',
        ticket.truckUnitNumber || 'Unknown',
        ticket.dumpSiteName || 'Unknown',
        ticket.ticketNumber || 'N/A',
        String(ticket.grossWeight || 0),
        String(ticket.tareWeight || 0),
        String(ticket.netWeight || 0),
        String(ticket.fee || 0),
      ]);

      const csvData = generateCSV(headers, rows);

      const report: Report = {
        id: `report-${Date.now()}`,
        name: `Dump Ticket Report (${startDate} to ${endDate})`,
        type: 'DUMP_TICKET',
        startDate,
        endDate,
        description: `Dump tickets from ${filtered.length} entries`,
        csvData,
        entriesCount: filtered.length,
        generatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      await addReport(report);
      Alert.alert('Success', `Report generated with ${filtered.length} entries`);
    } catch (error) {
      console.error('Failed to generate dump ticket report:', error);
      Alert.alert('Error', 'Failed to generate report');
    } finally {
      setGenerating(null);
    }
  };

  const generateDVIRReport = async () => {
    setGenerating('dvir');
    try {
      const filtered = filterByDateRange(dvirs, startDate, endDate);
      const headers = [
        'Date',
        'Truck',
        'Driver',
        'Type',
        'Safe to Operate',
        'Defects Count',
        'Odometer',
        'State',
        'Notes',
      ];
      const rows = filtered.map(dvir => [
        new Date(dvir.timestamp).toLocaleDateString(),
        dvir.truckUnitNumber || 'Unknown',
        dvir.driverName || 'Unknown',
        dvir.type,
        dvir.safeToOperate ? 'Yes' : 'No',
        String(dvir.defects.length),
        String(dvir.odometer || 'N/A'),
        dvir.state || 'N/A',
        (dvir.notes || '').replace(/,/g, ';'),
      ]);

      const csvData = generateCSV(headers, rows);

      const report: Report = {
        id: `report-${Date.now()}`,
        name: `DVIR Report (${startDate} to ${endDate})`,
        type: 'DVIR',
        startDate,
        endDate,
        description: `Vehicle inspections from ${filtered.length} entries`,
        csvData,
        entriesCount: filtered.length,
        generatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      await addReport(report);
      Alert.alert('Success', `Report generated with ${filtered.length} entries`);
    } catch (error) {
      console.error('Failed to generate DVIR report:', error);
      Alert.alert('Error', 'Failed to generate report');
    } finally {
      setGenerating(null);
    }
  };

  const generateTimeReport = async () => {
    setGenerating('time');
    try {
      const filtered = filterByDateRange(timeLogs, startDate, endDate);
      const headers = ['Date', 'Driver', 'Type', 'Time', 'Location'];
      const rows = filtered.map(log => [
        new Date(log.timestamp).toLocaleDateString(),
        log.driverName || 'Unknown',
        log.type,
        new Date(log.timestamp).toLocaleTimeString(),
        log.latitude && log.longitude
          ? `${log.latitude.toFixed(6)}, ${log.longitude.toFixed(6)}`
          : 'N/A',
      ]);

      const csvData = generateCSV(headers, rows);

      const report: Report = {
        id: `report-${Date.now()}`,
        name: `Time & Attendance Report (${startDate} to ${endDate})`,
        type: 'TIME',
        startDate,
        endDate,
        description: `Time logs from ${filtered.length} entries`,
        csvData,
        entriesCount: filtered.length,
        generatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      await addReport(report);
      Alert.alert('Success', `Report generated with ${filtered.length} entries`);
    } catch (error) {
      console.error('Failed to generate time report:', error);
      Alert.alert('Error', 'Failed to generate report');
    } finally {
      setGenerating(null);
    }
  };

  const generateMileageReport = async () => {
    setGenerating('mileage');
    try {
      const filtered = filterByDateRange(mileageLogs, startDate, endDate);
      const headers = ['Date', 'Driver', 'Truck', 'Odometer', 'State', 'Location'];
      const rows = filtered.map(log => [
        new Date(log.timestamp).toLocaleDateString(),
        log.driverName || 'Unknown',
        log.truckUnitNumber || 'Unknown',
        String(log.odometer),
        log.state || 'N/A',
        log.latitude && log.longitude
          ? `${log.latitude.toFixed(6)}, ${log.longitude.toFixed(6)}`
          : 'N/A',
      ]);

      const csvData = generateCSV(headers, rows);

      const report: Report = {
        id: `report-${Date.now()}`,
        name: `Mileage Log Report (${startDate} to ${endDate})`,
        type: 'MILEAGE',
        startDate,
        endDate,
        description: `Mileage logs from ${filtered.length} entries`,
        csvData,
        entriesCount: filtered.length,
        generatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      await addReport(report);
      Alert.alert('Success', `Report generated with ${filtered.length} entries`);
    } catch (error) {
      console.error('Failed to generate mileage report:', error);
      Alert.alert('Error', 'Failed to generate report');
    } finally {
      setGenerating(null);
    }
  };

  const generateDailyReport = async () => {
    setGenerating('daily');
    try {
      const headers = [
        'Driver',
        'Job Address',
        'Customer',
        'Start Time',
        'End Time',
        'Start Mileage',
        'End Mileage',
        'Miles Driven',
        'State',
        'Weight (lbs)',
        'Dump Site',
        'Lunch Start',
        'Lunch End',
        'Lunch Duration',
      ];

      const rows: string[][] = [];
      const startTime = new Date(startDate).getTime();
      const endTime = new Date(endDate).getTime() + 86400000;

      const filteredJobs = jobs.filter(job => {
        if (!job.completedAt && !job.startedAt) return false;
        const jobDate = job.completedAt || job.startedAt;
        if (!jobDate) return false;
        const jobTime = new Date(jobDate).getTime();
        return jobTime >= startTime && jobTime < endTime;
      });

      drivers.forEach(driver => {
        const driverJobs = filteredJobs.filter(
          job => job.completedByDriverId === driver.id
        );

        const driverTimeLogs = timeLogs.filter(log => {
          const logTime = new Date(log.timestamp).getTime();
          return log.driverId === driver.id && logTime >= startTime && logTime < endTime;
        });

        const lunchStart = driverTimeLogs.find(log => log.type === 'LUNCH_START');
        const lunchEnd = driverTimeLogs.find(log => log.type === 'LUNCH_END');
        let lunchDuration = 'N/A';

        if (lunchStart && lunchEnd) {
          const durationMs = new Date(lunchEnd.timestamp).getTime() - new Date(lunchStart.timestamp).getTime();
          const minutes = Math.floor(durationMs / 60000);
          lunchDuration = `${minutes} min`;
        }

        if (driverJobs.length === 0) {
          const clockIn = driverTimeLogs.find(log => log.type === 'CLOCK_IN');
          if (clockIn) {
            rows.push([
              driver.name,
              'No Jobs',
              'N/A',
              'N/A',
              'N/A',
              'N/A',
              'N/A',
              'N/A',
              'N/A',
              'N/A',
              'N/A',
              lunchStart ? new Date(lunchStart.timestamp).toLocaleTimeString() : 'N/A',
              lunchEnd ? new Date(lunchEnd.timestamp).toLocaleTimeString() : 'N/A',
              lunchDuration,
            ]);
          }
        } else {
          driverJobs.forEach((job, index) => {
            const dumpTicket = dumpTickets.find(t => t.jobId === job.id);
            const dumpSite = job.dumpSiteId
              ? dumpSites.find(d => d.id === job.dumpSiteId)
              : null;

            const jobMileageLogs = mileageLogs
              .filter(log => log.jobId === job.id && log.driverId === driver.id)
              .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            const startMileage = jobMileageLogs[0]?.odometer || job.startMileage || 'N/A';
            const endMileage = jobMileageLogs[jobMileageLogs.length - 1]?.odometer || job.endMileage || 'N/A';
            const milesDriven =
              startMileage !== 'N/A' && endMileage !== 'N/A'
                ? String(Number(endMileage) - Number(startMileage))
                : 'N/A';

            const state = jobMileageLogs[0]?.state || 'N/A';
            const customer = job.customerName || 'Unknown';

            rows.push([
              driver.name,
              job.address,
              customer,
              job.startedAt ? new Date(job.startedAt).toLocaleTimeString() : 'N/A',
              job.completedAt ? new Date(job.completedAt).toLocaleTimeString() : 'N/A',
              String(startMileage),
              String(endMileage),
              milesDriven,
              state,
              dumpTicket?.netWeight ? String(dumpTicket.netWeight) : 'N/A',
              dumpSite?.name || 'N/A',
              index === 0 && lunchStart ? new Date(lunchStart.timestamp).toLocaleTimeString() : '',
              index === 0 && lunchEnd ? new Date(lunchEnd.timestamp).toLocaleTimeString() : '',
              index === 0 ? lunchDuration : '',
            ]);
          });
        }
      });

      const csvData = generateCSV(headers, rows);

      const report: Report = {
        id: `report-${Date.now()}`,
        name: `Daily Activity Report (${startDate} to ${endDate})`,
        type: 'DAILY',
        startDate,
        endDate,
        description: `Daily activity report from ${startDate} to ${endDate} with ${rows.length} entries`,
        csvData,
        entriesCount: rows.length,
        generatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      await addReport(report);
      Alert.alert('Success', `Daily report generated with ${rows.length} entries`);
    } catch (error) {
      console.error('Failed to generate daily report:', error);
      Alert.alert('Error', 'Failed to generate daily report');
    } finally {
      setGenerating(null);
    }
  };

  const emailReport = async (report: Report) => {
    try {
      const isAvailable = await MailComposer.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Email is not available on this device');
        return;
      }

      const fileName = `${report.name.replace(/\s+/g, '_')}_${new Date(report.generatedAt).toLocaleDateString().replace(/\//g, '-')}`;
      
      let attachments: string[] = [];

      if (Platform.OS !== 'web' && report.csvData) {
        const csvPath = `${FileSystem.documentDirectory}${fileName}.csv`;
        await FileSystem.writeAsStringAsync(csvPath, report.csvData, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        attachments.push(csvPath);
      }

      const emailBody = `
Report: ${report.name}
Generated: ${new Date(report.generatedAt).toLocaleString()}
${report.startDate && report.endDate ? `Date Range: ${report.startDate} to ${report.endDate}` : ''}
Entries: ${report.entriesCount}

${report.description || ''}

${Platform.OS === 'web' ? '\n\nCSV Data:\n' + report.csvData : ''}
      `.trim();

      await MailComposer.composeAsync({
        recipients: dispatcherSettings?.reportEmail ? [dispatcherSettings.reportEmail] : [],
        subject: `${report.name} - ${new Date(report.generatedAt).toLocaleDateString()}`,
        body: emailBody,
        attachments,
      });

      const emailedTo = dispatcherSettings?.reportEmail ? [dispatcherSettings.reportEmail] : [];
      await updateReport(report.id, {
        emailedTo: [...(report.emailedTo || []), ...emailedTo],
      });
    } catch (error) {
      console.error('Failed to email report:', error);
      Alert.alert('Error', 'Failed to send email');
    }
  };

  const handleViewReport = (report: Report) => {
    setViewingReport(report);
  };

  const handleEditReport = (report: Report) => {
    setEditingReport(report);
    setEditName(report.name);
    setEditDescription(report.description || '');
  };

  const handleSaveEdit = async () => {
    if (!editingReport) return;

    await updateReport(editingReport.id, {
      name: editName,
      description: editDescription,
    });

    setEditingReport(null);
    Alert.alert('Success', 'Report updated successfully');
  };

  const handleDeleteReport = (report: Report) => {
    Alert.alert('Delete Report', 'Are you sure you want to delete this report?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteReport(report.id);
          Alert.alert('Success', 'Report deleted');
        },
      },
    ]);
  };

  const renderDriverDayPreview = () => {
    if (!previewDriverId) return null;

    const driver = drivers.find(d => d.id === previewDriverId);
    if (!driver) return null;

    const driverTimeLogs = timeLogs.filter(log => {
      const logDate = new Date(log.timestamp).toISOString().split('T')[0];
      return log.driverId === previewDriverId && logDate === previewDate;
    });

    const clockIn = driverTimeLogs.find(log => log.type === 'CLOCK_IN');
    const clockOut = driverTimeLogs.find(log => log.type === 'CLOCK_OUT');
    const lunchStart = driverTimeLogs.find(log => log.type === 'LUNCH_START');
    const lunchEnd = driverTimeLogs.find(log => log.type === 'LUNCH_END');

    const driverDVIRs = dvirs.filter(d => {
      const dvirDate = new Date(d.timestamp).toISOString().split('T')[0];
      return d.driverId === previewDriverId && dvirDate === previewDate;
    });

    const preTrip = driverDVIRs.find(d => d.type === 'PRE_TRIP');
    const postTrip = driverDVIRs.find(d => d.type === 'POST_TRIP');

    const driverFuelLogs = fuelLogs.filter(f => {
      const fuelDate = new Date(f.date).toISOString().split('T')[0];
      return f.driverId === previewDriverId && fuelDate === previewDate;
    });

    const driverMileageLogs = mileageLogs.filter(m => {
      const mileageDate = new Date(m.timestamp).toISOString().split('T')[0];
      return m.driverId === previewDriverId && mileageDate === previewDate;
    }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const driverRoutes = [...routes, ...commercialRoutes, ...residentialRoutes, ...containerRoutes].filter(r => {
      const routeDate = r.date;
      return r.driverId === previewDriverId && routeDate === previewDate;
    });

    const allJobs: any[] = [];
    const allStops: any[] = [];

    driverRoutes.forEach((route: any) => {
      if (route.jobIds) {
        route.jobIds.forEach((jId: string) => {
          const job = jobs.find(j => j.id === jId);
          if (job) allJobs.push(job);
        });
      }
      if (route.stopIds) {
        route.stopIds.forEach((sId: string) => {
          const stop = commercialStops.find(s => s.id === sId);
          if (stop) allStops.push(stop);
        });
      }
      if (route.customerIds) {
        route.customerIds.forEach((cId: string) => {
          const stop = residentialStops.find(s => s.customerId === cId);
          if (stop) allStops.push(stop);
        });
      }
    });

    const startMileage = driverMileageLogs[0];
    const endMileage = driverMileageLogs[driverMileageLogs.length - 1];

    return (
      <ScrollView style={styles.previewContainer}>
        <Text style={styles.previewTitle}>Driver Day Report Preview</Text>
        <Text style={styles.previewSubtitle}>{driver.name} - {previewDate}</Text>

        <View style={styles.previewSection}>
          <Text style={styles.previewSectionTitle}>Time & Attendance</Text>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Clock In:</Text>
            <Text style={styles.previewValue}>
              {clockIn ? new Date(clockIn.timestamp).toLocaleTimeString() : 'Not logged'}
            </Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Clock Out:</Text>
            <Text style={styles.previewValue}>
              {clockOut ? new Date(clockOut.timestamp).toLocaleTimeString() : 'Not logged'}
            </Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Lunch Break:</Text>
            <Text style={styles.previewValue}>
              {lunchStart && lunchEnd
                ? `${new Date(lunchStart.timestamp).toLocaleTimeString()} - ${new Date(lunchEnd.timestamp).toLocaleTimeString()}`
                : lunchStart
                ? 'Started but not ended'
                : 'No lunch taken'}
            </Text>
          </View>
          {lunchStart && lunchEnd && (
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Lunch Duration:</Text>
              <Text style={styles.previewValue}>
                {Math.floor((new Date(lunchEnd.timestamp).getTime() - new Date(lunchStart.timestamp).getTime()) / 60000)} minutes
              </Text>
            </View>
          )}
        </View>

        <View style={styles.previewSection}>
          <Text style={styles.previewSectionTitle}>Mileage & Fuel</Text>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Start Mileage:</Text>
            <Text style={styles.previewValue}>
              {startMileage ? `${startMileage.odometer} (${startMileage.state || 'N/A'})` : 'Not logged'}
            </Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>End Mileage:</Text>
            <Text style={styles.previewValue}>
              {endMileage ? `${endMileage.odometer} (${endMileage.state || 'N/A'})` : 'Not logged'}
            </Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Total Miles:</Text>
            <Text style={styles.previewValue}>
              {startMileage && endMileage ? endMileage.odometer - startMileage.odometer : 'N/A'}
            </Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Fuel Added:</Text>
            <Text style={styles.previewValue}>
              {driverFuelLogs.length > 0
                ? driverFuelLogs.map(f => `${f.gallons}gal in ${f.state || 'N/A'}`).join(', ')
                : 'No fuel logged'}
            </Text>
          </View>
        </View>

        <View style={styles.previewSection}>
          <Text style={styles.previewSectionTitle}>Vehicle Inspections (DVIR)</Text>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Pre-Trip:</Text>
            <Text style={styles.previewValue}>
              {preTrip ? `Yes - ${preTrip.safeToOperate ? 'Safe' : 'Unsafe'}` : 'No'}
            </Text>
          </View>
          {preTrip && preTrip.defects.length > 0 && (
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Pre-Trip Defects:</Text>
              <Text style={styles.previewValue}>
                {preTrip.defects.map(d => `${d.component}: ${d.issue}`).join('; ')}
              </Text>
            </View>
          )}
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Post-Trip:</Text>
            <Text style={styles.previewValue}>
              {postTrip ? `Yes - ${postTrip.safeToOperate ? 'Safe' : 'Unsafe'}` : 'No'}
            </Text>
          </View>
          {postTrip && postTrip.defects.length > 0 && (
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Post-Trip Defects:</Text>
              <Text style={styles.previewValue}>
                {postTrip.defects.map(d => `${d.component}: ${d.issue}`).join('; ')}
              </Text>
            </View>
          )}
          {(preTrip?.defects.length || postTrip?.defects.length) ? (
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Sent to Mechanic:</Text>
              <Text style={styles.previewValue}>Manual process - check DVIR records</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.previewSection}>
          <Text style={styles.previewSectionTitle}>Jobs / Stops</Text>
          {allJobs.length === 0 && allStops.length === 0 && (
            <Text style={styles.previewValue}>No jobs or stops completed</Text>
          )}
          {allJobs.map((job: any, idx) => {
            const jobMileage = driverMileageLogs.filter(m => m.jobId === job.id);
            const jobStart = jobMileage[0];
            const jobEnd = jobMileage[jobMileage.length - 1];
            const dumpTicket = dumpTickets.find(t => t.jobId === job.id);

            return (
              <View key={job.id} style={styles.jobCard}>
                <Text style={styles.jobTitle}>Job #{idx + 1}: {job.address}</Text>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Start Time:</Text>
                  <Text style={styles.previewValue}>
                    {job.startedAt ? new Date(job.startedAt).toLocaleTimeString() : 'N/A'}
                  </Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>End Time:</Text>
                  <Text style={styles.previewValue}>
                    {job.completedAt ? new Date(job.completedAt).toLocaleTimeString() : 'N/A'}
                  </Text>
                </View>
                {job.startedAt && job.completedAt && (
                  <View style={styles.previewRow}>
                    <Text style={styles.previewLabel}>Duration:</Text>
                    <Text style={styles.previewValue}>
                      {Math.floor((new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()) / 60000)} minutes
                    </Text>
                  </View>
                )}
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Start Mileage:</Text>
                  <Text style={styles.previewValue}>{jobStart?.odometer || 'N/A'}</Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>End Mileage:</Text>
                  <Text style={styles.previewValue}>{jobEnd?.odometer || 'N/A'}</Text>
                </View>
                {dumpTicket && (
                  <View style={styles.previewRow}>
                    <Text style={styles.previewLabel}>Dump Ticket:</Text>
                    <Text style={styles.previewValue}>
                      #{dumpTicket.ticketNumber || 'N/A'} - {dumpTicket.netWeight || 0} lbs
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
          {allStops.map((stop: any, idx) => (
            <View key={stop.id} style={styles.jobCard}>
              <Text style={styles.jobTitle}>Stop #{idx + 1}: {stop.address}</Text>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Status:</Text>
                <Text style={styles.previewValue}>{stop.status}</Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Completed:</Text>
                <Text style={styles.previewValue}>
                  {stop.completedAt ? new Date(stop.completedAt).toLocaleTimeString() : 'Not completed'}
                </Text>
              </View>
              {'notOutReason' in stop && stop.notOutReason && (
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Issue:</Text>
                  <Text style={styles.previewValue}>{stop.notOutReason}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderCommercialRoutePreview = () => {
    if (!previewRouteId) return null;

    const route = commercialRoutes.find(r => r.id === previewRouteId);
    if (!route) return null;

    const routeStops = route.stopIds.map((sId: string) => commercialStops.find(s => s.id === sId)).filter((s: any) => s !== undefined);
    const completedStops = routeStops.filter((s: any) => s.status === 'COMPLETED');
    const issueStops = routeStops.filter((s: any) => ['NOT_OUT', 'BLOCKED', 'SKIPPED'].includes(s.status));

    const routeTimeLogs = timeLogs.filter(log => {
      const logDate = new Date(log.timestamp).toISOString().split('T')[0];
      return log.driverId === route.driverId && logDate === route.date;
    });

    const clockIn = routeTimeLogs.find(log => log.type === 'CLOCK_IN');
    const clockOut = routeTimeLogs.find(log => log.type === 'CLOCK_OUT');
    const lunchStart = routeTimeLogs.find(log => log.type === 'LUNCH_START');
    const lunchEnd = routeTimeLogs.find(log => log.type === 'LUNCH_END');

    const routeDVIRs = dvirs.filter(d => {
      const dvirDate = new Date(d.timestamp).toISOString().split('T')[0];
      return d.driverId === route.driverId && dvirDate === route.date;
    });

    const preTrip = routeDVIRs.find(d => d.type === 'PRE_TRIP');
    const postTrip = routeDVIRs.find(d => d.type === 'POST_TRIP');

    const routeFuelLogs = fuelLogs.filter(f => {
      const fuelDate = new Date(f.date).toISOString().split('T')[0];
      return f.driverId === route.driverId && fuelDate === route.date;
    });

    return (
      <ScrollView style={styles.previewContainer}>
        <Text style={styles.previewTitle}>Commercial Route Report Preview</Text>
        <Text style={styles.previewSubtitle}>{route.name} - {route.date}</Text>

        <View style={styles.previewSection}>
          <Text style={styles.previewSectionTitle}>Time & Attendance</Text>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Clock In:</Text>
            <Text style={styles.previewValue}>
              {clockIn ? new Date(clockIn.timestamp).toLocaleTimeString() : 'Not logged'}
            </Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Route Start:</Text>
            <Text style={styles.previewValue}>
              {route.startedAt ? new Date(route.startedAt).toLocaleTimeString() : 'Not started'}
            </Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Route End:</Text>
            <Text style={styles.previewValue}>
              {route.completedAt ? new Date(route.completedAt).toLocaleTimeString() : 'Not completed'}
            </Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Lunch:</Text>
            <Text style={styles.previewValue}>
              {lunchStart && lunchEnd
                ? `${new Date(lunchStart.timestamp).toLocaleTimeString()} - ${new Date(lunchEnd.timestamp).toLocaleTimeString()}`
                : 'No lunch taken'}
            </Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Clock Out:</Text>
            <Text style={styles.previewValue}>
              {clockOut ? new Date(clockOut.timestamp).toLocaleTimeString() : 'Not logged'}
            </Text>
          </View>
        </View>

        <View style={styles.previewSection}>
          <Text style={styles.previewSectionTitle}>Vehicle & Mileage</Text>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Pre-Trip:</Text>
            <Text style={styles.previewValue}>
              {preTrip ? `${preTrip.safeToOperate ? 'Safe' : 'Unsafe'} (${preTrip.defects.length} defects)` : 'Not done'}
            </Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Post-Trip:</Text>
            <Text style={styles.previewValue}>
              {postTrip ? `${postTrip.safeToOperate ? 'Safe' : 'Unsafe'} (${postTrip.defects.length} defects)` : 'Not done'}
            </Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Start Mileage:</Text>
            <Text style={styles.previewValue}>{route.startMileage || 'Not logged'}</Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>End Mileage:</Text>
            <Text style={styles.previewValue}>{route.endMileage || 'Not logged'}</Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Fuel:</Text>
            <Text style={styles.previewValue}>
              {routeFuelLogs.length > 0
                ? routeFuelLogs.map(f => `${f.gallons}gal`).join(', ')
                : 'No fuel logged'}
            </Text>
          </View>
        </View>

        <View style={styles.previewSection}>
          <Text style={styles.previewSectionTitle}>Stops Completion</Text>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Total Stops:</Text>
            <Text style={styles.previewValue}>{routeStops.length}</Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Completed:</Text>
            <Text style={styles.previewValue}>
              {completedStops.length} of {routeStops.length}
            </Text>
          </View>
          {issueStops.length > 0 && (
            <View style={styles.issuesContainer}>
              <Text style={styles.issuesTitle}>Issues:</Text>
              {issueStops.map((stop: any) => (
                <View key={stop.id} style={styles.issueItem}>
                  <Text style={styles.issueAddress}>{stop.address}</Text>
                  <Text style={styles.issueStatus}>
                    Status: {stop.status}
                    {stop.notOutReason && ` - ${stop.notOutReason}`}
                    {stop.blockedReason && ` - ${stop.blockedReason}`}
                    {stop.issueNotes && ` - ${stop.issueNotes}`}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  const reportCards = [
    {
      id: 'driver-day',
      title: 'Driver Day Report',
      description: 'Detailed driver activity: clock times, lunch, mileage, fuel, DVIR, and jobs with preview',
      icon: Calendar,
      count: drivers.length,
      color: colors.accent,
      onGenerate: () => {
        setPreviewType('DRIVER_DAY');
        setPreviewDriverId(drivers[0]?.id || null);
        setPreviewDate(new Date().toISOString().split('T')[0]);
        setPreviewModalVisible(true);
      },
    },
    {
      id: 'commercial',
      title: 'Commercial Route Report',
      description: 'Complete route details: times, mileage, fuel, DVIR, stops completion, and issues',
      icon: Truck,
      count: commercialRoutes.length,
      color: colors.primary,
      onGenerate: () => {
        setPreviewType('COMMERCIAL');
        setPreviewRouteId(commercialRoutes[0]?.id || null);
        setPreviewModalVisible(true);
      },
    },
    {
      id: 'fuel',
      title: 'Fuel & Mileage Report',
      description: 'Fuel consumption, costs, and mileage tracking',
      icon: Fuel,
      count: filterByDateRange(fuelLogs, startDate, endDate).length,
      color: colors.primary,
      onGenerate: generateFuelReport,
    },
    {
      id: 'dump',
      title: 'Dump Ticket Report',
      description: 'Dump site visits and weight tickets',
      icon: Truck,
      count: filterByDateRange(dumpTickets, startDate, endDate).length,
      color: colors.secondary,
      onGenerate: generateDumpTicketReport,
    },
    {
      id: 'dvir',
      title: 'DVIR Report',
      description: 'Vehicle inspection reports and defects',
      icon: FileCheck,
      count: filterByDateRange(dvirs, startDate, endDate).length,
      color: colors.accent,
      onGenerate: generateDVIRReport,
    },
    {
      id: 'time',
      title: 'Time & Attendance Report',
      description: 'Driver clock in/out and hours worked',
      icon: Clock,
      count: filterByDateRange(timeLogs, startDate, endDate).length,
      color: colors.success,
      onGenerate: generateTimeReport,
    },
    {
      id: 'mileage',
      title: 'Mileage Log Report',
      description: 'Detailed mileage tracking logs',
      icon: Gauge,
      count: filterByDateRange(mileageLogs, startDate, endDate).length,
      color: colors.primary,
      onGenerate: generateMileageReport,
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <FileText size={24} color={colors.primary} />
        <Text style={styles.headerTitle}>Reports & Analytics</Text>
      </View>

      <View style={styles.dateRangeCard}>
        <Text style={styles.dateRangeTitle}>Date Range</Text>
        <View style={styles.dateRangeRow}>
          <View style={styles.dateInputContainer}>
            <Text style={styles.dateLabel}>Start Date</Text>
            <TextInput
              style={styles.dateInput}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          <View style={styles.dateInputContainer}>
            <Text style={styles.dateLabel}>End Date</Text>
            <TextInput
              style={styles.dateInput}
              value={endDate}
              onChangeText={setEndDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{drivers.length}</Text>
          <Text style={styles.statLabel}>Drivers</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{trucks.length}</Text>
          <Text style={styles.statLabel}>Trucks</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{reports.length}</Text>
          <Text style={styles.statLabel}>Saved Reports</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Generate New Reports</Text>

      {reportCards.map(card => {
        const Icon = card.icon;
        const isGenerating = generating === card.id;

        return (
          <View key={card.id} style={styles.reportCard}>
            <View style={[styles.reportIcon, { backgroundColor: card.color }]}>
              <Icon size={28} color={colors.background} />
            </View>
            <View style={styles.reportInfo}>
              <Text style={styles.reportTitle}>{card.title}</Text>
              <Text style={styles.reportDescription}>{card.description}</Text>
              <Text style={styles.reportCount}>{card.count} entries in range</Text>
            </View>
            <TouchableOpacity
              style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
              onPress={card.onGenerate}
              disabled={isGenerating}
            >
              <Download size={20} color={colors.background} />
            </TouchableOpacity>
          </View>
        );
      })}

      {reports.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Saved Reports</Text>
          {reports
            .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
            .map(report => (
            <View key={report.id} style={styles.savedReportCard}>
              <View style={styles.savedReportHeader}>
                <View style={styles.savedReportInfo}>
                  <Text style={styles.savedReportTitle}>{report.name}</Text>
                  <Text style={styles.savedReportDate}>
                    {new Date(report.generatedAt).toLocaleString()}
                  </Text>
                  {report.startDate && report.endDate && (
                    <Text style={styles.savedReportDateRange}>
                      Range: {report.startDate} to {report.endDate}
                    </Text>
                  )}
                  <Text style={styles.savedReportCount}>{report.entriesCount} entries</Text>
                </View>
              </View>
              <View style={styles.savedReportActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleViewReport(report)}
                >
                  <Eye size={18} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEditReport(report)}
                >
                  <Edit2 size={18} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => emailReport(report)}
                >
                  <Mail size={18} color={colors.success} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteReport(report)}
                >
                  <Trash2 size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Export Formats</Text>
        <Text style={styles.infoText}>
          Reports are generated in CSV format, compatible with Excel and QuickBooks. On mobile
          devices, reports can be emailed with CSV attachments. Configure the report email in
          Settings.
        </Text>
      </View>

      <Modal visible={!!viewingReport} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{viewingReport?.name}</Text>
              <TouchableOpacity onPress={() => setViewingReport(null)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalLabel}>Generated</Text>
              <Text style={styles.modalValue}>
                {viewingReport && new Date(viewingReport.generatedAt).toLocaleString()}
              </Text>

              {viewingReport?.startDate && viewingReport?.endDate && (
                <>
                  <Text style={styles.modalLabel}>Date Range</Text>
                  <Text style={styles.modalValue}>
                    {viewingReport.startDate} to {viewingReport.endDate}
                  </Text>
                </>
              )}

              <Text style={styles.modalLabel}>Entries</Text>
              <Text style={styles.modalValue}>{viewingReport?.entriesCount}</Text>

              {viewingReport?.description && (
                <>
                  <Text style={styles.modalLabel}>Description</Text>
                  <Text style={styles.modalValue}>{viewingReport.description}</Text>
                </>
              )}

              {viewingReport?.emailedTo && viewingReport.emailedTo.length > 0 && (
                <>
                  <Text style={styles.modalLabel}>Emailed To</Text>
                  <Text style={styles.modalValue}>{viewingReport.emailedTo.join(', ')}</Text>
                </>
              )}

              <Text style={styles.modalLabel}>CSV Preview</Text>
              <ScrollView horizontal style={styles.csvPreview}>
                <Text style={styles.csvText}>{viewingReport?.csvData?.substring(0, 1000)}</Text>
              </ScrollView>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={previewModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Preview</Text>
              <TouchableOpacity onPress={() => setPreviewModalVisible(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            {previewType === 'DRIVER_DAY' && (
              <View style={styles.modalBody}>
                <Text style={styles.modalLabel}>Select Driver</Text>
                <ScrollView horizontal style={styles.driverPicker}>
                  {drivers.map(d => (
                    <TouchableOpacity
                      key={d.id}
                      style={[
                        styles.driverChip,
                        previewDriverId === d.id && styles.driverChipSelected,
                      ]}
                      onPress={() => setPreviewDriverId(d.id)}
                    >
                      <Text
                        style={[
                          styles.driverChipText,
                          previewDriverId === d.id && styles.driverChipTextSelected,
                        ]}
                      >
                        {d.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.modalLabel}>Select Date</Text>
                <TextInput
                  style={styles.modalInput}
                  value={previewDate}
                  onChangeText={setPreviewDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textSecondary}
                />

                {renderDriverDayPreview()}
              </View>
            )}
            {previewType === 'COMMERCIAL' && (
              <View style={styles.modalBody}>
                <Text style={styles.modalLabel}>Select Route</Text>
                <ScrollView horizontal style={styles.driverPicker}>
                  {commercialRoutes.map(r => (
                    <TouchableOpacity
                      key={r.id}
                      style={[
                        styles.driverChip,
                        previewRouteId === r.id && styles.driverChipSelected,
                      ]}
                      onPress={() => setPreviewRouteId(r.id)}
                    >
                      <Text
                        style={[
                          styles.driverChipText,
                          previewRouteId === r.id && styles.driverChipTextSelected,
                        ]}
                      >
                        {r.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {renderCommercialRoutePreview()}
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={!!editingReport} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Report</Text>
              <TouchableOpacity onPress={() => setEditingReport(null)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalLabel}>Report Name</Text>
              <TextInput
                style={styles.modalInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Report name"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={styles.modalLabel}>Description</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Report description"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
  },
  dateRangeCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  dateRangeTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 12,
  },
  dateRangeRow: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  dateInputContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  dateInput: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statsRow: {
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
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
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 16,
  },
  reportCard: {
    flexDirection: 'row' as const,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center' as const,
  },
  reportIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  reportCount: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600' as const,
  },
  generateButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  savedReportCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  savedReportHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 12,
  },
  savedReportInfo: {
    flex: 1,
  },
  savedReportTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  savedReportDate: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  savedReportDateRange: {
    fontSize: 12,
    color: colors.accent,
    marginBottom: 2,
    fontWeight: '500' as const,
  },
  savedReportCount: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600' as const,
  },
  savedReportActions: {
    flexDirection: 'row' as const,
    gap: 8,
    justifyContent: 'flex-end' as const,
  },
  actionButton: {
    width: 40,
    height: 40,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  infoBox: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: colors.background,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.backgroundSecondary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
  },
  modalBody: {
    padding: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  modalValue: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  csvPreview: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
    maxHeight: 200,
  },
  csvText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: colors.text,
  },
  modalInput: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  modalTextArea: {
    minHeight: 100,
    textAlignVertical: 'top' as const,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center' as const,
    marginTop: 24,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.background,
  },
  driverPicker: {
    marginBottom: 16,
  },
  driverChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    marginRight: 8,
    borderWidth: 2,
    borderColor: colors.backgroundSecondary,
  },
  driverChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  driverChipText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600' as const,
  },
  driverChipTextSelected: {
    color: colors.background,
  },
  previewContainer: {
    maxHeight: 400,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 4,
  },
  previewSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  previewSection: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  previewSectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 8,
  },
  previewRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 6,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    flex: 1,
  },
  previewValue: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 2,
    textAlign: 'right' as const,
  },
  jobCard: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 8,
  },
  issuesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  issuesTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.error,
    marginBottom: 8,
  },
  issueItem: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  },
  issueAddress: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  issueStatus: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
