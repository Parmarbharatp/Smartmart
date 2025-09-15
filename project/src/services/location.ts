/*
  Location/Maps setup scaffolding. This wires up a lazy Google Maps JS API loader,
  browser geolocation utilities, and geocoding wrappers. Actual usage/integration
  in components is intentionally not done yet.
*/

type LatLng = { lat: number; lng: number };

type GeocodingResult = {
  formattedAddress: string;
  location: LatLng;
  placeId?: string;
  raw?: unknown;
};

const provider = (import.meta.env.VITE_MAPS_PROVIDER || 'google').toLowerCase();
const apiKey = (import.meta.env.VITE_MAPS_API_KEY || '').trim();
const placesEnabled = String(import.meta.env.VITE_MAPS_PLACES_ENABLED || 'true') === 'true';
const geocodingEnabled = String(import.meta.env.VITE_MAPS_GEOCODING_ENABLED || 'true') === 'true';

let googleLoaderPromise: Promise<typeof google> | null = null;

function ensureGoogleLoader(): Promise<typeof google> {
  if (provider !== 'google') {
    return Promise.reject(new Error('Only google provider is scaffolded right now'));
  }
  if (!apiKey) {
    return Promise.reject(new Error('VITE_MAPS_API_KEY is not set'));
  }
  if (googleLoaderPromise) return googleLoaderPromise;

  googleLoaderPromise = new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && (window as any).google && (window as any).google.maps) {
      resolve((window as any).google);
      return;
    }
    const script = document.createElement('script');
    const libraries = placesEnabled ? 'places' : '';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=${libraries}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve((window as any).google);
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
    document.head.appendChild(script);
  });
  return googleLoaderPromise;
}

export async function loadMaps(): Promise<void> {
  if (provider === 'google') {
    await ensureGoogleLoader();
    return;
  }
  throw new Error('Unsupported maps provider');
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
  if (!geocodingEnabled) return null;
  if (provider !== 'google') throw new Error('Unsupported maps provider');
  await ensureGoogleLoader();
  const geocoder = new google.maps.Geocoder();
  const { results } = await geocoder.geocode({ location: latlng });
  const first = results?.[0];
  if (!first) return null;
  const loc = first.geometry?.location;
  return {
    formattedAddress: first.formatted_address,
    location: { lat: loc?.lat() ?? latlng.lat, lng: loc?.lng() ?? latlng.lng },
    placeId: first.place_id,
    raw: first,
  };
}

export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  if (!geocodingEnabled) return null;
  if (provider !== 'google') throw new Error('Unsupported maps provider');
  await ensureGoogleLoader();
  const geocoder = new google.maps.Geocoder();
  const { results } = await geocoder.geocode({ address });
  const first = results?.[0];
  if (!first) return null;
  const loc = first.geometry?.location;
  return {
    formattedAddress: first.formatted_address,
    location: { lat: loc?.lat() ?? 0, lng: loc?.lng() ?? 0 },
    placeId: first.place_id,
    raw: first,
  };
}

export type { LatLng, GeocodingResult };


