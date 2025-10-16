import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import type {
  Driver, Truck, DumpSite, Yard, Customer, Job, Route,
  TimeLog, DVIR, FuelLog, DumpTicket, Message, GPSBreadcrumb, MileageLog, DispatcherSettings, Report, RecurringJob
} from '@/types';
import {
  sampleDrivers,
  sampleTrucks,
  sampleDumpSites,
  sampleYards,
  sampleCustomers,
} from '@/utils/sampleData';

const STORAGE_KEYS = {
  DRIVERS: '@gmi_drivers',
  TRUCKS: '@gmi_trucks',
  DUMP_SITES: '@gmi_dump_sites',
  YARDS: '@gmi_yards',
  CUSTOMERS: '@gmi_customers',
  JOBS: '@gmi_jobs',
  ROUTES: '@gmi_routes',
  TIME_LOGS: '@gmi_time_logs',
  DVIRS: '@gmi_dvirs',
  FUEL_LOGS: '@gmi_fuel_logs',
  DUMP_TICKETS: '@gmi_dump_tickets',
  MESSAGES: '@gmi_messages',
  GPS_BREADCRUMBS: '@gmi_gps_breadcrumbs',
  MILEAGE_LOGS: '@gmi_mileage_logs',
  DISPATCHER_SETTINGS: '@gmi_dispatcher_settings',
  REPORTS: '@gmi_reports',
  RECURRING_JOBS: '@gmi_recurring_jobs',
  LAST_SYNC: '@gmi_last_sync',
};

