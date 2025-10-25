import { getCurrentLocationWithDetails, LocationDetails } from './location';
import { apiService } from './api';

export type LocationTrackingState = {
  isTracking: boolean;
  lastUpdate: Date | null;
  lastKnownLocation: LocationDetails | null;
  error: string | null;
  permissionStatus: PermissionState | null;
};

export type LocationTrackingConfig = {
  enabled: boolean;
  updateInterval: number;
  highAccuracy: boolean;
  timeout: number;
  maximumAge: number;
};

export class LocationTrackingService {
  private state: LocationTrackingState;
  private config: LocationTrackingConfig;
  private listeners: Array<(state: LocationTrackingState) => void> = [];
  private timerId: any = null;

  constructor() {
    this.state = {
      isTracking: false,
      lastUpdate: null,
      lastKnownLocation: null,
      error: null,
      permissionStatus: null,
    };
    this.config = {
      enabled: false,
      updateInterval: 5 * 60 * 1000,
      highAccuracy: true,
      timeout: 10000,
      maximumAge: 2 * 60 * 1000,
    };
  }

  // ---- Public getters ----
  getState(): LocationTrackingState {
    return this.state;
  }

  getConfig(): LocationTrackingConfig {
    return this.config;
  }

  isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'geolocation' in navigator;
  }

  // ---- Subscription ----
  subscribe(listener: (state: LocationTrackingState) => void): () => void {
    this.listeners.push(listener);
    listener(this.state);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(l => l(this.state));
  }

  // ---- Permission helpers ----
  async requestPermission(): Promise<boolean> {
    try {
      if (!this.isSupported()) {
        this.state.error = 'Geolocation not supported';
        this.notifyListeners();
        return false;
      }

      // Use Permissions API if available
      if ((navigator as any).permissions?.query) {
        try {
          const status = await (navigator as any).permissions.query({ name: 'geolocation' as PermissionName });
          this.state.permissionStatus = status.state as PermissionState;
          if (status.state === 'granted') return true;
        } catch {
          // ignore
        }
      }

      // Trigger a one-time position request to prompt
      await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: this.config.highAccuracy,
          timeout: this.config.timeout,
          maximumAge: this.config.maximumAge,
        });
      });

      // If we got here, permission granted
      this.state.permissionStatus = 'granted';
      this.state.error = null;
      this.notifyListeners();
      return true;
    } catch (e: any) {
      this.state.permissionStatus = 'denied';
      this.state.error = e?.message || 'Permission denied';
      this.notifyListeners();
      return false;
    }
  }

  // ---- Tracking controls ----
  async startTracking(): Promise<boolean> {
    const permitted = await this.requestPermission();
    if (!permitted) return false;

    if (this.timerId) return true; // already running
    this.state.isTracking = true;
    this.notifyListeners();

    await this.updateLocationNow();
    this.timerId = setInterval(() => this.updateLocationNow(), this.config.updateInterval);
    return true;
  }

  stopTracking(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.state.isTracking = false;
    this.notifyListeners();
  }

  async updateLocationNow(): Promise<boolean> {
    try {
      const details = await getCurrentLocationWithDetails();
      if (!details) {
        this.state.error = 'Could not get location details';
        this.notifyListeners();
        return false;
      }

      await apiService.updateUserLocation({
        coordinates: details.coordinates,
        address: details.address,
        houseNumber: details.houseNumber,
        street: details.street,
        city: details.city,
        state: details.state,
        country: details.country,
        postalCode: details.postalCode,
        formattedAddress: details.formattedAddress,
        placeId: details.placeId,
      });

      this.state.lastKnownLocation = details;
      this.state.lastUpdate = new Date();
      this.state.error = null;
      this.notifyListeners();
      return true;
    } catch (e: any) {
      this.state.error = e?.message || 'Location update failed';
      this.notifyListeners();
      return false;
    }
  }

  updateConfig(newConfig: Partial<LocationTrackingConfig>): void {
    const prevInterval = this.config.updateInterval;
    this.config = { ...this.config, ...newConfig };
    if (this.timerId && newConfig.updateInterval && newConfig.updateInterval !== prevInterval) {
      clearInterval(this.timerId);
      this.timerId = setInterval(() => this.updateLocationNow(), this.config.updateInterval);
    }
  }

  // ---- Backend preference sync ----
  async syncPreferencesWithBackend(): Promise<void> {
    try {
      const resp = await apiService.getLocationTrackingPreferences();
      if (resp?.locationTracking) {
        this.updateConfig({
          enabled: !!resp.locationTracking.enabled,
          updateInterval: resp.locationTracking.updateInterval ?? this.config.updateInterval,
          highAccuracy: resp.locationTracking.highAccuracy ?? this.config.highAccuracy,
        });
        if (resp.locationTracking.enabled && !this.state.isTracking) {
          // start without prompting again; let update fail if no permission
          this.startTracking();
        }
      }
    } catch {
      // ignore
    }
  }

  async savePreferencesToBackend(): Promise<void> {
    try {
      await apiService.updateLocationTrackingPreferences({
        enabled: this.config.enabled,
        updateInterval: this.config.updateInterval,
        highAccuracy: this.config.highAccuracy,
      });
    } catch {
      // ignore
    }
  }

  async getLastKnownLocation(): Promise<void> {
    try {
      const resp = await apiService.getUserLocation();
      if (resp && resp.location && resp.locationDetails) {
        const [lng, lat] = resp.location.coordinates;
        this.state.lastKnownLocation = {
          coordinates: { lat, lng },
          address: resp.locationDetails.address || '',
          city: resp.locationDetails.city || '',
          state: resp.locationDetails.state || '',
          country: resp.locationDetails.country || '',
          postalCode: resp.locationDetails.postalCode || '',
          formattedAddress: resp.locationDetails.formattedAddress || '',
          placeId: resp.locationDetails.placeId || undefined,
        };
        this.state.lastUpdate = resp.locationDetails.lastUpdated ? new Date(resp.locationDetails.lastUpdated) : null;
        this.state.error = null;
        this.notifyListeners();
      }
    } catch {
      // ignore
    }
  }
}

export const locationTrackingService = new LocationTrackingService();
