import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { useLocationTracking } from '../../contexts/LocationTrackingContext';
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
    location?: { type: 'Point'; coordinates: [number, number] };
    locationDetails?: {
      address: string;
      formattedAddress: string;
      lastUpdated?: string | null;
      houseNumber?: string;
      street?: string;
    };
  };
}

const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  const { state: locationState } = useLocationTracking();
  const [message, setMessage] = useState('');
  const [extraAddress, setExtraAddress] = useState<string>(user.locationDetails?.street || user.locationDetails?.houseNumber || '');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phoneNumber?: string; extraAddress?: string }>({});

  // Basic info state (restored)
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState({
    name: user.name || '',
    email: user.email || '',
    phoneNumber: user.phoneNumber || '',
    address: user.address || ''
  });

  useEffect(() => {
    setExtraAddress(user.locationDetails?.street || user.locationDetails?.houseNumber || '');
  }, [user.locationDetails?.street, user.locationDetails?.houseNumber]);

  useEffect(() => {
    setProfileDraft({
      name: user.name || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      address: user.address || ''
    });
  }, [user.name, user.email, user.phoneNumber, user.address]);

  const saveExtraAddress = async () => {
    try {
      if (!user.location || !Array.isArray(user.location.coordinates) || user.location.coordinates.length !== 2) {
        setMessage('No coordinates on profile. Use Get Current Location first.');
        return;
      }
      setIsSaving(true);
      const [lng, lat] = user.location.coordinates;
      await apiService.updateUserLocation({
        coordinates: { lat, lng },
        // keep backend address as-is; only update the user-provided extra field
        street: extraAddress,
        houseNumber: extraAddress,
        formattedAddress: user.locationDetails?.formattedAddress,
        address: user.locationDetails?.address,
      });
      setMessage('Address details saved');
    } catch (e) {
      setMessage('Failed to save address details');
    } finally {
      setIsSaving(false);
    }
  };

  const saveBasicInfo = async () => {
    // client-side validation
    const newErrors: { name?: string; phoneNumber?: string; extraAddress?: string } = {};
    if (profileDraft.name && (!/^[a-zA-Z\s\-']+$/.test(profileDraft.name) || profileDraft.name.trim().length < 2)) {
      newErrors.name = 'Enter a valid name (letters/spaces, min 2 chars)';
    }
    if (profileDraft.phoneNumber && !/^\d{10}$/.test(profileDraft.phoneNumber)) {
      newErrors.phoneNumber = 'Phone must be exactly 10 digits';
    }
    if (extraAddress && extraAddress.length > 150) {
      newErrors.extraAddress = 'Too long (max 150 chars)';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      setIsSaving(true);
      await apiService.updateProfile({
        name: profileDraft.name,
        phoneNumber: profileDraft.phoneNumber,
      });
      // Also persist extraAddress as street/houseNumber with existing coordinates if present
      if (user.location && Array.isArray(user.location.coordinates) && user.location.coordinates.length === 2) {
        const [lng, lat] = user.location.coordinates;
        await apiService.updateUserLocation({
          coordinates: { lat, lng },
          street: extraAddress,
          houseNumber: extraAddress,
          formattedAddress: user.locationDetails?.formattedAddress,
          address: user.locationDetails?.address,
        });
      }
      setIsEditingProfile(false);
      setMessage('Profile updated');
    } catch (e) {
      setMessage('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">User Profile</h2>

      {/* Basic Information (restored) */}
      <div className="bg-gray-50 p-6 rounded-lg mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Basic Information</h3>
          {!isEditingProfile ? (
            <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded" onClick={() => setIsEditingProfile(true)}>Edit</button>
          ) : (
            <div className="space-x-2">
              <button className="px-3 py-1 text-sm bg-green-600 text-white rounded" onClick={saveBasicInfo} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</button>
              <button className="px-3 py-1 text-sm bg-gray-600 text-white rounded" onClick={() => { setIsEditingProfile(false); setProfileDraft({ name: user.name || '', email: user.email || '', phoneNumber: user.phoneNumber || '', address: user.address || '' }); }}>Cancel</button>
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Name</label>
            {isEditingProfile ? (
              <>
                <input className="w-full mt-1 px-3 py-2 border rounded" value={profileDraft.name} onChange={(e) => setProfileDraft({ ...profileDraft, name: e.target.value })} />
                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
              </>
            ) : (
              <p className="text-gray-900">{user.name}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Email</label>
            <p className="text-gray-900">{user.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Phone</label>
            {isEditingProfile ? (
              <>
                <input className="w-full mt-1 px-3 py-2 border rounded" value={profileDraft.phoneNumber} onChange={(e) => setProfileDraft({ ...profileDraft, phoneNumber: e.target.value })} />
                {errors.phoneNumber && <p className="text-xs text-red-600 mt-1">{errors.phoneNumber}</p>}
              </>
            ) : (
              <p className="text-gray-900">{user.phoneNumber || 'Not provided'}</p>
            )}
          </div>
          {false && (
          <div>
            <label className="text-sm font-medium text-gray-600">Address</label>
            {isEditingProfile ? (
              <input className="w-full mt-1 px-3 py-2 border rounded" value={profileDraft.address} onChange={(e) => setProfileDraft({ ...profileDraft, address: e.target.value })} />
            ) : (
              <p className="text-gray-900">{user.address || 'Not provided'}</p>
            )}
          </div>
          )}
          <div>
            <label className="text-sm font-medium text-gray-600">Address Details (House/Street/Society)</label>
            {isEditingProfile ? (
              <>
                <input className="w-full mt-1 px-3 py-2 border rounded" placeholder="e.g. A-203, Sunflower Society" value={extraAddress} onChange={(e) => setExtraAddress(e.target.value)} />
                {errors.extraAddress && <p className="text-xs text-red-600 mt-1">{errors.extraAddress}</p>}
              </>
            ) : (
              <p className="text-gray-900">{extraAddress || 'Not provided'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Location Information (simplified) */}
      <div className="bg-blue-50 p-6 rounded-lg mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <MapPin className="mr-2 h-5 w-5" />
            Location Information
          </h3>
        </div>

        {user.locationDetails ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Current Location</label>
              <p className="text-gray-900">{user.locationDetails.formattedAddress || user.locationDetails.address}</p>
            </div>
            {user.locationDetails.lastUpdated && (
              <div>
                <label className="text-sm font-medium text-gray-600">Last Updated</label>
                <p className="text-gray-900">{new Date(user.locationDetails.lastUpdated).toLocaleString()}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-600">No location saved yet. Use Get Current Location.</div>
        )}
      </div>

      {/* Location Tracking Settings */}
      <LocationTrackingSettings />

      {message && (
        <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded text-green-800">{message}</div>
      )}
    </div>
  );
};

export default UserProfile;
