import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback } from 'react';
import { THEMES, CompanyTheme } from '@/constants/themes';
import type { Company } from '@/types';

const THEME_STORAGE_KEY = '@app_selected_company';

function companyToTheme(company: Company): CompanyTheme {
  return {
    id: company.id as any,
    name: company.name,
    logo: company.logo,
    colors: {
      primary: company.primaryColor,
      secondary: company.secondaryColor || '#2C2C2E',
      accent: company.accentColor || company.primaryColor,
      success: '#34C759',
      error: '#FF3B30',
      danger: '#FF3B30',
      warning: '#FFA500',
      background: '#FFFFFF',
      backgroundSecondary: '#F2F2F7',
      text: '#000000',
      textSecondary: '#8E8E93',
      border: '#E5E5EA',
      card: '#FFFFFF',
      shadow: 'rgba(0, 0, 0, 0.1)',
    },
  };
}

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    console.log('[THEME_CONTEXT] Initializing...');
    loadData();
  }, []);

  const loadData = async () => {
    console.log('[THEME_CONTEXT] Loading theme data...');
    try {
      const [selectedId, companiesData] = await Promise.all([
        AsyncStorage.getItem(THEME_STORAGE_KEY),
        AsyncStorage.getItem('@gmi_companies'),
      ]);
      console.log('[THEME_CONTEXT] AsyncStorage data loaded:', { selectedId, hasCompaniesData: !!companiesData });
      
      if (companiesData && companiesData !== 'null' && companiesData !== 'undefined') {
        try {
          const parsed = JSON.parse(companiesData);
          if (Array.isArray(parsed)) {
            setCompanies(parsed);
          }
        } catch (e) {
          console.error('Failed to parse companies:', e);
        }
      }
      
      if (selectedId && selectedId !== 'null' && selectedId !== 'undefined') {
        setSelectedCompanyId(selectedId);
      }
    } catch (error) {
      console.error('[THEME_CONTEXT] Failed to load theme data:', error);
    } finally {
      console.log('[THEME_CONTEXT] Loading complete, setting isLoading = false');
      setIsLoading(false);
    }
  };

  const selectCompany = useCallback(async (companyId: string) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, companyId);
      setSelectedCompanyId(companyId);
    } catch (error) {
      console.error('Failed to save selected company:', error);
    }
  }, []);

  const clearCompanySelection = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(THEME_STORAGE_KEY);
      setSelectedCompanyId(null);
    } catch (error) {
      console.error('Failed to clear company selection:', error);
    }
  }, []);

  const builtInCompanies = Object.values(THEMES).map(t => ({
    id: t.id,
    name: t.name,
    logo: t.logo,
    primaryColor: t.colors.primary,
    secondaryColor: t.colors.secondary,
    accentColor: t.colors.accent,
    active: true,
    createdAt: new Date().toISOString(),
  }));
  const availableCompanies = [...builtInCompanies, ...companies.filter(c => c.active)];

  const selectedCompany = availableCompanies.find(c => c.id === selectedCompanyId) || availableCompanies[0];

  let theme: CompanyTheme = THEMES.gmi;
  if (selectedCompany) {
    if (selectedCompany.id === 'gmi') {
      theme = THEMES.gmi;
    } else if (selectedCompany.id === 'region') {
      theme = THEMES.region;
    } else {
      theme = companyToTheme(selectedCompany);
    }
  }

  return {
    selectedCompanyId,
    selectedCompany,
    availableCompanies,
    theme,
    isLoading,
    selectCompany,
    clearCompanySelection,
  };
});
