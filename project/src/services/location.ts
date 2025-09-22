/*
  Location services using OpenStreetMap Nominatim API.
  Free alternative to Google Maps with no API key required.
*/

type LatLng = { lat: number; lng: number };

type GeocodingResult = {
  formattedAddress: string;
  location: LatLng;
  placeId?: string;
  raw?: unknown;
};

type LocationDetails = {
  coordinates: LatLng;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  formattedAddress: string;
  placeId?: string;
};

// OpenStreetMap Nominatim API configuration
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const REQUEST_DELAY = 1000; // 1 second delay between requests to respect rate limits
let lastRequestTime = 0;

// Rate limiting helper
async function rateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < REQUEST_DELAY) {
    const delay = REQUEST_DELAY - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  lastRequestTime = Date.now();
}

// Make request to Nominatim API with rate limiting
async function makeNominatimRequest(endpoint: string, params: Record<string, string>): Promise<any> {
  await rateLimit();
  
  const url = new URL(`${NOMINATIM_BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  // Add required headers for Nominatim
  const headers = {
    'User-Agent': 'SmartMart/1.0 (Location Service)',
    'Accept': 'application/json'
  };
  
  const response = await fetch(url.toString(), { headers });
  
  if (!response.ok) {
    throw new Error(`Nominatim API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

export async function loadMaps(): Promise<void> {
  // No initialization needed for OpenStreetMap
  return Promise.resolve();
}

export function getBrowserLocation(options?: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

export async function reverseGeocode(latlng: LatLng): Promise<GeocodingResult | null> {
  try {
    const results = await makeNominatimRequest('/reverse', {
      lat: latlng.lat.toString(),
      lon: latlng.lng.toString(),
      format: 'json',
      addressdetails: '1',
      zoom: '18'
    });

    if (!results || !results.display_name) return null;

    return {
      formattedAddress: results.display_name,
      location: { lat: parseFloat(results.lat), lng: parseFloat(results.lon) },
      placeId: results.place_id?.toString(),
      raw: results,
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

export async function getLocationDetails(latlng: LatLng): Promise<LocationDetails | null> {
  try {
    const results = await makeNominatimRequest('/reverse', {
      lat: latlng.lat.toString(),
      lon: latlng.lng.toString(),
      format: 'json',
      addressdetails: '1',
      zoom: '18'
    });

    if (!results || !results.display_name) return null;

    const address = results.address || {};
    
    // Extract location components from Nominatim response
    const city = address.city || address.town || address.village || address.hamlet || '';
    const state = address.state || address.region || address.province || '';
    const country = address.country || '';
    const postalCode = address.postcode || '';
    
    // Build address string from available components
    let addressString = '';
    if (address.house_number) addressString += address.house_number + ' ';
    if (address.road) addressString += address.road;
    if (address.house_name) addressString += (addressString ? ', ' : '') + address.house_name;
    
    // If no specific address found, use the display name
    if (!addressString.trim()) {
      addressString = results.display_name;
    }
    
    return {
      coordinates: { lat: parseFloat(results.lat), lng: parseFloat(results.lon) },
      address: addressString.trim(),
      city,
      state,
      country,
      postalCode,
      formattedAddress: results.display_name,
      placeId: results.place_id?.toString(),
    };
  } catch (error) {
    console.error('Get location details error:', error);
    return null;
  }
}

export async function getCurrentLocationWithDetails(): Promise<LocationDetails | null> {
  try {
    const position = await getBrowserLocation({ 
      enableHighAccuracy: true, 
      timeout: 10000, 
      maximumAge: 300000 // 5 minutes cache
    });
    
    const coordinates = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };
    
    return await getLocationDetails(coordinates);
  } catch (error) {
    console.error('Error getting current location with details:', error);
    return null;
  }
}

export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  try {
    const results = await makeNominatimRequest('/search', {
      q: address,
      format: 'json',
      addressdetails: '1',
      limit: '1'
    });

    if (!results || !Array.isArray(results) || results.length === 0) return null;

    const first = results[0];
    return {
      formattedAddress: first.display_name,
      location: { lat: parseFloat(first.lat), lng: parseFloat(first.lon) },
      placeId: first.place_id?.toString(),
      raw: first,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

export type { LatLng, GeocodingResult, LocationDetails };


