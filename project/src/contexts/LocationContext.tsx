import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { getBrowserLocation, loadMaps, geocodeAddress, reverseGeocode, getLocationDetails, getCurrentLocationWithDetails } from '../services/location';
import type { LatLng, LocationDetails } from '../services/location';

type LocationState = {
  isMapsReady: boolean;
  currentPosition?: GeolocationPosition;
  selectedLatLng?: LatLng;
  currentLocationDetails?: LocationDetails;
  selectedLocationDetails?: LocationDetails;
  setSelectedLatLng: (coords?: LatLng) => void;
  ensureMaps: () => Promise<void>;
  locateMe: () => Promise<GeolocationPosition>;
  locateMeWithDetails: () => Promise<LocationDetails | null>;
  geocode: (address: string) => ReturnType<typeof geocodeAddress>;
  reverse: (coords: LatLng) => ReturnType<typeof reverseGeocode>;
  getLocationDetails: (coords: LatLng) => ReturnType<typeof getLocationDetails>;
  setSelectedLocationDetails: (details?: LocationDetails) => void;
};

const LocationContext = createContext<LocationState | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [isMapsReady, setIsMapsReady] = useState(true); // Set to true by default for OpenStreetMap
  const [currentPosition, setCurrentPosition] = useState<GeolocationPosition | undefined>(undefined);
  const [selectedLatLng, setSelectedLatLng] = useState<LatLng | undefined>(undefined);
  const [currentLocationDetails, setCurrentLocationDetails] = useState<LocationDetails | undefined>(undefined);
  const [selectedLocationDetails, setSelectedLocationDetails] = useState<LocationDetails | undefined>(undefined);

  const ensureMaps = useCallback(async () => {
    // OpenStreetMap doesn't require initialization
    // Just ensure the service is ready
    return Promise.resolve();
  }, []);

  const locateMe = useCallback(async () => {
    const pos = await getBrowserLocation({ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    setCurrentPosition(pos);
    setSelectedLatLng({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    return pos;
  }, []);

  const locateMeWithDetails = useCallback(async () => {
    try {
      const locationDetails = await getCurrentLocationWithDetails();
      if (locationDetails) {
        setCurrentLocationDetails(locationDetails);
        setCurrentPosition({
          coords: {
            latitude: locationDetails.coordinates.lat,
            longitude: locationDetails.coordinates.lng,
            accuracy: 0,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null
          },
          timestamp: Date.now()
        } as GeolocationPosition);
        setSelectedLatLng(locationDetails.coordinates);
        setSelectedLocationDetails(locationDetails);
      }
      return locationDetails;
    } catch (error) {
      console.error('Error getting location with details:', error);
      return null;
    }
  }, []);

  const value = useMemo<LocationState>(() => ({
    isMapsReady,
    currentPosition,
    selectedLatLng,
    currentLocationDetails,
    selectedLocationDetails,
    setSelectedLatLng,
    ensureMaps,
    locateMe,
    locateMeWithDetails,
    geocode: geocodeAddress,
    reverse: reverseGeocode,
    getLocationDetails,
    setSelectedLocationDetails,
  }), [isMapsReady, currentPosition, selectedLatLng, currentLocationDetails, selectedLocationDetails, ensureMaps, locateMe, locateMeWithDetails]);

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocationContext(): LocationState {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocationContext must be used within LocationProvider');
  return ctx;
}


