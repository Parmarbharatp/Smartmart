# Location & Maps Setup (Scaffold)

This project is pre-wired for Google Maps JS API usage without UI integration yet. Follow these steps to enable it.

## 1) Get an API key

- Create a key in Google Cloud Console and enable:
  - Maps JavaScript API
  - Geocoding API
  - Places API (optional, used for autocomplete later)
- Restrict the key to your web origins in production.

## 2) Configure frontend env

Edit `project/env.config`:

```
VITE_MAPS_PROVIDER=google
VITE_MAPS_API_KEY=YOUR_KEY_HERE
VITE_MAPS_PLACES_ENABLED=true
VITE_MAPS_GEOCODING_ENABLED=true
```

Restart the dev server after changes.

## 3) (Optional) Configure backend env

If backend services need geocoding later, set in `backend/config.env`:

```
MAPS_PROVIDER=google
MAPS_API_KEY=YOUR_KEY_HERE
MAPS_GEOCODING_ENABLED=true
```

## 4) Usage in code (example)

Wrap your app with `LocationProvider` when you are ready to integrate:

```tsx
import { LocationProvider } from './src/contexts/LocationContext';

// In your root component
<LocationProvider>{/* your app */}</LocationProvider>
```

Then, in a component:

```tsx
import { useLocationContext } from '../contexts/LocationContext';

const Example = () => {
  const { ensureMaps, locateMe, reverse } = useLocationContext();
  // await ensureMaps(); await locateMe(); then call reverse({lat,lng})
  return null;
};
```

No components or pages were modified to use this yet.

