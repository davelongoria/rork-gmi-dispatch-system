import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
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

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
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
            console.error('Drivers data is not an array, resetting');
            setDrivers(sampleDrivers);
            await AsyncStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(sampleDrivers));
          }
        } catch (e) {
          console.error('Failed to parse drivers data:', e, 'Data:', driversData?.substring(0, 100));
          setDrivers(sampleDrivers);
          await AsyncStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(sampleDrivers));
        }
      } else {
        setDrivers(sampleDrivers);
        await AsyncStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(sampleDrivers));
      }
      
      if (trucksData && trucksData !== 'null' && trucksData !== 'undefined') {
        try {
          const parsed = JSON.parse(trucksData);
          if (Array.isArray(parsed)) {
            setTrucks(parsed);
          } else {
            console.error('Trucks data is not an array, resetting');
            setTrucks(sampleTrucks);
            await AsyncStorage.setItem(STORAGE_KEYS.TRUCKS, JSON.stringify(sampleTrucks));
          }
        } catch (e) {
          console.error('Failed to parse trucks data:', e, 'Data:', trucksData?.substring(0, 100));
          setTrucks(sampleTrucks);
          await AsyncStorage.setItem(STORAGE_KEYS.TRUCKS, JSON.stringify(sampleTrucks));
        }
      } else {
        setTrucks(sampleTrucks);
        await AsyncStorage.setItem(STORAGE_KEYS.TRUCKS, JSON.stringify(sampleTrucks));
      }
      
      if (dumpSitesData && dumpSitesData !== 'null' && dumpSitesData !== 'undefined') {
        try {
          const parsed = JSON.parse(dumpSitesData);
          if (Array.isArray(parsed)) {
            setDumpSites(parsed);
          } else {
            console.error('Dump sites data is not an array, resetting');
            setDumpSites(sampleDumpSites);
            await AsyncStorage.setItem(STORAGE_KEYS.DUMP_SITES, JSON.stringify(sampleDumpSites));
          }
        } catch (e) {
          console.error('Failed to parse dump sites data:', e, 'Data:', dumpSitesData?.substring(0, 100));
          setDumpSites(sampleDumpSites);
          await AsyncStorage.setItem(STORAGE_KEYS.DUMP_SITES, JSON.stringify(sampleDumpSites));
        }
      } else {
        setDumpSites(sampleDumpSites);
        await AsyncStorage.setItem(STORAGE_KEYS.DUMP_SITES, JSON.stringify(sampleDumpSites));
      }
      
      if (yardsData && yardsData !== 'null' && yardsData !== 'undefined') {
        try {
          const parsed = JSON.parse(yardsData);
          if (Array.isArray(parsed)) {
            setYards(parsed);
          } else {
            console.error('Yards data is not an array, resetting');
            setYards(sampleYards);
            await AsyncStorage.setItem(STORAGE_KEYS.YARDS, JSON.stringify(sampleYards));
          }
        } catch (e) {
          console.error('Failed to parse yards data:', e, 'Data:', yardsData?.substring(0, 100));
          setYards(sampleYards);
          await AsyncStorage.setItem(STORAGE_KEYS.YARDS, JSON.stringify(sampleYards));
        }
      } else {
        setYards(sampleYards);
        await AsyncStorage.setItem(STORAGE_KEYS.YARDS, JSON.stringify(sampleYards));
      }
      
      if (customersData && customersData !== 'null' && customersData !== 'undefined') {
        try {
          const parsed = JSON.parse(customersData);
          if (Array.isArray(parsed)) {
            setCustomers(parsed);
          } else {
            console.error('Customers data is not an array, resetting');
            setCustomers(sampleCustomers);
            await AsyncStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(sampleCustomers));
          }
        } catch (e) {
          console.error('Failed to parse customers data:', e, 'Data:', customersData?.substring(0, 100));
          setCustomers(sampleCustomers);
          await AsyncStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(sampleCustomers));
        }
      } else {
        setCustomers(sampleCustomers);
        await AsyncStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(sampleCustomers));
      }
      
      if (jobsData && jobsData !== 'null' && jobsData !== 'undefined') {
        try {
          const parsed = JSON.parse(jobsData);
          if (Array.isArray(parsed)) {
            setJobs(parsed);
          } else {
            console.error('Jobs data is not an array, resetting');
            setJobs([]);
          }
        } catch (e) {
          console.error('Failed to parse jobs data:', e, 'Data:', jobsData?.substring(0, 100));
          setJobs([]);
        }
      }
      
      if (routesData && routesData !== 'null' && routesData !== 'undefined') {
        try {
          const parsed = JSON.parse(routesData);
          if (Array.isArray(parsed)) {
            setRoutes(parsed);
          } else {
            console.error('Routes data is not an array, resetting');
            setRoutes([]);
          }
        } catch (e) {
          console.error('Failed to parse routes data:', e, 'Data:', routesData?.substring(0, 100));
          setRoutes([]);
        }
      }
      
      if (timeLogsData && timeLogsData !== 'null' && timeLogsData !== 'undefined') {
        try {
          const parsed = JSON.parse(timeLogsData);
          if (Array.isArray(parsed)) {
            setTimeLogs(parsed);
          } else {
            console.error('Time logs data is not an array, resetting');
            setTimeLogs([]);
          }
        } catch (e) {
          console.error('Failed to parse time logs data:', e, 'Data:', timeLogsData?.substring(0, 100));
          setTimeLogs([]);
        }
      }
      
      if (dvirsData && dvirsData !== 'null' && dvirsData !== 'undefined') {
        try {
          const parsed = JSON.parse(dvirsData);
          if (Array.isArray(parsed)) {
            setDvirs(parsed);
          } else {
            console.error('DVIRs data is not an array, resetting');
            setDvirs([]);
          }
        } catch (e) {
          console.error('Failed to parse dvirs data:', e, 'Data:', dvirsData?.substring(0, 100));
          setDvirs([]);
        }
      }
      
      if (fuelLogsData && fuelLogsData !== 'null' && fuelLogsData !== 'undefined') {
        try {
          const parsed = JSON.parse(fuelLogsData);
          if (Array.isArray(parsed)) {
            setFuelLogs(parsed);
          } else {
            console.error('Fuel logs data is not an array, resetting');
            setFuelLogs([]);
          }
        } catch (e) {
          console.error('Failed to parse fuel logs data:', e, 'Data:', fuelLogsData?.substring(0, 100));
          setFuelLogs([]);
        }
      }
      
      if (dumpTicketsData && dumpTicketsData !== 'null' && dumpTicketsData !== 'undefined') {
        try {
          const parsed = JSON.parse(dumpTicketsData);
          if (Array.isArray(parsed)) {
            setDumpTickets(parsed);
          } else {
            console.error('Dump tickets data is not an array, resetting');
            setDumpTickets([]);
          }
        } catch (e) {
          console.error('Failed to parse dump tickets data:', e, 'Data:', dumpTicketsData?.substring(0, 100));
          setDumpTickets([]);
        }
      }
      
      if (messagesData && messagesData !== 'null' && messagesData !== 'undefined') {
        try {
          const parsed = JSON.parse(messagesData);
          if (Array.isArray(parsed)) {
            setMessages(parsed);
          } else {
            console.error('Messages data is not an array, resetting');
            setMessages([]);
          }
        } catch (e) {
          console.error('Failed to parse messages data:', e, 'Data:', messagesData?.substring(0, 100));
          setMessages([]);
        }
      }
      
      if (gpsData && gpsData !== 'null' && gpsData !== 'undefined') {
        try {
          const parsed = JSON.parse(gpsData);
          if (Array.isArray(parsed)) {
            setGpsBreadcrumbs(parsed);
          } else {
            console.error('GPS data is not an array, resetting');
            setGpsBreadcrumbs([]);
          }
        } catch (e) {
          console.error('Failed to parse GPS data:', e, 'Data:', gpsData?.substring(0, 100));
          setGpsBreadcrumbs([]);
        }
      }
      
      if (mileageLogsData && mileageLogsData !== 'null' && mileageLogsData !== 'undefined') {
        try {
          const parsed = JSON.parse(mileageLogsData);
          if (Array.isArray(parsed)) {
            setMileageLogs(parsed);
          } else {
            console.error('Mileage logs data is not an array, resetting');
            setMileageLogs([]);
          }
        } catch (e) {
          console.error('Failed to parse mileage logs data:', e, 'Data:', mileageLogsData?.substring(0, 100));
          setMileageLogs([]);
        }
      }
      
      if (settingsData && settingsData !== 'null' && settingsData !== 'undefined') {
        try {
          const parsed = JSON.parse(settingsData);
          setDispatcherSettings(parsed);
        } catch (e) {
          console.error('Failed to parse settings data:', e);
          const defaultSettings: DispatcherSettings = {
            id: 'settings-1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setDispatcherSettings(defaultSettings);
          await AsyncStorage.setItem(STORAGE_KEYS.DISPATCHER_SETTINGS, JSON.stringify(defaultSettings));
        }
      } else {
        const defaultSettings: DispatcherSettings = {
          id: 'settings-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setDispatcherSettings(defaultSettings);
        await AsyncStorage.setItem(STORAGE_KEYS.DISPATCHER_SETTINGS, JSON.stringify(defaultSettings));
      }
      
      if (reportsData && reportsData !== 'null' && reportsData !== 'undefined') {
        try {
          const parsed = JSON.parse(reportsData);
          if (Array.isArray(parsed)) {
            setReports(parsed);
          } else {
            console.error('Reports data is not an array, resetting');
            setReports([]);
          }
        } catch (e) {
          console.error('Failed to parse reports data:', e);
          setReports([]);
        }
      }
      
      if (recurringJobsData && recurringJobsData !== 'null' && recurringJobsData !== 'undefined') {
        try {
          const parsed = JSON.parse(recurringJobsData);
          if (Array.isArray(parsed)) {
            setRecurringJobs(parsed);
          } else {
            console.error('Recurring jobs data is not an array, resetting');
            setRecurringJobs([]);
          }
        } catch (e) {
          console.error('Failed to parse recurring jobs data:', e);
          setRecurringJobs([]);
        }
      }

      console.log('Data loaded successfully');
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      clearTimeout(timeout);
      setIsLoading(false);
    }
  };

  const addDriver = useCallback(async (driver: Driver) => {
    const updated = [...drivers, driver];
    setDrivers(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(updated));
  }, [drivers]);

  const updateDriver = useCallback(async (id: string, updates: Partial<Driver>) => {
    const updated = drivers.map(d => d.id === id ? { ...d, ...updates } : d);
    setDrivers(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(updated));
  }, [drivers]);

  const addTruck = useCallback(async (truck: Truck) => {
    const updated = [...trucks, truck];
    setTrucks(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.TRUCKS, JSON.stringify(updated));
  }, [trucks]);

  const updateTruck = useCallback(async (id: string, updates: Partial<Truck>) => {
    const updated = trucks.map(t => t.id === id ? { ...t, ...updates } : t);
    setTrucks(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.TRUCKS, JSON.stringify(updated));
  }, [trucks]);

  const addCustomer = useCallback(async (customer: Customer) => {
    const updated = [...customers, customer];
    setCustomers(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(updated));
  }, [customers]);

  const addJob = useCallback(async (job: Job) => {
    const updated = [...jobs, job];
    setJobs(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(updated));
  }, [jobs]);

  const updateJob = useCallback(async (id: string, updates: Partial<Job>) => {
    const updated = jobs.map(j => j.id === id ? { ...j, ...updates } : j);
    setJobs(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(updated));
  }, [jobs]);

  const addRoute = useCallback(async (route: Route) => {
    const updated = [...routes, route];
    setRoutes(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.ROUTES, JSON.stringify(updated));
  }, [routes]);

  const updateRoute = useCallback(async (id: string, updates: Partial<Route>) => {
    const updated = routes.map(r => r.id === id ? { ...r, ...updates } : r);
    setRoutes(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.ROUTES, JSON.stringify(updated));
  }, [routes]);

  const addTimeLog = useCallback(async (timeLog: TimeLog) => {
    const updated = [...timeLogs, timeLog];
    setTimeLogs(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.TIME_LOGS, JSON.stringify(updated));
  }, [timeLogs]);

  const addDVIR = useCallback(async (dvir: DVIR) => {
    const updated = [...dvirs, dvir];
    setDvirs(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.DVIRS, JSON.stringify(updated));
  }, [dvirs]);

  const addFuelLog = useCallback(async (fuelLog: FuelLog) => {
    const updated = [...fuelLogs, fuelLog];
    setFuelLogs(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.FUEL_LOGS, JSON.stringify(updated));
  }, [fuelLogs]);

  const addDumpTicket = useCallback(async (dumpTicket: DumpTicket) => {
    const updated = [...dumpTickets, dumpTicket];
    setDumpTickets(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.DUMP_TICKETS, JSON.stringify(updated));
  }, [dumpTickets]);

  const addMessage = useCallback(async (message: Message) => {
    const updated = [...messages, message];
    setMessages(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(updated));
  }, [messages]);

  const addGPSBreadcrumb = useCallback(async (breadcrumb: GPSBreadcrumb) => {
    const updated = [...gpsBreadcrumbs, breadcrumb];
    setGpsBreadcrumbs(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.GPS_BREADCRUMBS, JSON.stringify(updated));
  }, [gpsBreadcrumbs]);

  const addDumpSite = useCallback(async (dumpSite: DumpSite) => {
    const updated = [...dumpSites, dumpSite];
    setDumpSites(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.DUMP_SITES, JSON.stringify(updated));
  }, [dumpSites]);

  const addYard = useCallback(async (yard: Yard) => {
    const updated = [...yards, yard];
    setYards(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.YARDS, JSON.stringify(updated));
  }, [yards]);

  const deleteDriver = useCallback(async (id: string) => {
    const updated = drivers.filter(d => d.id !== id);
    setDrivers(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(updated));
  }, [drivers]);

  const deleteTruck = useCallback(async (id: string) => {
    const updated = trucks.filter(t => t.id !== id);
    setTrucks(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.TRUCKS, JSON.stringify(updated));
  }, [trucks]);

  const deleteCustomer = useCallback(async (id: string) => {
    const updated = customers.filter(c => c.id !== id);
    setCustomers(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(updated));
  }, [customers]);

  const deleteJob = useCallback(async (id: string) => {
    const updated = jobs.filter(j => j.id !== id);
    setJobs(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(updated));
  }, [jobs]);

  const deleteRoute = useCallback(async (id: string) => {
    const updated = routes.filter(r => r.id !== id);
    setRoutes(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.ROUTES, JSON.stringify(updated));
  }, [routes]);

  const deleteDumpSite = useCallback(async (id: string) => {
    const updated = dumpSites.filter(d => d.id !== id);
    setDumpSites(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.DUMP_SITES, JSON.stringify(updated));
  }, [dumpSites]);

  const deleteYard = useCallback(async (id: string) => {
    const updated = yards.filter(y => y.id !== id);
    setYards(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.YARDS, JSON.stringify(updated));
  }, [yards]);

  const addMileageLog = useCallback(async (mileageLog: MileageLog) => {
    const updated = [...mileageLogs, mileageLog];
    setMileageLogs(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.MILEAGE_LOGS, JSON.stringify(updated));
  }, [mileageLogs]);

  const updateDispatcherSettings = useCallback(async (updates: Partial<DispatcherSettings>) => {
    const updated: DispatcherSettings = {
      ...dispatcherSettings,
      ...updates,
      id: dispatcherSettings?.id || 'settings-1',
      createdAt: dispatcherSettings?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setDispatcherSettings(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.DISPATCHER_SETTINGS, JSON.stringify(updated));
  }, [dispatcherSettings]);

  const updateCustomer = useCallback(async (id: string, updates: Partial<Customer>) => {
    const updated = customers.map(c => c.id === id ? { ...c, ...updates } : c);
    setCustomers(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(updated));
  }, [customers]);

  const updateDumpSite = useCallback(async (id: string, updates: Partial<DumpSite>) => {
    const updated = dumpSites.map(d => d.id === id ? { ...d, ...updates } : d);
    setDumpSites(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.DUMP_SITES, JSON.stringify(updated));
  }, [dumpSites]);

  const updateYard = useCallback(async (id: string, updates: Partial<Yard>) => {
    const updated = yards.map(y => y.id === id ? { ...y, ...updates } : y);
    setYards(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.YARDS, JSON.stringify(updated));
  }, [yards]);

  const addReport = useCallback(async (report: Report) => {
    const updated = [...reports, report];
    setReports(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(updated));
  }, [reports]);

  const updateReport = useCallback(async (id: string, updates: Partial<Report>) => {
    const updated = reports.map(r => r.id === id ? { ...r, ...updates } : r);
    setReports(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(updated));
  }, [reports]);

  const deleteReport = useCallback(async (id: string) => {
    const updated = reports.filter(r => r.id !== id);
    setReports(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(updated));
  }, [reports]);

  const addRecurringJob = useCallback(async (recurringJob: RecurringJob) => {
    const updated = [...recurringJobs, recurringJob];
    setRecurringJobs(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.RECURRING_JOBS, JSON.stringify(updated));
  }, [recurringJobs]);

  const updateRecurringJob = useCallback(async (id: string, updates: Partial<RecurringJob>) => {
    const updated = recurringJobs.map(rj => rj.id === id ? { ...rj, ...updates } : rj);
    setRecurringJobs(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.RECURRING_JOBS, JSON.stringify(updated));
  }, [recurringJobs]);

  const deleteRecurringJob = useCallback(async (id: string) => {
    const updated = recurringJobs.filter(rj => rj.id !== id);
    setRecurringJobs(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.RECURRING_JOBS, JSON.stringify(updated));
  }, [recurringJobs]);

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
    isLoading,
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
    timeLogs, dvirs, fuelLogs, dumpTickets, messages, gpsBreadcrumbs, mileageLogs, dispatcherSettings, reports, recurringJobs, isLoading,
    addDriver, updateDriver, deleteDriver, addTruck, updateTruck, deleteTruck,
    addCustomer, updateCustomer, deleteCustomer, addJob, updateJob, deleteJob,
    addRoute, updateRoute, deleteRoute, addTimeLog, addDVIR, addFuelLog,
    addDumpTicket, addMessage, addGPSBreadcrumb, addDumpSite, updateDumpSite,
    deleteDumpSite, addYard, updateYard, deleteYard, addMileageLog, updateDispatcherSettings,
    addReport, updateReport, deleteReport, addRecurringJob, updateRecurringJob, deleteRecurringJob
  ]);
});
