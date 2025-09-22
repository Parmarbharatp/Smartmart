# OpenStreetMap (Nominatim) Setup Guide

## Overview
This application now uses OpenStreetMap's Nominatim service for reverse geocoding instead of Google Maps API. This provides a free alternative with no API key requirements.

## Features
- ✅ **Free**: No API key required
- ✅ **No Rate Limits**: Built-in rate limiting (1 request per second)
- ✅ **Global Coverage**: Worldwide location data
- ✅ **Privacy Friendly**: Open source and community-driven

## Configuration
No environment variables are required! The service works out of the box.

### Optional Environment Variables
If you want to customize the service, you can set these in your `.env` file:

```env
# Optional: Custom Nominatim server (default: https://nominatim.openstreetmap.org)
VITE_NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org

# Optional: Request delay in milliseconds (default: 1000ms)
VITE_NOMINATIM_DELAY=1000
```

## Rate Limiting
The service automatically implements rate limiting to respect Nominatim's usage policy:
- **1 request per second** per IP address
- Automatic delays between requests
- Built-in error handling for rate limit violations

## API Endpoints Used

### Reverse Geocoding
- **Endpoint**: `/reverse`
- **Purpose**: Convert coordinates to address
- **Parameters**: `lat`, `lon`, `format=json`, `addressdetails=1`

### Forward Geocoding
- **Endpoint**: `/search`
- **Purpose**: Convert address to coordinates
- **Parameters**: `q`, `format=json`, `addressdetails=1`, `limit=1`

## Usage Examples

### Get Current Location with Details
```typescript
import { getCurrentLocationWithDetails } from '../services/location';

const locationDetails = await getCurrentLocationWithDetails();
console.log(locationDetails);
// Output: {
//   coordinates: { lat: 40.7128, lng: -74.0060 },
//   address: "123 Main St",
//   city: "New York",
//   state: "New York",
//   country: "United States",
//   postalCode: "10001",
//   formattedAddress: "123 Main St, New York, NY 10001, USA"
// }
```

### Reverse Geocode Coordinates
```typescript
import { getLocationDetails } from '../services/location';

const details = await getLocationDetails({ lat: 40.7128, lng: -74.0060 });
console.log(details.city); // "New York"
```

### Search for Address
```typescript
import { geocodeAddress } from '../services/location';

const result = await geocodeAddress("Times Square, New York");
console.log(result.location); // { lat: 40.7580, lng: -73.9855 }
```

## Error Handling
The service includes comprehensive error handling:
- Network errors
- Rate limiting
- Invalid coordinates
- No results found

## Migration from Google Maps
If you were previously using Google Maps:
1. Remove `VITE_MAPS_API_KEY` from your environment
2. Remove Google Maps script tags from HTML
3. The API remains the same - no code changes needed!

## Troubleshooting

### Common Issues
1. **Rate Limiting**: If you see rate limit errors, the service will automatically retry
2. **No Results**: Some remote locations may not have detailed address information
3. **Network Errors**: Check your internet connection and CORS settings

### Debug Mode
Enable debug logging by setting:
```env
VITE_DEBUG_LOCATION=true
```

## Privacy & Terms
- OpenStreetMap data is open source and community-driven
- No personal data is collected by the service
- Respect the Nominatim usage policy: https://operations.osmfoundation.org/policies/nominatim/
