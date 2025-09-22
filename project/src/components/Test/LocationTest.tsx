import React, { useState, useEffect } from 'react';
import { useLocationContext } from '../../contexts/LocationContext';
import { apiService } from '../../services/api';
import type { LocationDetails } from '../../services/location';
import { runAllLocationTests } from '../../utils/locationTest';

const LocationTest: React.FC = () => {
  const {
    isMapsReady,
    currentLocationDetails,
    selectedLocationDetails,
    locateMeWithDetails,
    getLocationDetails,
    setSelectedLocationDetails
  } = useLocationContext();

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [userLocation, setUserLocation] = useState<any>(null);
  const [shopLocation, setShopLocation] = useState<any>(null);
  const [testResults, setTestResults] = useState<any>(null);

  // Load user's saved location on component mount
  useEffect(() => {
    loadUserLocation();
  }, []);

  const loadUserLocation = async () => {
    try {
      const response = await apiService.getUserLocation();
      setUserLocation(response.location);
    } catch (error) {
      console.error('Error loading user location:', error);
    }
  };

  const handleGetCurrentLocation = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      const locationDetails = await locateMeWithDetails();
      if (locationDetails) {
        setMessage(`Location found: ${locationDetails.formattedAddress}`);
        setSelectedLocationDetails(locationDetails);
      } else {
        setMessage('Failed to get location details');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setMessage('Error getting location. Please check your browser permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveUserLocation = async () => {
    if (!selectedLocationDetails) {
      setMessage('Please get your location first');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const locationData = {
        coordinates: selectedLocationDetails.coordinates,
        address: selectedLocationDetails.address,
        city: selectedLocationDetails.city,
        state: selectedLocationDetails.state,
        country: selectedLocationDetails.country,
        postalCode: selectedLocationDetails.postalCode,
        formattedAddress: selectedLocationDetails.formattedAddress,
        placeId: selectedLocationDetails.placeId
      };

      await apiService.updateUserLocation(locationData);
      setMessage('User location saved successfully!');
      await loadUserLocation(); // Reload user location
    } catch (error) {
      console.error('Error saving user location:', error);
      setMessage('Error saving user location');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestShopLocation = async () => {
    if (!selectedLocationDetails) {
      setMessage('Please get your location first');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      // First, get the user's shop
      const myShop = await apiService.getMyShop();
      if (!myShop) {
        setMessage('No shop found. Please create a shop first.');
        return;
      }

      const locationData = {
        coordinates: selectedLocationDetails.coordinates,
        address: selectedLocationDetails.address,
        city: selectedLocationDetails.city,
        state: selectedLocationDetails.state,
        country: selectedLocationDetails.country,
        postalCode: selectedLocationDetails.postalCode,
        formattedAddress: selectedLocationDetails.formattedAddress,
        placeId: selectedLocationDetails.placeId
      };

      await apiService.updateShopLocation(myShop._id, locationData);
      setMessage('Shop location saved successfully!');
      
      // Load shop location
      const shopLocationResponse = await apiService.getShopLocation(myShop._id);
      setShopLocation(shopLocationResponse);
    } catch (error) {
      console.error('Error saving shop location:', error);
      setMessage('Error saving shop location');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadShopLocation = async () => {
    try {
      const myShop = await apiService.getMyShop();
      if (!myShop) {
        setMessage('No shop found. Please create a shop first.');
        return;
      }

      const shopLocationResponse = await apiService.getShopLocation(myShop._id);
      setShopLocation(shopLocationResponse);
      setMessage('Shop location loaded successfully!');
    } catch (error) {
      console.error('Error loading shop location:', error);
      setMessage('Error loading shop location');
    }
  };

  const handleRunTests = async () => {
    setIsLoading(true);
    setMessage('Running OpenStreetMap tests...');
    
    try {
      const results = await runAllLocationTests();
      setTestResults(results);
      setMessage('Tests completed! Check console for details.');
    } catch (error) {
      console.error('Test error:', error);
      setMessage('Tests failed. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Location Tracking Test</h2>
      
      <div className="space-y-6">
        {/* Maps Status */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Location Service Status</h3>
          <p className={`text-sm ${isMapsReady ? 'text-green-600' : 'text-red-600'}`}>
            {isMapsReady ? '✅ OpenStreetMap Ready' : '❌ Location Service Not Ready'}
          </p>
        </div>

        {/* Current Location */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Current Location</h3>
          {currentLocationDetails ? (
            <div className="space-y-2 text-sm">
              <p><strong>Address:</strong> {currentLocationDetails.address}</p>
              <p><strong>City:</strong> {currentLocationDetails.city}</p>
              <p><strong>State:</strong> {currentLocationDetails.state}</p>
              <p><strong>Country:</strong> {currentLocationDetails.country}</p>
              <p><strong>Coordinates:</strong> {currentLocationDetails.coordinates.lat.toFixed(6)}, {currentLocationDetails.coordinates.lng.toFixed(6)}</p>
              <p><strong>Formatted:</strong> {currentLocationDetails.formattedAddress}</p>
            </div>
          ) : (
            <p className="text-gray-500">No current location detected</p>
          )}
        </div>

        {/* Selected Location */}
        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Selected Location</h3>
          {selectedLocationDetails ? (
            <div className="space-y-2 text-sm">
              <p><strong>Address:</strong> {selectedLocationDetails.address}</p>
              <p><strong>City:</strong> {selectedLocationDetails.city}</p>
              <p><strong>State:</strong> {selectedLocationDetails.state}</p>
              <p><strong>Country:</strong> {selectedLocationDetails.country}</p>
              <p><strong>Coordinates:</strong> {selectedLocationDetails.coordinates.lat.toFixed(6)}, {selectedLocationDetails.coordinates.lng.toFixed(6)}</p>
              <p><strong>Formatted:</strong> {selectedLocationDetails.formattedAddress}</p>
            </div>
          ) : (
            <p className="text-gray-500">No location selected</p>
          )}
        </div>

        {/* User Location from Database */}
        <div className="p-4 bg-purple-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Saved User Location</h3>
          {userLocation ? (
            <div className="space-y-2 text-sm">
              <p><strong>Address:</strong> {userLocation.address}</p>
              <p><strong>City:</strong> {userLocation.city}</p>
              <p><strong>State:</strong> {userLocation.state}</p>
              <p><strong>Country:</strong> {userLocation.country}</p>
              <p><strong>Coordinates:</strong> {userLocation.coordinates?.lat?.toFixed(6)}, {userLocation.coordinates?.lng?.toFixed(6)}</p>
              <p><strong>Last Updated:</strong> {userLocation.lastUpdated ? new Date(userLocation.lastUpdated).toLocaleString() : 'Unknown'}</p>
            </div>
          ) : (
            <p className="text-gray-500">No saved user location</p>
          )}
        </div>

        {/* Shop Location from Database */}
        <div className="p-4 bg-orange-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Saved Shop Location</h3>
          {shopLocation ? (
            <div className="space-y-2 text-sm">
              <p><strong>Shop:</strong> {shopLocation.shopName}</p>
              <p><strong>Address:</strong> {shopLocation.location?.address}</p>
              <p><strong>City:</strong> {shopLocation.location?.city}</p>
              <p><strong>State:</strong> {shopLocation.location?.state}</p>
              <p><strong>Country:</strong> {shopLocation.location?.country}</p>
              <p><strong>Coordinates:</strong> {shopLocation.location?.coordinates?.lat?.toFixed(6)}, {shopLocation.location?.coordinates?.lng?.toFixed(6)}</p>
              <p><strong>Last Updated:</strong> {shopLocation.location?.lastUpdated ? new Date(shopLocation.location.lastUpdated).toLocaleString() : 'Unknown'}</p>
            </div>
          ) : (
            <p className="text-gray-500">No saved shop location</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleGetCurrentLocation}
              disabled={isLoading || !isMapsReady}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Getting Location...' : 'Get Current Location'}
            </button>
            
            <button
              onClick={handleSaveUserLocation}
              disabled={isLoading || !selectedLocationDetails}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Save User Location
            </button>
            
            <button
              onClick={handleTestShopLocation}
              disabled={isLoading || !selectedLocationDetails}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Save Shop Location
            </button>
            
            <button
              onClick={handleLoadShopLocation}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Load Shop Location
            </button>
            
            <button
              onClick={handleRunTests}
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Run OpenStreetMap Tests
            </button>
          </div>
        </div>

        {/* Test Results */}
        {testResults && (
          <div className="p-4 bg-indigo-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Test Results</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <span className="font-medium">Integration Test:</span>
                <span className={`ml-2 ${testResults.integration?.success ? 'text-green-600' : 'text-red-600'}`}>
                  {testResults.integration?.success ? '✅ Passed' : '❌ Failed'}
                </span>
              </div>
              <div className="flex items-center">
                <span className="font-medium">Rate Limiting Test:</span>
                <span className={`ml-2 ${testResults.rateLimiting?.success ? 'text-green-600' : 'text-red-600'}`}>
                  {testResults.rateLimiting?.success ? '✅ Passed' : '❌ Failed'}
                </span>
              </div>
              <div className="flex items-center">
                <span className="font-medium">Error Handling Test:</span>
                <span className={`ml-2 ${testResults.errorHandling?.success ? 'text-green-600' : 'text-red-600'}`}>
                  {testResults.errorHandling?.success ? '✅ Passed' : '❌ Failed'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Message Display */}
        {message && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationTest;
