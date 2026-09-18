import React, { createContext, useContext, useState } from 'react';
import type { ThemeConfig, TypographyConfig } from '../types';
import { StorageService } from '../services/storage';

export const THEME_PRESETS: Record<string, ThemeConfig> = {
  classroom: {
    id: 'classroom',
    name: 'Classroom',
    bg: '#ffffff',
    hindiText: '#1c1917',
    pronunciationText: '#0284c7', // vibrant blue
    englishText: '#44403c',
    highlightBg: '#fef08a', // warm yellow
    highlightText: '#854d0e',
    inactiveText: '#78716c',
    previousText: '#a8a29e',
    secondary: '#94a3b8',
    progressBar: '#0284c7',
    divider: '#e2e8f0',
    highlightStyle: 'background',
    highlightOpacity: 1.0,
    highlightBorderRadius: 6,
    highlightPaddingX: 8,
    highlightPaddingY: 4,
  },
  paper: {
    id: 'paper',
    name: 'Paper',
    bg: '#fbfaf7',
    hindiText: '#292524',
    pronunciationText: '#b45309', // amber
    englishText: '#57534e',
    highlightBg: '#fed7aa', // light orange
    highlightText: '#7c2d12',
    inactiveText: '#857f79',
    previousText: '#aba59e',
    secondary: '#a8a29e',
    progressBar: '#b45309',
    divider: '#e7e5e4',
    highlightStyle: 'pill',
    highlightOpacity: 0.9,
    highlightBorderRadius: 9999,
    highlightPaddingX: 10,
    highlightPaddingY: 4,
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    bg: '#ffffff',
    hindiText: '#0f172a',
    pronunciationText: '#475569',
    englishText: '#334155',
    highlightBg: '#e2e8f0',
    highlightText: '#0f172a',
    inactiveText: '#94a3b8',
    previousText: '#cbd5e1',
    secondary: '#94a3b8',
    progressBar: '#0f172a',
    divider: '#f1f5f9',
    highlightStyle: 'underline',
    highlightOpacity: 1.0,
    highlightBorderRadius: 4,
    highlightPaddingX: 4,
    highlightPaddingY: 2,
  },
  warm: {
    id: 'warm',
    name: 'Warm',
    bg: '#fffbeb',
    hindiText: '#451a03',
    pronunciationText: '#d97706',
    englishText: '#78350f',
    highlightBg: '#fde68a',
    highlightText: '#78350f',
    inactiveText: '#a16207',
    previousText: '#ca8a04',
    secondary: '#d97706',
    progressBar: '#d97706',
    divider: '#fef3c7',
    highlightStyle: 'background',
    highlightOpacity: 1.0,
    highlightBorderRadius: 8,
    highlightPaddingX: 8,
    highlightPaddingY: 4,
  },
  softBlue: {
    id: 'softBlue',
    name: 'Soft Blue',
    bg: '#f0f9ff',
    hindiText: '#082f49',
    pronunciationText: '#0284c7',
    englishText: '#0c4a6e',
    highlightBg: '#bae6fd',
    highlightText: '#0369a1',
    inactiveText: '#7dd3fc',
    previousText: '#bae6fd',
    secondary: '#38bdf8',
    progressBar: '#0284c7',
    divider: '#e0f2fe',
    highlightStyle: 'pill',
    highlightOpacity: 1.0,
    highlightBorderRadius: 20,
    highlightPaddingX: 10,
    highlightPaddingY: 4,
  },
  softGreen: {
    id: 'softGreen',
    name: 'Soft Green',
    bg: '#f0fdf4',
    hindiText: '#052e16',
    pronunciationText: '#16a34a',
    englishText: '#14532d',
    highlightBg: '#bbf7d0',
    highlightText: '#15803d',
    inactiveText: '#86efac',
    previousText: '#bbf7d0',
    secondary: '#4ade80',
    progressBar: '#16a34a',
    divider: '#dcfce7',
    highlightStyle: 'glow',
    highlightOpacity: 1.0,
    highlightBorderRadius: 6,
    highlightPaddingX: 8,
    highlightPaddingY: 4,
  },
  dark: {
    id: 'dark',
    name: 'Dark',
    bg: '#18181b',
    hindiText: '#f4f4f5',
    pronunciationText: '#38bdf8',
    englishText: '#d4d4d8',
    highlightBg: '#3f3f46',
    highlightText: '#facc15', // bright yellow text
    inactiveText: '#71717a',
    previousText: '#52525b',
    secondary: '#a1a1aa',
    progressBar: '#facc15',
    divider: '#27272a',
    highlightStyle: 'background',
    highlightOpacity: 0.9,
    highlightBorderRadius: 6,
    highlightPaddingX: 8,
    highlightPaddingY: 4,
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight',
    bg: '#090d16',
    hindiText: '#f8fafc',
    pronunciationText: '#818cf8',
    englishText: '#cbd5e1',
    highlightBg: '#1e293b',
    highlightText: '#38bdf8',
    inactiveText: '#475569',
    previousText: '#334155',
    secondary: '#64748b',
    progressBar: '#818cf8',
    divider: '#1e293b',
    highlightStyle: 'glow',
    highlightOpacity: 1.0,
    highlightBorderRadius: 8,
    highlightPaddingX: 10,
    highlightPaddingY: 4,
  },
  highContrast: {
    id: 'highContrast',
    name: 'High Contrast',
    bg: '#000000',
    hindiText: '#ffffff',
    pronunciationText: '#00ffff', // cyan
    englishText: '#ffffff',
    highlightBg: '#ffff00', // pure yellow
    highlightText: '#000000', // black text on yellow
    inactiveText: '#888888',
    previousText: '#555555',
    secondary: '#aaaaaa',
    progressBar: '#ffff00',
    divider: '#333333',
    highlightStyle: 'background',
    highlightOpacity: 1.0,
    highlightBorderRadius: 0,
    highlightPaddingX: 8,
    highlightPaddingY: 4,
  },
};

