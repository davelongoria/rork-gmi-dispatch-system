export type CompanyTheme = {
  id: 'gmi' | 'region';
  name: string;
  logo: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    error: string;
    danger: string;
    warning: string;
    background: string;
    backgroundSecondary: string;
    text: string;
    textSecondary: string;
    border: string;
    card: string;
    shadow: string;
  };
};

export const GMI_THEME: CompanyTheme = {
  id: 'gmi',
  name: 'GMI Services',
  logo: 'https://images.unsplash.com/photo-1618172193622-ae2d025f4032?w=400&h=200&fit=crop',
  colors: {
    primary: '#B00000',
    secondary: '#2C2C2E',
    accent: '#FFA500',
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

export const REGION_THEME: CompanyTheme = {
  id: 'region',
  name: 'Region Services',
  logo: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/sji9cdn2idmxjy87ciqsk',
  colors: {
    primary: '#2E3B82',
    secondary: '#1A1A1A',
    accent: '#4A5FAB',
    success: '#34C759',
    error: '#FF3B30',
    danger: '#FF3B30',
    warning: '#FFA500',
    background: '#FFFFFF',
    backgroundSecondary: '#F5F6FA',
    text: '#000000',
    textSecondary: '#6B7280',
    border: '#D1D5DB',
    card: '#FFFFFF',
    shadow: 'rgba(46, 59, 130, 0.1)',
  },
};

export const THEMES: Record<'gmi' | 'region', CompanyTheme> = {
  gmi: GMI_THEME,
  region: REGION_THEME,
};
