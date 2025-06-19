import { createContext, useState, useEffect, useContext, ReactNode } from 'react';

interface VoiceSettings {
  activationPhrase: string;
  language: string;
  autoSave: boolean;
  enableVoiceCommands: boolean;
}

interface SettingsContextType {
  voiceSettings: VoiceSettings;
  updateVoiceSettings: (settings: Partial<VoiceSettings>) => void;
  cloudSyncEnabled: boolean;
  setCloudSyncEnabled: (enabled: boolean) => void;
  darkMode: boolean;
  setDarkMode: (enabled: boolean) => void;
}

const defaultVoiceSettings: VoiceSettings = {
  activationPhrase: 'note master',
  language: 'en-US',
  autoSave: true,
  enableVoiceCommands: true,
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  // Load settings from localStorage or use defaults
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => {
    const savedSettings = localStorage.getItem('voiceSettings');
    return savedSettings ? JSON.parse(savedSettings) : defaultVoiceSettings;
  });
  
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('cloudSyncEnabled');
    return saved ? JSON.parse(saved) : true;
  });
  
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : true;
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('voiceSettings', JSON.stringify(voiceSettings));
  }, [voiceSettings]);

  useEffect(() => {
    localStorage.setItem('cloudSyncEnabled', JSON.stringify(cloudSyncEnabled));
  }, [cloudSyncEnabled]);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    // Apply dark mode to the document
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const updateVoiceSettings = (newSettings: Partial<VoiceSettings>) => {
    setVoiceSettings(prev => ({ ...prev, ...newSettings }));
  };

  const value = {
    voiceSettings,
    updateVoiceSettings,
    cloudSyncEnabled,
    setCloudSyncEnabled,
    darkMode,
    setDarkMode,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}