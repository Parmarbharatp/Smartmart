import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Edit3, Save, X, Loader2, Store, Clock, Phone, Mail } from 'lucide-react';
// import { useLocationContext } from '../../contexts/LocationContext';
import { apiService } from '../../services/api';
import type { LocationDetails } from '../../services/location';

interface ShopProfileProps {
  shop: {
    _id: string;
    shopName: string;
    description: string;
    address: string;
    contactInfo: string;
    imageUrl?: string;
    openingHours?: string;
    deliveryRadius?: number;
    status: string;
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
    ownerId?: {
      name: string;
      email: string;
    };
  };
  isOwner?: boolean;
}

const ShopProfile: React.FC<ShopProfileProps> = ({ shop, isOwner = false }) => {
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
    setMessage('Getting shop location...');

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

        await apiService.updateShopLocation(shop._id, locationData);
        setLocationDetails(details);
        setMessage(`Shop location updated: ${details.city}, ${details.state}`);
        setIsEditingLocation(false);
      } else {
        setMessage('Failed to get location details');
      }
    } catch (error) {
      console.error('Error updating shop location:', error);
      setMessage('Error updating shop location. Please check permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingLocation(false);
    setMessage('');
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
            <Store className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{shop.shopName}</h2>
            <p className="text-gray-600">{shop.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            shop.status === 'approved' ? 'bg-green-100 text-green-800' :
            shop.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {shop.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Shop Information */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Shop Details</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Address</label>
                <p className="text-gray-900">{shop.address}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Contact</label>
                <p className="text-gray-900">{shop.contactInfo}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Opening Hours</label>
                <p className="text-gray-900">{shop.openingHours || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Delivery Radius</label>
                <p className="text-gray-900">{shop.deliveryRadius || 10} km</p>
              </div>
              {shop.ownerId && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Owner</label>
                  <p className="text-gray-900">{shop.ownerId.name}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Location Information */}
        {false && (
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                Shop Location
              </h3>
              {isOwner && !isEditingLocation && (
                <button
                  onClick={() => setIsEditingLocation(true)}
                  className="flex items-center px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  <Edit3 className="mr-1 h-4 w-4" />
                  Update Location
                </button>
              )}
            </div>
            {/* content hidden for now */}
          </div>

          {/* Map Placeholder */}
          {shop.location && (
            <div className="bg-gray-100 p-6 rounded-lg">
              <h4 className="text-lg font-semibold mb-4 text-gray-800">Location Map</h4>
              <div className="bg-gray-200 h-64 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-gray-500">Map view would be displayed here</p>
                </div>
              </div>
            </div>
          )}
        </div>
        )}
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

export default ShopProfile;
