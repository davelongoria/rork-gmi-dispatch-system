import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { THEMES, CompanyTheme } from '@/constants/themes';

const THEME_STORAGE_KEY = '@app_selected_company';

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const [selectedCompany, setSelectedCompany] = useState<'gmi' | 'region' | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadSelectedCompany();
  }, []);

  const loadSelectedCompany = async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'gmi' || stored === 'region') {
        setSelectedCompany(stored);
      }
    } catch (error) {
      console.error('Failed to load selected company:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectCompany = useCallback(async (companyId: 'gmi' | 'region') => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, companyId);
      setSelectedCompany(companyId);
    } catch (error) {
      console.error('Failed to save selected company:', error);
    }
  }, []);

  const clearCompanySelection = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(THEME_STORAGE_KEY);
      setSelectedCompany(null);
    } catch (error) {
      console.error('Failed to clear company selection:', error);
    }
  }, []);

  const theme: CompanyTheme = selectedCompany ? THEMES[selectedCompany] : THEMES.gmi;

  return useMemo(() => ({
    selectedCompany,
    theme,
    isLoading,
    selectCompany,
    clearCompanySelection,
  }), [selectedCompany, theme, isLoading, selectCompany, clearCompanySelection]);
});
