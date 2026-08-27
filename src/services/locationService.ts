import { CityLocation, TURKEY_CITIES, WORLD_CITIES } from '../data/islamicData';

export interface LocationDetectionResult {
  city: CityLocation;
  source: 'gps' | 'ip' | 'cache' | 'default';
  message: string;
}

/**
 * Calculates distance between two geographic coordinates in kilometers
 */
export function getDistanceFromLatLonInKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds the closest predefined city to given coordinates
 */
export function findClosestPredefinedCity(
  latitude: number,
  longitude: number
): CityLocation | null {
  const allKnown = [...WORLD_CITIES, ...TURKEY_CITIES];
  let closest: CityLocation | null = null;
  let minDistance = Infinity;

  for (const city of allKnown) {
    const dist = getDistanceFromLatLonInKm(
      latitude,
      longitude,
      city.latitude,
      city.longitude
    );
    if (dist < minDistance) {
      minDistance = dist;
      closest = city;
    }
  }

  // If closest is within 35 km, use it
  if (closest && minDistance <= 35) {
    return {
      ...closest,
      latitude,
      longitude,
      isAutoDetected: true,
    };
  }

  return null;
}

/**
 * Reverse geocodes latitude and longitude to human-readable city, state, country
 */
export async function reverseGeocodeCoordinates(
  latitude: number,
  longitude: number
): Promise<CityLocation> {
  // First check if it's very close to a known city (e.g. Wesley Chapel, FL: 28.1889, -82.3534)
  const closest = findClosestPredefinedCity(latitude, longitude);
  if (closest) {
    return closest;
  }

  // 1. Try our server-side reverse geocoding proxy
  try {
    const res = await fetch(
      `/api/reverse-geocode?lat=${latitude}&lng=${longitude}`,
      { headers: { Accept: 'application/json' } }
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.name) {
        return {
          name: data.name,
          country: data.country || 'Dünya',
          state: data.state,
          latitude,
          longitude,
          isAutoDetected: true,
        };
      }
    }
  } catch (e) {
    console.warn('Server reverse geocode failed, trying client fallback', e);
  }

  // 2. Client-side fallback to BigDataCloud free client reverse geocoding
  try {
    const bdcRes = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=tr`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (bdcRes.ok) {
      const bdcData = await bdcRes.json();
      const name =
        bdcData.locality ||
        bdcData.city ||
        bdcData.principalSubdivision ||
        'Mevcut Konum';
      let country = bdcData.countryName || 'Dünya';
      if (
        country === 'United States of America' ||
        country === 'United States' ||
        bdcData.countryCode === 'US'
      ) {
        country = bdcData.principalSubdivision
          ? `ABD (${bdcData.principalSubdivision})`
          : 'ABD';
      }

      return {
        name,
        country,
        state: bdcData.principalSubdivision,
        latitude,
        longitude,
        isAutoDetected: true,
      };
    }
  } catch (e) {
    console.warn('BigDataCloud reverse geocode failed', e);
  }

  // 3. Mathematical fallback with clean coordinates
  return {
    name: `Konum (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°)`,
    country: 'Otomatik Konum',
    latitude,
    longitude,
    isAutoDetected: true,
  };
}

/**
 * Automatically detects user location using GPS (first priority) or IP (fallback)
 */
export async function detectUserLocation(): Promise<LocationDetectionResult> {
  // Check GPS via navigator.geolocation first
  if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
              enableHighAccuracy: true,
              timeout: 9000,
              maximumAge: 60000, // 1 minute cache
            }
          );
        }
      );

      const { latitude, longitude } = position.coords;
      const city = await reverseGeocodeCoordinates(latitude, longitude);

      // Persist in localStorage
      try {
        localStorage.setItem('hayirhah_saved_city', JSON.stringify(city));
        localStorage.setItem('hayirhah_auto_location', 'true');
      } catch (e) {}

      return {
        city,
        source: 'gps',
        message: `GPS ile tespit edildi: ${city.name}, ${city.country}`,
      };
    } catch (gpsError: any) {
      console.warn('GPS location request failed or denied:', gpsError?.message);
    }
  }

  // Fallback: IP-based geolocation via server proxy or client
  try {
    const ipRes = await fetch('/api/ip-location', {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (ipRes.ok) {
      const data = await ipRes.json();
      if (data && data.latitude && data.longitude) {
        const city: CityLocation = {
          name: data.name || 'Otomatik Konum',
          country: data.country || 'Dünya',
          state: data.state,
          latitude: data.latitude,
          longitude: data.longitude,
          isAutoDetected: true,
        };

        try {
          localStorage.setItem('hayirhah_saved_city', JSON.stringify(city));
          localStorage.setItem('hayirhah_auto_location', 'true');
        } catch (e) {}

        return {
          city,
          source: 'ip',
          message: `İnternet konumu ile tespit edildi: ${city.name}, ${city.country}`,
        };
      }
    }
  } catch (ipErr) {
    console.warn('IP location fetch failed', ipErr);
  }

  // Fallback to saved city or default
  try {
    const saved = localStorage.getItem('hayirhah_saved_city');
    if (saved) {
      return {
        city: JSON.parse(saved),
        source: 'cache',
        message: 'Kayıtlı konum kullanılıyor',
      };
    }
  } catch (e) {}

  return {
    city: TURKEY_CITIES[0],
    source: 'default',
    message: 'Varsayılan şehir seçildi',
  };
}

/**
 * Searches any city or town worldwide by name
 */
export async function searchCitiesWorldwide(
  query: string
): Promise<CityLocation[]> {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length < 2) return [];

  // Local filter from predefined list first
  const localMatches = [...WORLD_CITIES, ...TURKEY_CITIES].filter(
    (c) =>
      c.name.toLowerCase().includes(trimmed) ||
      (c.country && c.country.toLowerCase().includes(trimmed)) ||
      (c.state && c.state.toLowerCase().includes(trimmed))
  );

  // If we already have strong local matches (>= 3), return them quickly
  if (localMatches.length >= 4) {
    return localMatches;
  }

  // Search online worldwide via /api/geocode
  try {
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      const results: CityLocation[] = (data?.results || []).map((r: any) => ({
        name: r.name,
        country: r.country || 'Dünya',
        state: r.state,
        latitude: r.latitude,
        longitude: r.longitude,
      }));

      // Combine local unique and online matches
      const combined = [...localMatches];
      for (const item of results) {
        if (
          !combined.some(
            (c) =>
              c.name.toLowerCase() === item.name.toLowerCase() &&
              c.country.toLowerCase() === item.country.toLowerCase()
          )
        ) {
          combined.push(item);
        }
      }
      return combined.slice(0, 15);
    }
  } catch (e) {
    console.warn('Online geocode search failed', e);
  }

  return localMatches;
}
