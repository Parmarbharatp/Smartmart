import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Edit3, Save, X, Loader2 } from 'lucide-react';
// import { useLocationContext } from '../../contexts/LocationContext';
import { apiService } from '../../services/api';
import type { LocationDetails } from '../../services/location';
import { LocationTrackingSettings } from './LocationTrackingSettings';

interface UserProfileProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    phoneNumber?: string;
    address?: string;
    location?: {
      coordinates: {
        lat: number;
        lng: number;
      };
      address: string;
      city: string;
      state: string;
      country: string;
      postalCode?: string;
      formattedAddress: string;
      placeId?: string;
      lastUpdated: string;
    };
  };
}

const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  console.log('UserProfile: Component rendering with user:', user);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [locationDetails, setLocationDetails] = useState<LocationDetails | null>(null);

  // const { locateMeWithDetails, isMapsReady } = useLocationContext();
  
  // Temporary mock values
  const locateMeWithDetails = async () => null;
  const isMapsReady = true;

  const handleUpdateLocation = async () => {
    if (!isMapsReady) {
      setMessage('Location service not ready. Please wait...');
      return;
    }

    setIsLoading(true);
    setMessage('Getting your current location...');

    try {
      const details = await locateMeWithDetails();
      
      if (details) {
        const locationData = {
          coordinates: details.coordinates,
          address: details.address,
          city: details.city,
          state: details.state,
          country: details.country,
          postalCode: details.postalCode,
          formattedAddress: details.formattedAddress,
          placeId: details.placeId
        };

        await apiService.updateUserLocation(locationData);
        setLocationDetails(details);
        setMessage(`Location updated: ${details.city}, ${details.state}`);
        setIsEditingLocation(false);
      } else {
        setMessage('Failed to get location details');
      }
    } catch (error) {
      console.error('Error updating location:', error);
      setMessage('Error updating location. Please check permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingLocation(false);
    setMessage('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">User Profile</h2>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {user.role.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Basic Information */}
        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Basic Information</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Name</label>
                <p className="text-gray-900">{user.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Phone</label>
                <p className="text-gray-900">{user.phoneNumber || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Address</label>
                <p className="text-gray-900">{user.address || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div className="space-y-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                Location Information
              </h3>
              {!isEditingLocation && (
                <button
                  onClick={() => setIsEditingLocation(true)}
                  className="flex items-center px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  <Edit3 className="mr-1 h-4 w-4" />
                  Update
                </button>
              )}
            </div>

            {isEditingLocation ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleUpdateLocation}
                    disabled={isLoading}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Navigation className="mr-2 h-4 w-4" />
                    )}
                    {isLoading ? 'Getting Location...' : 'Get Current Location'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Only show location if permission was granted and we have data */}
                {user.location ? (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Current Location</label>
                      <p className="text-gray-900">{user.location.formattedAddress}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">City</label>
                        <p className="text-gray-900">{user.location.city || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">State</label>
                        <p className="text-gray-900">{user.location.state || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Country</label>
                        <p className="text-gray-900">{user.location.country || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Postal Code</label>
                        <p className="text-gray-900">{user.location.postalCode || 'N/A'}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Coordinates</label>
                      <p className="text-gray-900 font-mono text-sm">
                        {user.location.coordinates.lat.toFixed(6)}, {user.location.coordinates.lng.toFixed(6)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Last Updated</label>
                      <p className="text-gray-900">
                        {new Date(user.location.lastUpdated).toLocaleString()}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 mb-2">No location information available</p>
                    <p className="text-xs text-gray-500 mb-4">Grant location permission to use your current location.</p>
                    <button
                      onClick={() => setIsEditingLocation(true)}
                      className="flex items-center mx-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      <Navigation className="mr-2 h-4 w-4" />
                      Enable Location
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Location Tracking Settings */}
      <div className="mt-8">
        <LocationTrackingSettings />
      </div>

      {/* Message Display */}
      {message && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">{message}</p>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
