
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { audioService } from '../services/audioService';

export type TextSize = 'base' | 'lg' | 'xl' | '2xl';

interface AccessibilitySettings {
  textSize: TextSize;
  highContrast: boolean;
  reducedMotion: boolean;
  soundEnabled: boolean;
}

interface AccessibilityContextType extends AccessibilitySettings {
  updateSetting: <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => void;
  playClick: () => void;
  playSuccess: () => void;
  playError: () => void;
  playScanComplete: () => void;
  announce: (message: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const DEFAULT_SETTINGS: AccessibilitySettings = {
  textSize: 'base',
  highContrast: false,
  reducedMotion: false,
  soundEnabled: true,
};

export const AccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
      try {
          const stored = localStorage.getItem('skincare_accessibility');
          return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
      } catch {
          return DEFAULT_SETTINGS;
      }
  });

  // Announcer element ref
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    localStorage.setItem('skincare_accessibility', JSON.stringify(settings));
    audioService.setEnabled(settings.soundEnabled);
    
    // Apply settings to document
    const root = document.documentElement;
    const body = document.body;

    // Text Size
    root.classList.remove('text-size-lg', 'text-size-xl', 'text-size-2xl');
    if (settings.textSize !== 'base') {
        root.classList.add(`text-size-${settings.textSize}`);
    }

    // High Contrast
    if (settings.highContrast) {
        body.classList.add('high-contrast');
    } else {
        body.classList.remove('high-contrast');
    }

    // Reduced Motion
    if (settings.reducedMotion) {
        body.classList.add('reduced-motion');
    } else {
        body.classList.remove('reduced-motion');
    }

  }, [settings]);

  const updateSetting = <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    if (key === 'soundEnabled' && value === true) {
        // Test sound when enabling
        audioService.setEnabled(true);
        audioService.playClick();
    }
  };

  const playClick = () => { if(settings.soundEnabled) audioService.playClick(); };
  const playSuccess = () => { if(settings.soundEnabled) audioService.playSuccess(); };
  const playError = () => { if(settings.soundEnabled) audioService.playError(); };
  const playScanComplete = () => { if(settings.soundEnabled) audioService.playScanComplete(); };
  
  const announce = (message: string) => {
      setAnnouncement(message);
      // Clear after a moment so the same message can be announced again if needed
      setTimeout(() => setAnnouncement(''), 3000);
  };

  return (
    <AccessibilityContext.Provider value={{
        ...settings,
        updateSetting,
        playClick,
        playSuccess,
        playError,
        playScanComplete,
        announce
    }}>
      {children}
      {/* Screen Reader Live Region */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        {announcement}
      </div>
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
