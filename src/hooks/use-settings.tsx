import { useState, useEffect, useCallback } from 'react';
import { GameSettings } from '~/components/settings';

const defaultSettings: GameSettings = {
  masterVolume: 70,
  musicVolume: 60,
  sfxVolume: 80,
  pixelArtMode: true,
  showFPS: false,
  fullscreen: false,
  difficulty: 'normal',
  autoSave: true,
  showHealthBars: true,
  showMinimap: false,
  movementSpeed: 1.0,
  attackCooldown: 500,
};

export const useSettings = () => {
  const [settings, setSettings] = useState<GameSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('ddungeon-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save settings to localStorage
  const saveSettings = useCallback((newSettings: GameSettings) => {
    localStorage.setItem('ddungeon-settings', JSON.stringify(newSettings));
    setSettings(newSettings);
  }, []);

  // Update a specific setting
  const updateSetting = useCallback(<K extends keyof GameSettings>(
    key: K,
    value: GameSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('ddungeon-settings', JSON.stringify(newSettings));
  }, [settings]);

  // Reset to default settings
  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    localStorage.setItem('ddungeon-settings', JSON.stringify(defaultSettings));
  }, []);

  // Get setting value
  const getSetting = useCallback(<K extends keyof GameSettings>(key: K): GameSettings[K] => {
    return settings[key];
  }, [settings]);

  return {
    settings,
    isLoaded,
    saveSettings,
    updateSetting,
    resetSettings,
    getSetting,
  };
};
