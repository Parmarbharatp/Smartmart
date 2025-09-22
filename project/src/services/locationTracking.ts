import { getCurrentLocationWithDetails, type LocationDetails } from './location';
import { apiService } from './api';

export interface LocationTrackingConfig {
  enabled: boolean;
  updateInterval: number; // in milliseconds
  highAccuracy: boolean;
  timeout: number; // in milliseconds
  maximumAge: number; // in milliseconds
}

export interface LocationTrackingState {
  isTracking: boolean;
  lastUpdate: Date | null;
  lastKnownLocation: LocationDetails | null;
  error: string | null;
  permissionStatus: PermissionState | null;
}

class LocationTrackingService {
  private config: LocationTrackingConfig = {
    enabled: false,
    updateInterval: 5 * 60 * 1000, // 5 minutes
    highAccuracy: true,
    timeout: 10000, // 10 seconds
    maximumAge: 2 * 60 * 1000 // 2 minutes
  };

  private state: LocationTrackingState = {
    isTracking: false,
    lastUpdate: null,
    lastKnownLocation: null,
    error: null,
    permissionStatus: null
  };

  private intervalId: NodeJS.Timeout | null = null;
  private listeners: Set<(state: LocationTrackingState) => void> = new Set();

  constructor() {
    console.log('LocationTrackingService: Initializing...');
    this.checkPermissionStatus();
  }

  // Check geolocation permission status
  private async checkPermissionStatus(): Promise<void> {
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        this.state.permissionStatus = permission.state;
        this.notifyListeners();
      } catch (error) {
        console.warn('Could not check geolocation permission:', error);
      }
    }
  }

  // Request location permission
  async requestPermission(): Promise<boolean> {
    try {
      const position = await this.getCurrentPosition();
      this.state.permissionStatus = 'granted';
      this.state.error = null;
      this.notifyListeners();
      return true;
    } catch (error) {
      this.state.permissionStatus = 'denied';
      this.state.error = error instanceof Error ? error.message : 'Permission denied';
      this.notifyListeners();
      return false;
    }
  }

  // Get current position with error handling
  private getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: this.config.highAccuracy,
          timeout: this.config.timeout,
          maximumAge: this.config.maximumAge
        }
      );
    });
  }

  // Update user location in backend
  private async updateUserLocation(locationDetails: LocationDetails): Promise<void> {
    try {
      await apiService.updateUserLocation({
        coordinates: locationDetails.coordinates,
        address: locationDetails.address,
        city: locationDetails.city,
        state: locationDetails.state,
        country: locationDetails.country,
        postalCode: locationDetails.postalCode,
        formattedAddress: locationDetails.formattedAddress,
        placeId: locationDetails.placeId
      });

      this.state.lastUpdate = new Date();
      this.state.lastKnownLocation = locationDetails;
      this.state.error = null;
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to update user location:', error);
      this.state.error = error instanceof Error ? error.message : 'Failed to update location';
      this.notifyListeners();
    }
  }

  // Get current location and update user profile
  private async updateLocation(): Promise<void> {
    try {
      const locationDetails = await getCurrentLocationWithDetails();
      
      if (locationDetails) {
        await this.updateUserLocation(locationDetails);
      } else {
        this.state.error = 'Could not get location details';
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Location update failed:', error);
      this.state.error = error instanceof Error ? error.message : 'Location update failed';
      this.notifyListeners();
    }
  }

  // Start automatic location tracking
  async startTracking(): Promise<boolean> {
    if (this.state.isTracking) {
      return true;
    }

    // Check if we have permission
    if (this.state.permissionStatus === 'denied') {
      this.state.error = 'Location permission denied';
      this.notifyListeners();
      return false;
    }

    // Request permission if not granted
    if (this.state.permissionStatus !== 'granted') {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        return false;
      }
    }

    this.config.enabled = true;
    this.state.isTracking = true;
    this.state.error = null;

    // Update location immediately
    await this.updateLocation();

    // Set up periodic updates
    this.intervalId = setInterval(() => {
      this.updateLocation();
    }, this.config.updateInterval);

    this.notifyListeners();
    return true;
  }

  // Stop automatic location tracking
  stopTracking(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.config.enabled = false;
    this.state.isTracking = false;
    this.notifyListeners();
  }

  // Update configuration
  updateConfig(newConfig: Partial<LocationTrackingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart tracking if interval changed and tracking is active
    if (this.state.isTracking && newConfig.updateInterval) {
      this.stopTracking();
      this.startTracking();
    }
  }

  // Sync preferences with backend
  async syncPreferencesWithBackend(): Promise<void> {
    try {
      const response = await apiService.getLocationTrackingPreferences();
      if (response.locationTracking) {
        const prefs = response.locationTracking;
        this.config = {
          enabled: prefs.enabled || false,
          updateInterval: prefs.updateInterval || 5 * 60 * 1000,
          highAccuracy: prefs.highAccuracy !== undefined ? prefs.highAccuracy : true,
          timeout: this.config.timeout,
          maximumAge: this.config.maximumAge
        };
        
        // Update tracking state if preferences changed
        if (prefs.enabled && !this.state.isTracking) {
          await this.startTracking();
        } else if (!prefs.enabled && this.state.isTracking) {
          this.stopTracking();
        }
        
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Failed to sync preferences with backend:', error);
    }
  }

  // Save preferences to backend
  async savePreferencesToBackend(): Promise<void> {
    try {
      await apiService.updateLocationTrackingPreferences({
        enabled: this.config.enabled,
        updateInterval: this.config.updateInterval,
        highAccuracy: this.config.highAccuracy
      });
    } catch (error) {
      console.error('Failed to save preferences to backend:', error);
      throw error;
    }
  }

  // Get current state
  getState(): LocationTrackingState {
    return { ...this.state };
  }

  // Get current configuration
  getConfig(): LocationTrackingConfig {
    return { ...this.config };
  }

  // Subscribe to state changes
  subscribe(listener: (state: LocationTrackingState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify all listeners of state changes
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getState()));
  }

  // Manual location update
  async updateLocationNow(): Promise<boolean> {
    if (!this.state.isTracking) {
      return false;
    }

    await this.updateLocation();
    return true;
  }

  // Check if location tracking is supported
  isSupported(): boolean {
    return 'geolocation' in navigator;
  }

  // Get user's last known location from backend
  async getLastKnownLocation(): Promise<LocationDetails | null> {
    try {
      const response = await apiService.getUserLocation();
      if (response.location && response.location.coordinates) {
        const locationDetails: LocationDetails = {
          coordinates: response.location.coordinates,
          address: response.location.address || '',
          city: response.location.city || '',
          state: response.location.state || '',
          country: response.location.country || '',
          postalCode: response.location.postalCode || '',
          formattedAddress: response.location.formattedAddress || '',
          placeId: response.location.placeId || ''
        };
        
        this.state.lastKnownLocation = locationDetails;
        this.state.lastUpdate = response.location.lastUpdated ? new Date(response.location.lastUpdated) : null;
        this.notifyListeners();
        
        return locationDetails;
      }
      return null;
    } catch (error) {
      console.error('Failed to get last known location:', error);
      return null;
    }
  }
}

// Create and export singleton instance
export const locationTrackingService = new LocationTrackingService();
