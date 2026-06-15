import { useState, useCallback } from 'react';

export interface AppSettings {
  captureDelay: number; // 1, 2, or 3 seconds
  jpegQuality: number; // 0.85, 0.95, or 1.0
  mirrorSavedPhoto: boolean;
}

const STORAGE_KEY = 'snapface_settings';

const defaultSettings: AppSettings = {
  captureDelay: 3,
  jpegQuality: 0.85,
  mirrorSavedPhoto: false,
};

function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...defaultSettings, ...JSON.parse(stored) };
  } catch { /* ignore */ }
  return defaultSettings;
}

export const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { settings, updateSetting };
};
