import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import type { User, Driver } from '@/types';

const STORAGE_KEY = '@gmi_auth_user';
const DRIVERS_STORAGE_KEY = '@gmi_drivers';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  const loadUser = async () => {
    const timeout = setTimeout(() => {
      console.warn('Auth loading timeout, continuing anyway');
      setIsLoading(false);
    }, 300);

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored && stored !== 'null' && stored !== 'undefined') {
        try {
          setUser(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse user data:', e);
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      clearTimeout(timeout);
      setIsLoading(false);
    }
  };

  const loadDrivers = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(DRIVERS_STORAGE_KEY);
      if (stored && stored !== 'null' && stored !== 'undefined') {
        try {
          const parsed = JSON.parse(stored);
          console.log('Loaded drivers:', parsed.length, 'drivers');
          parsed.forEach((d: Driver) => {
            console.log(`- ${d.name}: email=${d.email}, username=${d.username}, active=${d.active}`);
          });
          setDrivers(parsed);
        } catch (e) {
          console.error('Failed to parse drivers data:', e);
        }
      } else {
        console.log('No drivers found in storage');
      }
    } catch (error) {
      console.error('Failed to load drivers:', error);
    }
  }, []);

  useEffect(() => {
    loadUser();
    loadDrivers();

    const interval = setInterval(() => {
      loadDrivers();
    }, 2000);

    return () => clearInterval(interval);
  }, [loadDrivers]);

  const login = useCallback(async (usernameOrEmail: string, password: string): Promise<boolean> => {
    try {
      console.log(`Login attempt for: ${usernameOrEmail}`);
      
      if (usernameOrEmail === 'dispatcher@gmi.com' || usernameOrEmail === 'dispatcher') {
        const mockUser: User = {
          id: 'disp-1',
          email: 'dispatcher@gmi.com',
          name: 'John Dispatcher',
          role: 'DISPATCHER',
          phone: '555-0100',
          createdAt: new Date().toISOString(),
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
        setUser(mockUser);
        return true;
      }
      
      const stored = await AsyncStorage.getItem(DRIVERS_STORAGE_KEY);
      let currentDrivers: Driver[] = [];
      if (stored && stored !== 'null' && stored !== 'undefined') {
        try {
          currentDrivers = JSON.parse(stored);
          console.log(`Loaded ${currentDrivers.length} drivers from storage`);
        } catch (e) {
          console.error('Failed to parse drivers during login:', e);
        }
      } else {
        console.log('No drivers found in storage');
      }
      
      console.log(`Checking against ${currentDrivers.length} drivers`);
      currentDrivers.forEach(d => {
        console.log(`- ${d.name}: email=${d.email}, username=${d.username}, password=${d.password ? '***' : 'none'}, active=${d.active}`);
      });
      
      const driver = currentDrivers.find((d: Driver) => 
        (d.email?.toLowerCase() === usernameOrEmail.toLowerCase() || 
         d.username?.toLowerCase() === usernameOrEmail.toLowerCase()) &&
        d.active
      );
      
      if (driver) {
        console.log(`Found driver: ${driver.name}`);
        if (driver.password) {
          if (driver.password !== password) {
            console.log(`Password mismatch for driver ${driver.name}. Expected: ${driver.password}, Got: ${password}`);
            return false;
          }
        }
        
        const mockUser: User = {
          id: driver.id,
          email: driver.email,
          name: driver.name,
          role: 'DRIVER',
          phone: driver.phone,
          createdAt: new Date().toISOString(),
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
        setUser(mockUser);
        return true;
      }
      
      console.log(`No active driver found with email/username: ${usernameOrEmail}`);
      console.log('Available drivers:', currentDrivers.map((d: Driver) => `${d.name} (${d.email}/${d.username})`).join(', '));
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }, []);

  const loginWithQR = useCallback(async (qrToken: string): Promise<boolean> => {
    try {
      if (qrToken.startsWith('DISPATCHER-')) {
        const dispatcherSettingsStored = await AsyncStorage.getItem('@gmi_dispatcher_settings');
        if (dispatcherSettingsStored) {
          try {
            const settings = JSON.parse(dispatcherSettingsStored);
            if (settings.qrToken === qrToken) {
              const mockUser: User = {
                id: 'disp-1',
                email: 'dispatcher@gmi.com',
                name: 'John Dispatcher',
                role: 'DISPATCHER',
                phone: '555-0100',
                createdAt: new Date().toISOString(),
              };
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
              setUser(mockUser);
              return true;
            }
          } catch (e) {
            console.error('Failed to parse dispatcher settings:', e);
          }
        }
      }
      
      const driver = drivers.find(d => d.qrToken === qrToken);
      if (driver && driver.active) {
        const mockUser: User = {
          id: driver.id,
          email: driver.email,
          name: driver.name,
          role: 'DRIVER',
          phone: driver.phone,
          createdAt: new Date().toISOString(),
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
        setUser(mockUser);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('QR Login failed:', error);
      return false;
    }
  }, [drivers]);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, []);

  return useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    isDispatcher: user?.role === 'DISPATCHER',
    isDriver: user?.role === 'DRIVER',
    isManager: user?.role === 'MANAGER',
    login,
    loginWithQR,
    logout,
  }), [user, isLoading, login, loginWithQR, logout]);
});
