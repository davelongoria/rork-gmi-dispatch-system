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

  useEffect(() => {
    loadUser();
    loadDrivers();
  }, []);

  const loadUser = async () => {
    const timeout = setTimeout(() => {
      console.warn('Auth loading timeout, continuing anyway');
      setIsLoading(false);
    }, 800);

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

  const loadDrivers = async () => {
    try {
      const stored = await AsyncStorage.getItem(DRIVERS_STORAGE_KEY);
      if (stored && stored !== 'null' && stored !== 'undefined') {
        try {
          setDrivers(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse drivers data:', e);
        }
      }
    } catch (error) {
      console.error('Failed to load drivers:', error);
    }
  };

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      if (email === 'dispatcher@gmi.com') {
        const mockUser: User = {
          id: 'disp-1',
          email,
          name: 'John Dispatcher',
          role: 'DISPATCHER',
          phone: '555-0100',
          createdAt: new Date().toISOString(),
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
        setUser(mockUser);
        return true;
      }
      
      const driver = drivers.find(d => d.email === email);
      if (driver) {
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
      console.error('Login failed:', error);
      return false;
    }
  }, [drivers]);

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
