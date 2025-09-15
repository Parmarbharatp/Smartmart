import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { getBrowserLocation, loadMaps, geocodeAddress, reverseGeocode } from '../services/location';
import type { LatLng } from '../services/location';

type LocationState = {
  isMapsReady: boolean;
  currentPosition?: GeolocationPosition;
  selectedLatLng?: LatLng;
  setSelectedLatLng: (coords?: LatLng) => void;
  ensureMaps: () => Promise<void>;
  locateMe: () => Promise<GeolocationPosition>;
  geocode: (address: string) => ReturnType<typeof geocodeAddress>;
  reverse: (coords: LatLng) => ReturnType<typeof reverseGeocode>;
};

const LocationContext = createContext<LocationState | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [isMapsReady, setIsMapsReady] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<GeolocationPosition | undefined>(undefined);
  const [selectedLatLng, setSelectedLatLng] = useState<LatLng | undefined>(undefined);

  const ensureMaps = useCallback(async () => {
    if (!isMapsReady) {
      await loadMaps();
      setIsMapsReady(true);
    }
  }, [isMapsReady]);

  const locateMe = useCallback(async () => {
    const pos = await getBrowserLocation({ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    setCurrentPosition(pos);
    setSelectedLatLng({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    return pos;
  }, []);

  const value = useMemo<LocationState>(() => ({
    isMapsReady,
    currentPosition,
    selectedLatLng,
    setSelectedLatLng,
    ensureMaps,
    locateMe,
    geocode: geocodeAddress,
    reverse: reverseGeocode,
  }), [isMapsReady, currentPosition, selectedLatLng, ensureMaps, locateMe]);

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocationContext(): LocationState {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocationContext must be used within LocationProvider');
  return ctx;
}


