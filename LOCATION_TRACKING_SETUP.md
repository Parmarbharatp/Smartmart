# Location Tracking Setup Guide

This guide explains how to set up and use the automatic location tracking feature in SmartMart.

## Overview

The location tracking feature allows users to automatically update their location and store it in their profile using OpenStreetMap (Nominatim) API. This is a free service that doesn't require an API key.

## Features

- **Automatic Location Updates**: Periodically updates user location based on configurable intervals
- **Manual Location Updates**: Users can manually update their location at any time
- **Location Permission Management**: Handles geolocation permissions gracefully
- **Privacy Controls**: Users can enable/disable tracking and configure update intervals
- **OpenStreetMap Integration**: Uses Nominatim API for reverse geocoding (free, no API key required)
- **Backend Storage**: Location data is stored in the user's profile in MongoDB

## Technical Implementation

### Frontend Components

1. **LocationTrackingService** (`src/services/locationTracking.ts`)
   - Core service for managing location tracking
   - Handles geolocation API calls
   - Manages tracking intervals and preferences
   - Syncs with backend preferences

2. **LocationTrackingContext** (`src/contexts/LocationTrackingContext.tsx`)
   - React context for location tracking state management
   - Provides hooks for components to interact with location tracking

3. **LocationTrackingSettings** (`src/components/Profile/LocationTrackingSettings.tsx`)
   - Settings component for configuring location tracking
   - Allows users to enable/disable tracking
   - Configure update intervals and accuracy settings

4. **LocationStatusIndicator** (`src/components/Layout/LocationStatusIndicator.tsx`)
   - Status indicator showing current tracking state
   - Displays last update time and error status

### Backend Implementation

1. **User Model Updates** (`backend/models/User.js`)
   - Added `locationTracking` preferences to user schema
   - Stores tracking settings and last update timestamp

2. **API Endpoints** (`backend/routes/auth.js`)
   - `PUT /api/auth/update-location` - Update user location
   - `GET /api/auth/location` - Get user's current location
   - `PUT /api/auth/location-tracking-preferences` - Update tracking preferences
   - `GET /api/auth/location-tracking-preferences` - Get tracking preferences

### Location Services

1. **Location Service** (`src/services/location.ts`)
   - Uses OpenStreetMap Nominatim API
   - Handles reverse geocoding and address formatting
   - Implements rate limiting (1 request per second per IP)

## Configuration

### Update Intervals

Users can configure how often their location is updated:
- 1 minute
- 5 minutes (default)
- 10 minutes
- 15 minutes
- 30 minutes
- 1 hour

### Accuracy Settings

- **High Accuracy**: Uses GPS for more precise location (default: enabled)
- **Standard Accuracy**: Uses network-based location (faster, less battery)

## Privacy & Security

- Location data is stored securely in the user's profile
- Users can disable tracking at any time
- No location data is shared with third parties
- OpenStreetMap Nominatim is used (free, open-source, no API key required)
- Rate limiting prevents abuse of the geocoding service

## Usage

### For Users

1. Go to your profile page
2. Scroll down to "Location Tracking Settings"
3. Toggle "Automatic Location Tracking" to enable
4. Configure your preferred update interval
5. Your location will be automatically updated based on your settings

### For Developers

```typescript
import { useLocationTracking } from '../contexts/LocationTrackingContext';

function MyComponent() {
  const {
    state,
    config,
    startTracking,
    stopTracking,
    updateLocationNow
  } = useLocationTracking();

  // Check if tracking is active
  if (state.isTracking) {
    console.log('Location tracking is active');
    console.log('Last update:', state.lastUpdate);
    console.log('Current location:', state.lastKnownLocation);
  }
}
```

## API Rate Limits

OpenStreetMap Nominatim has the following rate limits:
- 1 request per second per IP address
- The service implements automatic rate limiting
- Consider using caching for frequently accessed locations

## Troubleshooting

### Common Issues

1. **Location Permission Denied**
   - Check browser settings
   - Ensure HTTPS is used (required for geolocation)
   - Clear browser cache and try again

2. **Location Not Updating**
   - Check if tracking is enabled
   - Verify internet connection
   - Check browser console for errors

3. **Inaccurate Location**
   - Enable high accuracy mode
   - Ensure GPS is available
   - Check device location settings

### Debug Mode

Enable debug logging by setting `localStorage.setItem('debug', 'location')` in browser console.

## Future Enhancements

- Geofencing support
- Location history tracking
- Integration with delivery tracking
- Real-time location sharing for delivery orders
- Location-based product recommendations