export const [DataProvider, useData] = createContextHook(() => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [dumpSites, setDumpSites] = useState<DumpSite[]>([]);
  const [yards, setYards] = useState<Yard[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [dvirs, setDvirs] = useState<DVIR[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [dumpTickets, setDumpTickets] = useState<DumpTicket[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [gpsBreadcrumbs, setGpsBreadcrumbs] = useState<GPSBreadcrumb[]>([]);
  const [mileageLogs, setMileageLogs] = useState<MileageLog[]>([]);
  const [dispatcherSettings, setDispatcherSettings] = useState<DispatcherSettings | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [recurringJobs, setRecurringJobs] = useState<RecurringJob[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const getAllQuery = trpc.data.getAll.useQuery(undefined, {
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });
  const syncMutation = trpc.data.sync.useMutation();

  useEffect(() => {
    loadLocalData();
  }, []);

  useEffect(() => {
    if (getAllQuery.data && !getAllQuery.isLoading) {
      console.log('Received data from backend, updating local state');
      updateFromBackend(getAllQuery.data);
    }
  }, [getAllQuery.data]);

  const updateFromBackend = async (data: any) => {
    setDrivers(data.drivers || []);
    setTrucks(data.trucks || []);
    setDumpSites(data.dumpSites || []);
    setYards(data.yards || []);
    setCustomers(data.customers || []);
    setJobs(data.jobs || []);
    setRoutes(data.routes || []);
    setTimeLogs(data.timeLogs || []);
    setDvirs(data.dvirs || []);
    setFuelLogs(data.fuelLogs || []);
    setDumpTickets(data.dumpTickets || []);
    setMessages(data.messages || []);
    setGpsBreadcrumbs(data.gpsBreadcrumbs || []);
    setMileageLogs(data.mileageLogs || []);
    setDispatcherSettings(data.dispatcherSettings);
    setReports(data.reports || []);
    setRecurringJobs(data.recurringJobs || []);

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(data.drivers || [])),
      AsyncStorage.setItem(STORAGE_KEYS.TRUCKS, JSON.stringify(data.trucks || [])),
      AsyncStorage.setItem(STORAGE_KEYS.DUMP_SITES, JSON.stringify(data.dumpSites || [])),
      AsyncStorage.setItem(STORAGE_KEYS.YARDS, JSON.stringify(data.yards || [])),
      AsyncStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(data.customers || [])),
      AsyncStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(data.jobs || [])),
      AsyncStorage.setItem(STORAGE_KEYS.ROUTES, JSON.stringify(data.routes || [])),
      AsyncStorage.setItem(STORAGE_KEYS.TIME_LOGS, JSON.stringify(data.timeLogs || [])),
      AsyncStorage.setItem(STORAGE_KEYS.DVIRS, JSON.stringify(data.dvirs || [])),
      AsyncStorage.setItem(STORAGE_KEYS.FUEL_LOGS, JSON.stringify(data.fuelLogs || [])),
      AsyncStorage.setItem(STORAGE_KEYS.DUMP_TICKETS, JSON.stringify(data.dumpTickets || [])),
      AsyncStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(data.messages || [])),
      AsyncStorage.setItem(STORAGE_KEYS.GPS_BREADCRUMBS, JSON.stringify(data.gpsBreadcrumbs || [])),
      AsyncStorage.setItem(STORAGE_KEYS.MILEAGE_LOGS, JSON.stringify(data.mileageLogs || [])),
      AsyncStorage.setItem(STORAGE_KEYS.DISPATCHER_SETTINGS, JSON.stringify(data.dispatcherSettings)),
      AsyncStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(data.reports || [])),
      AsyncStorage.setItem(STORAGE_KEYS.RECURRING_JOBS, JSON.stringify(data.recurringJobs || [])),
      AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString()),
    ]);

    console.log('Data synced with backend successfully');
  };

  const loadLocalData = async () => {
    const timeout = setTimeout(() => {
      console.warn('Data loading timeout, continuing anyway');
      setIsLoading(false);
    }, 5000);

    try {
      const [
        driversData, trucksData, dumpSitesData, yardsData, customersData,
        jobsData, routesData, timeLogsData, dvirsData, fuelLogsData,
        dumpTicketsData, messagesData, gpsData, mileageLogsData, settingsData, reportsData, recurringJobsData
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.DRIVERS),
        AsyncStorage.getItem(STORAGE_KEYS.TRUCKS),
        AsyncStorage.getItem(STORAGE_KEYS.DUMP_SITES),
        AsyncStorage.getItem(STORAGE_KEYS.YARDS),
        AsyncStorage.getItem(STORAGE_KEYS.CUSTOMERS),
        AsyncStorage.getItem(STORAGE_KEYS.JOBS),
        AsyncStorage.getItem(STORAGE_KEYS.ROUTES),
        AsyncStorage.getItem(STORAGE_KEYS.TIME_LOGS),
        AsyncStorage.getItem(STORAGE_KEYS.DVIRS),
        AsyncStorage.getItem(STORAGE_KEYS.FUEL_LOGS),
        AsyncStorage.getItem(STORAGE_KEYS.DUMP_TICKETS),
        AsyncStorage.getItem(STORAGE_KEYS.MESSAGES),
        AsyncStorage.getItem(STORAGE_KEYS.GPS_BREADCRUMBS),
        AsyncStorage.getItem(STORAGE_KEYS.MILEAGE_LOGS),
        AsyncStorage.getItem(STORAGE_KEYS.DISPATCHER_SETTINGS),
        AsyncStorage.getItem(STORAGE_KEYS.REPORTS),
        AsyncStorage.getItem(STORAGE_KEYS.RECURRING_JOBS),
      ]);

      if (driversData && driversData !== 'null' && driversData !== 'undefined') {
        try {
          const parsed = JSON.parse(driversData);
          if (Array.isArray(parsed)) {
            setDrivers(parsed);
          } else {
            console.error('Drivers data is not an array, using samples');
            setDrivers(sampleDrivers);
          }
        } catch (e) {
          console.error('Failed to parse drivers data:', e);
          setDrivers(sampleDrivers);
        }
      } else {
        setDrivers(sampleDrivers);
      }
      
      if (trucksData && trucksData !== 'null' && trucksData !== 'undefined') {
        try {
          const parsed = JSON.parse(trucksData);
          if (Array.isArray(parsed)) {
            setTrucks(parsed);
          } else {
            setTrucks(sampleTrucks);
          }
        } catch (e) {
          console.error('Failed to parse trucks data:', e);
          setTrucks(sampleTrucks);
        }
      } else {
        setTrucks(sampleTrucks);
      }
      
      if (dumpSitesData && dumpSitesData !== 'null' && dumpSitesData !== 'undefined') {
        try {
          const parsed = JSON.parse(dumpSitesData);
          if (Array.isArray(parsed)) {
            setDumpSites(parsed);
          } else {
            setDumpSites(sampleDumpSites);
          }
        } catch (e) {
          console.error('Failed to parse dump sites data:', e);
          setDumpSites(sampleDumpSites);
        }
      } else {
        setDumpSites(sampleDumpSites);
      }
      
      if (yardsData && yardsData !== 'null' && yardsData !== 'undefined') {
        try {
          const parsed = JSON.parse(yardsData);
          if (Array.isArray(parsed)) {
            setYards(parsed);
          } else {
            setYards(sampleYards);
          }
        } catch (e) {
          console.error('Failed to parse yards data:', e);
          setYards(sampleYards);
        }
      } else {
        setYards(sampleYards);
      }
      
      if (customersData && customersData !== 'null' && customersData !== 'undefined') {
        try {
          const parsed = JSON.parse(customersData);
          if (Array.isArray(parsed)) {
            setCustomers(parsed);
          } else {
            setCustomers(sampleCustomers);
          }
        } catch (e) {
          console.error('Failed to parse customers data:', e);
          setCustomers(sampleCustomers);
        }
      } else {
        setCustomers(sampleCustomers);
      }
      
      if (jobsData && jobsData !== 'null' && jobsData !== 'undefined') {
        try {
          const parsed = JSON.parse(jobsData);
          if (Array.isArray(parsed)) setJobs(parsed);
        } catch (e) {
          console.error('Failed to parse jobs data:', e);
        }
      }
      
      if (routesData && routesData !== 'null' && routesData !== 'undefined') {
        try {
          const parsed = JSON.parse(routesData);
          if (Array.isArray(parsed)) setRoutes(parsed);
        } catch (e) {
          console.error('Failed to parse routes data:', e);
        }
      }
      
      if (timeLogsData && timeLogsData !== 'null' && timeLogsData !== 'undefined') {
        try {
          const parsed = JSON.parse(timeLogsData);
          if (Array.isArray(parsed)) setTimeLogs(parsed);
        } catch (e) {
          console.error('Failed to parse time logs data:', e);
        }
      }
      
      if (dvirsData && dvirsData !== 'null' && dvirsData !== 'undefined') {
        try {
          const parsed = JSON.parse(dvirsData);
          if (Array.isArray(parsed)) setDvirs(parsed);
        } catch (e) {
          console.error('Failed to parse dvirs data:', e);
        }
      }
      
      if (fuelLogsData && fuelLogsData !== 'null' && fuelLogsData !== 'undefined') {
        try {
          const parsed = JSON.parse(fuelLogsData);
          if (Array.isArray(parsed)) setFuelLogs(parsed);
        } catch (e) {
          console.error('Failed to parse fuel logs data:', e);
        }
      }
      
      if (dumpTicketsData && dumpTicketsData !== 'null' && dumpTicketsData !== 'undefined') {
        try {
          const parsed = JSON.parse(dumpTicketsData);
          if (Array.isArray(parsed)) setDumpTickets(parsed);
        } catch (e) {
          console.error('Failed to parse dump tickets data:', e);
        }
      }
      
      if (messagesData && messagesData !== 'null' && messagesData !== 'undefined') {
        try {
          const parsed = JSON.parse(messagesData);
          if (Array.isArray(parsed)) setMessages(parsed);
        } catch (e) {
          console.error('Failed to parse messages data:', e);
        }
      }
      
      if (gpsData && gpsData !== 'null' && gpsData !== 'undefined') {
        try {
          const parsed = JSON.parse(gpsData);
          if (Array.isArray(parsed)) setGpsBreadcrumbs(parsed);
        } catch (e) {
          console.error('Failed to parse GPS data:', e);
        }
      }
      
      if (mileageLogsData && mileageLogsData !== 'null' && mileageLogsData !== 'undefined') {
        try {
          const parsed = JSON.parse(mileageLogsData);
          if (Array.isArray(parsed)) setMileageLogs(parsed);
        } catch (e) {
          console.error('Failed to parse mileage logs data:', e);
        }
      }
      
      if (settingsData && settingsData !== 'null' && settingsData !== 'undefined') {
        try {
          const parsed = JSON.parse(settingsData);
          setDispatcherSettings(parsed);
        } catch (e) {
          console.error('Failed to parse settings data:', e);
        }
      }
      
      if (reportsData && reportsData !== 'null' && reportsData !== 'undefined') {
        try {
          const parsed = JSON.parse(reportsData);
          if (Array.isArray(parsed)) setReports(parsed);
        } catch (e) {
          console.error('Failed to parse reports data:', e);
        }
      }
      
      if (recurringJobsData && recurringJobsData !== 'null' && recurringJobsData !== 'undefined') {
        try {
          const parsed = JSON.parse(recurringJobsData);
          if (Array.isArray(parsed)) setRecurringJobs(parsed);
        } catch (e) {
          console.error('Failed to parse recurring jobs data:', e);
        }
      }

      console.log('Local data loaded');
    } catch (error) {
      console.error('Failed to load local data:', error);
    } finally {
      clearTimeout(timeout);
      setIsLoading(false);
    }
  };

  const syncToBackend = useCallback(async (data: any) => {
    try {
      setIsSyncing(true);
      await syncMutation.mutateAsync(data);
      await getAllQuery.refetch();
      console.log('Data synced to backend');
    } catch (error) {
      console.error('Failed to sync to backend:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [syncMutation, getAllQuery]);

  const addDriver = useCallback(async (driver: Driver) => {
    const updated = [...drivers, driver];
    setDrivers(updated);
    await syncToBackend({ drivers: updated });
  }, [drivers, syncToBackend]);

  const updateDriver = useCallback(async (id: string, updates: Partial<Driver>) => {
    const updated = drivers.map(d => d.id === id ? { ...d, ...updates } : d);
    setDrivers(updated);
    await syncToBackend({ drivers: updated });
  }, [drivers, syncToBackend]);

  const addTruck = useCallback(async (truck: Truck) => {
    const updated = [...trucks, truck];
    setTrucks(updated);
    await syncToBackend({ trucks: updated });
  }, [trucks, syncToBackend]);

  const updateTruck = useCallback(async (id: string, updates: Partial<Truck>) => {
    const updated = trucks.map(t => t.id === id ? { ...t, ...updates } : t);
    setTrucks(updated);
    await syncToBackend({ trucks: updated });
  }, [trucks, syncToBackend]);

  const addCustomer = useCallback(async (customer: Customer) => {
    const updated = [...customers, customer];
    setCustomers(updated);
    await syncToBackend({ customers: updated });
  }, [customers, syncToBackend]);

  const addJob = useCallback(async (job: Job) => {
    const updated = [...jobs, job];
    setJobs(updated);
    await syncToBackend({ jobs: updated });
  }, [jobs, syncToBackend]);

  const updateJob = useCallback(async (id: string, updates: Partial<Job>) => {
    const updated = jobs.map(j => j.id === id ? { ...j, ...updates } : j);
    setJobs(updated);
    await syncToBackend({ jobs: updated });
  }, [jobs, syncToBackend]);

  const addRoute = useCallback(async (route: Route) => {
    const updated = [...routes, route];
    setRoutes(updated);
    await syncToBackend({ routes: updated });
  }, [routes, syncToBackend]);

  const updateRoute = useCallback(async (id: string, updates: Partial<Route>) => {
    const updated = routes.map(r => r.id === id ? { ...r, ...updates } : r);
    setRoutes(updated);
    await syncToBackend({ routes: updated });
  }, [routes, syncToBackend]);

  const addTimeLog = useCallback(async (timeLog: TimeLog) => {
    const updated = [...timeLogs, timeLog];
    setTimeLogs(updated);
    await syncToBackend({ timeLogs: updated });
  }, [timeLogs, syncToBackend]);

  const addDVIR = useCallback(async (dvir: DVIR) => {
    const updated = [...dvirs, dvir];
    setDvirs(updated);
    await syncToBackend({ dvirs: updated });
  }, [dvirs, syncToBackend]);

  const addFuelLog = useCallback(async (fuelLog: FuelLog) => {
    const updated = [...fuelLogs, fuelLog];
    setFuelLogs(updated);
    await syncToBackend({ fuelLogs: updated });
  }, [fuelLogs, syncToBackend]);

  const addDumpTicket = useCallback(async (dumpTicket: DumpTicket) => {
    const updated = [...dumpTickets, dumpTicket];
    setDumpTickets(updated);
    await syncToBackend({ dumpTickets: updated });
  }, [dumpTickets, syncToBackend]);

  const addMessage = useCallback(async (message: Message) => {
    const updated = [...messages, message];
    setMessages(updated);
    await syncToBackend({ messages: updated });
  }, [messages, syncToBackend]);

  const addGPSBreadcrumb = useCallback(async (breadcrumb: GPSBreadcrumb) => {
    const updated = [...gpsBreadcrumbs, breadcrumb];
    setGpsBreadcrumbs(updated);
    await syncToBackend({ gpsBreadcrumbs: updated });
  }, [gpsBreadcrumbs, syncToBackend]);

  const addDumpSite = useCallback(async (dumpSite: DumpSite) => {
    const updated = [...dumpSites, dumpSite];
    setDumpSites(updated);
    await syncToBackend({ dumpSites: updated });
  }, [dumpSites, syncToBackend]);

  const addYard = useCallback(async (yard: Yard) => {
    const updated = [...yards, yard];
    setYards(updated);
    await syncToBackend({ yards: updated });
  }, [yards, syncToBackend]);

  const deleteDriver = useCallback(async (id: string) => {
    const updated = drivers.filter(d => d.id !== id);
    setDrivers(updated);
    await syncToBackend({ drivers: updated });
  }, [drivers, syncToBackend]);

  const deleteTruck = useCallback(async (id: string) => {
    const updated = trucks.filter(t => t.id !== id);
    setTrucks(updated);
    await syncToBackend({ trucks: updated });
  }, [trucks, syncToBackend]);

  const deleteCustomer = useCallback(async (id: string) => {
    const updated = customers.filter(c => c.id !== id);
    setCustomers(updated);
    await syncToBackend({ customers: updated });
  }, [customers, syncToBackend]);

  const deleteJob = useCallback(async (id: string) => {
    const updated = jobs.filter(j => j.id !== id);
    setJobs(updated);
    await syncToBackend({ jobs: updated });
  }, [jobs, syncToBackend]);

  const deleteRoute = useCallback(async (id: string) => {
    const updated = routes.filter(r => r.id !== id);
    setRoutes(updated);
    await syncToBackend({ routes: updated });
  }, [routes, syncToBackend]);

  const deleteDumpSite = useCallback(async (id: string) => {
    const updated = dumpSites.filter(d => d.id !== id);
    setDumpSites(updated);
    await syncToBackend({ dumpSites: updated });
  }, [dumpSites, syncToBackend]);

  const deleteYard = useCallback(async (id: string) => {
    const updated = yards.filter(y => y.id !== id);
    setYards(updated);
    await syncToBackend({ yards: updated });
  }, [yards, syncToBackend]);

  const addMileageLog = useCallback(async (mileageLog: MileageLog) => {
    const updated = [...mileageLogs, mileageLog];
    setMileageLogs(updated);
    await syncToBackend({ mileageLogs: updated });
  }, [mileageLogs, syncToBackend]);

  const updateDispatcherSettings = useCallback(async (updates: Partial<DispatcherSettings>) => {
    const updated: DispatcherSettings = {
      ...dispatcherSettings,
      ...updates,
      id: dispatcherSettings?.id || 'settings-1',
      createdAt: dispatcherSettings?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setDispatcherSettings(updated);
    await syncToBackend({ dispatcherSettings: updated });
  }, [dispatcherSettings, syncToBackend]);

  const updateCustomer = useCallback(async (id: string, updates: Partial<Customer>) => {
    const updated = customers.map(c => c.id === id ? { ...c, ...updates } : c);
    setCustomers(updated);
    await syncToBackend({ customers: updated });
  }, [customers, syncToBackend]);

  const updateDumpSite = useCallback(async (id: string, updates: Partial<DumpSite>) => {
    const updated = dumpSites.map(d => d.id === id ? { ...d, ...updates } : d);
    setDumpSites(updated);
    await syncToBackend({ dumpSites: updated });
  }, [dumpSites, syncToBackend]);

  const updateYard = useCallback(async (id: string, updates: Partial<Yard>) => {
    const updated = yards.map(y => y.id === id ? { ...y, ...updates } : y);
    setYards(updated);
    await syncToBackend({ yards: updated });
  }, [yards, syncToBackend]);

  const addReport = useCallback(async (report: Report) => {
    const updated = [...reports, report];
    setReports(updated);
    await syncToBackend({ reports: updated });
  }, [reports, syncToBackend]);

  const updateReport = useCallback(async (id: string, updates: Partial<Report>) => {
    const updated = reports.map(r => r.id === id ? { ...r, ...updates } : r);
    setReports(updated);
    await syncToBackend({ reports: updated });
  }, [reports, syncToBackend]);

  const deleteReport = useCallback(async (id: string) => {
    const updated = reports.filter(r => r.id !== id);
    setReports(updated);
    await syncToBackend({ reports: updated });
  }, [reports, syncToBackend]);

  const addRecurringJob = useCallback(async (recurringJob: RecurringJob) => {
    const updated = [...recurringJobs, recurringJob];
    setRecurringJobs(updated);
    await syncToBackend({ recurringJobs: updated });
  }, [recurringJobs, syncToBackend]);

  const updateRecurringJob = useCallback(async (id: string, updates: Partial<RecurringJob>) => {
    const updated = recurringJobs.map(rj => rj.id === id ? { ...rj, ...updates } : rj);
    setRecurringJobs(updated);
    await syncToBackend({ recurringJobs: updated });
  }, [recurringJobs, syncToBackend]);

  const deleteRecurringJob = useCallback(async (id: string) => {
    const updated = recurringJobs.filter(rj => rj.id !== id);
    setRecurringJobs(updated);
    await syncToBackend({ recurringJobs: updated });
  }, [recurringJobs, syncToBackend]);

  return useMemo(() => ({
    drivers,
    trucks,
    dumpSites,
    yards,
    customers,
    jobs,
    routes,
    timeLogs,
    dvirs,
    fuelLogs,
    dumpTickets,
    messages,
    gpsBreadcrumbs,
    mileageLogs,
    dispatcherSettings,
    reports,
    recurringJobs,
    isLoading: isLoading || getAllQuery.isLoading,
    isSyncing,
    addDriver,
    updateDriver,
    deleteDriver,
    addTruck,
    updateTruck,
    deleteTruck,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addJob,
    updateJob,
    deleteJob,
    addRoute,
    updateRoute,
    deleteRoute,
    addTimeLog,
    addDVIR,
    addFuelLog,
    addDumpTicket,
    addMessage,
    addGPSBreadcrumb,
    addDumpSite,
    updateDumpSite,
    deleteDumpSite,
    addYard,
    updateYard,
    deleteYard,
    addMileageLog,
    updateDispatcherSettings,
    addReport,
    updateReport,
    deleteReport,
    addRecurringJob,
    updateRecurringJob,
    deleteRecurringJob,
  }), [
    drivers, trucks, dumpSites, yards, customers, jobs, routes,
    timeLogs, dvirs, fuelLogs, dumpTickets, messages, gpsBreadcrumbs, mileageLogs, dispatcherSettings, reports, recurringJobs,
    isLoading, isSyncing, getAllQuery.isLoading,
    addDriver, updateDriver, deleteDriver, addTruck, updateTruck, deleteTruck,
    addCustomer, updateCustomer, deleteCustomer, addJob, updateJob, deleteJob,
    addRoute, updateRoute, deleteRoute, addTimeLog, addDVIR, addFuelLog,
    addDumpTicket, addMessage, addGPSBreadcrumb, addDumpSite, updateDumpSite,
    deleteDumpSite, addYard, updateYard, deleteYard, addMileageLog, updateDispatcherSettings,
    addReport, updateReport, deleteReport, addRecurringJob, updateRecurringJob, deleteRecurringJob
  ]);
});