export const DEFAULT_TYPOGRAPHY: TypographyConfig = {
  hindi: {
    fontFamily: "'Noto Sans Devanagari', sans-serif",
    fontSize: 38,
    fontWeight: 600,
    lineHeight: 1.6,
    letterSpacing: 0,
  },
  pronunciation: {
    fontFamily: "'Noto Sans Devanagari', sans-serif",
    fontSize: 32,
    fontWeight: 500,
    lineHeight: 1.5,
    letterSpacing: 0,
  },
  english: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 26,
    fontWeight: 500,
    lineHeight: 1.5,
    letterSpacing: 0,
  },
};

interface ThemeContextType {
  theme: ThemeConfig;
  customThemes: ThemeConfig[];
  typography: TypographyConfig;
  setTheme: (theme: ThemeConfig) => void;
  applyPreset: (presetId: string) => void;
  saveCustomTheme: (theme: ThemeConfig) => void;
  deleteCustomTheme: (id: string) => void;
  updateThemeProp: <K extends keyof ThemeConfig>(key: K, value: ThemeConfig[K]) => void;
  setTypography: (typography: TypographyConfig) => void;
  updateTypographyProp: (layer: 'hindi' | 'pronunciation' | 'english', key: string, value: any) => void;
  editorThemeMode: 'light' | 'dark' | 'system';
  setEditorThemeMode: (mode: 'light' | 'dark' | 'system') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeConfig>(() =>
    StorageService.loadTheme(THEME_PRESETS.classroom)
  );
  const [customThemes, setCustomThemes] = useState<ThemeConfig[]>(() =>
    StorageService.loadCustomThemes()
  );
  const [typography, setTypographyState] = useState<TypographyConfig>(() =>
    StorageService.loadTypography(DEFAULT_TYPOGRAPHY)
  );
  const [editorThemeMode, setEditorThemeMode] = useState<'light' | 'dark' | 'system'>('system');

  const setTheme = (newTheme: ThemeConfig) => {
    setThemeState(newTheme);
    StorageService.saveTheme(newTheme);
  };

  const applyPreset = (presetId: string) => {
    if (THEME_PRESETS[presetId]) {
      setTheme(THEME_PRESETS[presetId]);
    } else {
      const found = customThemes.find((t) => t.id === presetId);
      if (found) setTheme(found);
    }
  };

  const saveCustomTheme = (newTheme: ThemeConfig) => {
    const updated = [...customThemes.filter((t) => t.id !== newTheme.id), newTheme];
    setCustomThemes(updated);
    StorageService.saveCustomThemes(updated);
    setTheme(newTheme);
  };

  const deleteCustomTheme = (id: string) => {
    const updated = customThemes.filter((t) => t.id !== id);
    setCustomThemes(updated);
    StorageService.saveCustomThemes(updated);
    if (theme.id === id) {
      setTheme(THEME_PRESETS.classroom);
    }
  };

  const updateThemeProp = <K extends keyof ThemeConfig>(key: K, value: ThemeConfig[K]) => {
    const updated = { ...theme, [key]: value };
    setTheme(updated);
  };

  const setTypography = (newTypo: TypographyConfig) => {
    setTypographyState(newTypo);
    StorageService.saveTypography(newTypo);
  };

  const updateTypographyProp = (layer: 'hindi' | 'pronunciation' | 'english', key: string, value: any) => {
    const updated = {
      ...typography,
      [layer]: {
        ...typography[layer],
        [key]: value,
      },
    };
    setTypography(updated);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        customThemes,
        typography,
        setTheme,
        applyPreset,
        saveCustomTheme,
        deleteCustomTheme,
        updateThemeProp,
        setTypography,
        updateTypographyProp,
        editorThemeMode,
        setEditorThemeMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
