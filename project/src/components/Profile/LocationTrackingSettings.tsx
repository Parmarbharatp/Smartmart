import { useState } from 'react';
import { useLocationTracking } from '../../contexts/LocationTrackingContext';
import { MapPin, Clock, Shield, AlertTriangle } from 'lucide-react';

interface LocationTrackingSettingsProps {
  className?: string;
}

export function LocationTrackingSettings({ className = '' }: LocationTrackingSettingsProps) {
  console.log('LocationTrackingSettings: Component rendering');
  const {
    state,
    config,
    startTracking,
    // stopTracking,
    updateLocationNow,
    updateConfig,
    requestPermission,
    savePreferencesToBackend,
    isSupported
  } = useLocationTracking();

  const [isUpdating, setIsUpdating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Removed toggle path in favor of single primary action

  // Removed separate manual update; consolidated into one button

  const handleAllowAndGetLocation = async () => {
    setIsUpdating(true);
    try {
      if (state.permissionStatus !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          setIsUpdating(false);
          return;
        }
      }
      if (!state.isTracking) {
        await startTracking();
      }
      await updateLocationNow();
      await savePreferencesToBackend();
    } finally {
      setIsUpdating(false);
    }
  };

  const handleIntervalChange = async (interval: number) => {
    updateConfig({ updateInterval: interval * 60 * 1000 }); // Convert minutes to milliseconds
    // Save preferences to backend
    try {
      await savePreferencesToBackend();
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  const handleAccuracyChange = async (highAccuracy: boolean) => {
    updateConfig({ highAccuracy });
    // Save preferences to backend
    try {
      await savePreferencesToBackend();
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  const formatLastUpdate = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  };

  const getPermissionStatusColor = () => {
    switch (state.permissionStatus) {
      case 'granted': return 'text-green-600';
      case 'denied': return 'text-red-600';
      case 'prompt': return 'text-yellow-600';
      default: return 'text-gray-500';
    }
  };

  const getPermissionStatusText = () => {
    switch (state.permissionStatus) {
      case 'granted': return 'Granted';
      case 'denied': return 'Denied';
      case 'prompt': return 'Ask when needed';
      default: return 'Unknown';
    }
  };

  if (!isSupported) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-4">
          <MapPin className="h-6 w-6 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">Location Tracking</h3>
        </div>
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-600">Location tracking is not supported on this device.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <MapPin className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">Location Tracking</h3>
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced
        </button>
      </div>

      {/* Permission Status */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Permission Status</span>
          <span className={`text-sm font-medium ${getPermissionStatusColor()}`}>
            {getPermissionStatusText()}
          </span>
        </div>
        {state.permissionStatus === 'denied' && (
          <p className="text-sm text-red-600 mb-3">
            Location permission is denied. Please enable it in your browser settings to use location tracking.
          </p>
        )}
      </div>

      {/* Single Primary Action */}
      <div className="mb-6">
        <button
          onClick={handleAllowAndGetLocation}
          disabled={isUpdating}
          className="w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUpdating ? 'Updating location…' : (state.permissionStatus === 'granted' ? 'Get Current Location' : 'Allow & Get Current Location')}
        </button>
      </div>

      {/* Current Location Info */}
      {state.lastKnownLocation && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Current Location</h4>
          <p className="text-sm text-gray-600 mb-1">
            {state.lastKnownLocation.formattedAddress}
          </p>
          <div className="flex items-center text-xs text-gray-500">
            <Clock className="h-4 w-4 mr-1" />
            Last updated: {formatLastUpdate(state.lastUpdate)}
          </div>
        </div>
      )}

      {/* Manual Update removed in favor of single primary action */}

      {/* Error Display */}
      {state.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-sm text-red-700">{state.error}</p>
          </div>
        </div>
      )}

      {/* Advanced Settings */}
      {showAdvanced && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900">Advanced Settings</h4>
          
          {/* Update Interval */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Update Interval (minutes)
            </label>
            <select
              value={config.updateInterval / (1000 * 60)}
              onChange={(e) => handleIntervalChange(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>1 minute</option>
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
            </select>
          </div>

          {/* High Accuracy */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">High Accuracy</h4>
              <p className="text-sm text-gray-500">Use GPS for more precise location</p>
            </div>
            <button
              onClick={() => handleAccuracyChange(!config.highAccuracy)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.highAccuracy ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.highAccuracy ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start">
          <Shield className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Privacy & Security</h4>
            <p className="text-sm text-blue-700 mt-1">
              Your location data is stored securely and only used to provide location-based services. 
              You can disable tracking at any time. 
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
