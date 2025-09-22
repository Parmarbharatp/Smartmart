import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { locationTrackingService, type LocationTrackingState, type LocationTrackingConfig } from '../services/locationTracking';

interface LocationTrackingContextType {
  state: LocationTrackingState;
  config: LocationTrackingConfig;
  startTracking: () => Promise<boolean>;
  stopTracking: () => void;
  updateLocationNow: () => Promise<boolean>;
  updateConfig: (newConfig: Partial<LocationTrackingConfig>) => void;
  requestPermission: () => Promise<boolean>;
  getLastKnownLocation: () => Promise<void>;
  syncPreferencesWithBackend: () => Promise<void>;
  savePreferencesToBackend: () => Promise<void>;
  isSupported: boolean;
}

const LocationTrackingContext = createContext<LocationTrackingContextType | undefined>(undefined);

export function LocationTrackingProvider({ children }: { children: React.ReactNode }) {
  console.log('LocationTrackingProvider: Initializing...');
  const [state, setState] = useState<LocationTrackingState>(() => {
    try {
      return locationTrackingService.getState();
    } catch (error) {
      console.error('LocationTrackingProvider: Error getting initial state:', error);
      return {
        isTracking: false,
        lastUpdate: null,
        lastKnownLocation: null,
        error: 'Failed to initialize location tracking',
        permissionStatus: null
      };
    }
  });
  const [config, setConfig] = useState<LocationTrackingConfig>(() => {
    try {
      return locationTrackingService.getConfig();
    } catch (error) {
      console.error('LocationTrackingProvider: Error getting initial config:', error);
      return {
        enabled: false,
        updateInterval: 5 * 60 * 1000,
        highAccuracy: true,
        timeout: 10000,
        maximumAge: 2 * 60 * 1000
      };
    }
  });

  // Subscribe to location tracking state changes
  useEffect(() => {
    try {
      const unsubscribe = locationTrackingService.subscribe((newState) => {
        setState(newState);
      });

      return unsubscribe;
    } catch (error) {
      console.error('LocationTrackingProvider: Error setting up subscription:', error);
    }
  }, []);

  // (moved below callback declarations to avoid TDZ)

  const startTracking = useCallback(async (): Promise<boolean> => {
    return await locationTrackingService.startTracking();
  }, []);

  const stopTracking = useCallback((): void => {
    locationTrackingService.stopTracking();
  }, []);

  const updateLocationNow = useCallback(async (): Promise<boolean> => {
    return await locationTrackingService.updateLocationNow();
  }, []);

  const updateConfig = useCallback((newConfig: Partial<LocationTrackingConfig>): void => {
    locationTrackingService.updateConfig(newConfig);
    setConfig(locationTrackingService.getConfig());
  }, []);

  const syncPreferencesWithBackend = useCallback(async (): Promise<void> => {
    await locationTrackingService.syncPreferencesWithBackend();
    setConfig(locationTrackingService.getConfig());
  }, []);

  const savePreferencesToBackend = useCallback(async (): Promise<void> => {
    await locationTrackingService.savePreferencesToBackend();
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    return await locationTrackingService.requestPermission();
  }, []);

  const getLastKnownLocation = useCallback(async (): Promise<void> => {
    await locationTrackingService.getLastKnownLocation();
  }, []);

  const isSupported = locationTrackingService.isSupported();

  const value: LocationTrackingContextType = {
    state,
    config,
    startTracking,
    stopTracking,
    updateLocationNow,
    updateConfig,
    requestPermission,
    getLastKnownLocation,
    syncPreferencesWithBackend,
    savePreferencesToBackend,
    isSupported
  };

  // Load last known location (no permission needed) and sync preferences on mount
  useEffect(() => {
    try {
      getLastKnownLocation();
      syncPreferencesWithBackend();
    } catch (error) {
      console.error('LocationTrackingProvider: Error in initialization effects:', error);
    }
  }, [getLastKnownLocation, syncPreferencesWithBackend]);

  return (
    <LocationTrackingContext.Provider value={value}>
      {children}
    </LocationTrackingContext.Provider>
  );
}

export function useLocationTracking(): LocationTrackingContextType {
  const context = useContext(LocationTrackingContext);
  if (context === undefined) {
    console.error('useLocationTracking must be used within a LocationTrackingProvider');
    throw new Error('useLocationTracking must be used within a LocationTrackingProvider');
  }
  return context;
}
