import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback } from 'react';
import type { User, Driver } from '@/types';

const STORAGE_KEY = '@gmi_auth_user';
const DRIVERS_STORAGE_KEY = '@gmi_drivers';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  const loadUser = async () => {
    console.log('[AUTH_CONTEXT] Loading user...');
    const timeout = setTimeout(() => {
      console.warn('[AUTH_CONTEXT] Auth loading timeout, continuing anyway');
      setIsLoading(false);
    }, 2000);

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      console.log('[AUTH_CONTEXT] AsyncStorage user data:', stored ? 'Found' : 'Not found');
      if (stored && stored !== 'null' && stored !== 'undefined') {
        try {
          const user = JSON.parse(stored);
          console.log('[AUTH_CONTEXT] User loaded:', user.name, user.role);
          setUser(user);
        } catch (e) {
          console.error('[AUTH_CONTEXT] Failed to parse user data:', e);
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      } else {
        console.log('[AUTH_CONTEXT] No stored user found');
      }
    } catch (error) {
      console.error('[AUTH_CONTEXT] Failed to load user:', error);
    } finally {
      clearTimeout(timeout);
      console.log('[AUTH_CONTEXT] Loading complete, setting isLoading = false');
      setIsLoading(false);
    }
  };

  const loadDrivers = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(DRIVERS_STORAGE_KEY);
      if (stored && stored !== 'null' && stored !== 'undefined') {
        try {
          const parsed = JSON.parse(stored);
          setDrivers(parsed);
        } catch (e) {
        }
      }
    } catch (error) {
    }
  }, []);

  useEffect(() => {
    console.log('[AUTH_CONTEXT] Initializing...');
    loadUser();
    loadDrivers();

    const interval = setInterval(() => {
      loadDrivers();
    }, 5000);

    return () => clearInterval(interval);
  }, [loadDrivers]);

  const login = useCallback(async (usernameOrEmail: string, password: string): Promise<boolean> => {
    try {
      
      if (usernameOrEmail === 'admin' && password === 'pass') {
        const mockUser: User = {
          id: 'admin-1',
          email: 'admin@gmi.com',
          name: 'Admin User',
          role: 'MANAGER',
          phone: '555-0999',
          createdAt: new Date().toISOString(),
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
        setUser(mockUser);
        return true;
      }
      
      if (usernameOrEmail === 'dispatcher@gmi.com' || usernameOrEmail === 'dispatcher') {
        const mockUser: User = {
          id: 'disp-1',
          email: 'dispatcher@gmi.com',
          name: 'Dispatcher',
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
        } catch (e) {
        }
      }
      
      const driver = currentDrivers.find((d: Driver) => 
        (d.email?.toLowerCase() === usernameOrEmail.toLowerCase() || 
         d.username?.toLowerCase() === usernameOrEmail.toLowerCase()) &&
        d.active
      );
      
      if (driver) {
        
        if (driver.password && driver.password.trim() !== '') {
          if (driver.password !== password) {
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
      
      return false;
    } catch (error) {
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
                name: 'Dispatcher',
                role: 'DISPATCHER',
                phone: '555-0100',
                createdAt: new Date().toISOString(),
              };
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
              setUser(mockUser);
              return true;
            }
          } catch (e) {
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
      return false;
    }
  }, [drivers]);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setUser(null);
    } catch (error) {
    }
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isDispatcher: user?.role === 'DISPATCHER',
    isDriver: user?.role === 'DRIVER',
    isManager: user?.role === 'MANAGER',
    login,
    loginWithQR,
    logout,
  };
});
