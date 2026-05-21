import { useState, useCallback } from 'react';

/**
 * Hook para obtener geolocalización del navegador + reverse geocoding (OSM Nominatim).
 *
 * Uso:
 *   const { coords, loading, error, locate, geocode } = useGeolocation();
 *   <button onClick={locate}>Obtener mi ubicación</button>
 */
export function useGeolocation() {
  const [coords, setCoords] = useState(null);    // { latitude, longitude, accuracy }
  const [address, setAddress] = useState(null);  // string formateado o null
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /** Reverse geocoding usando Nominatim de OpenStreetMap (sin API key) */
  const geocode = useCallback(async (lat, lng) => {
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=es`,
        { headers: { 'Accept': 'application/json' } }
      );
      if (!r.ok) throw new Error('Reverse geocode failed');
      const data = await r.json();
      // Construir dirección legible
      const a = data.address || {};
      const road    = a.road || a.pedestrian || '';
      const houseNo = a.house_number ? ` ${a.house_number}` : '';
      const district = a.suburb || a.neighbourhood || a.city_district || a.town || '';
      const formatted = (road + houseNo).trim() || data.display_name || '';
      setAddress({ formatted, district, display_name: data.display_name });
      return { formatted, district, display_name: data.display_name };
    } catch (e) {
      console.warn('Reverse geocode:', e);
      return null;
    }
  }, []);

  const locate = useCallback(() => {
    setError('');
    if (!('geolocation' in navigator)) {
      setError('Tu navegador no soporta geolocalización.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const c = {
          latitude:  pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy:  pos.coords.accuracy,
        };
        setCoords(c);
        await geocode(c.latitude, c.longitude);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        const msg = {
          1: 'Permiso denegado. Activa la ubicación en tu navegador.',
          2: 'No se pudo obtener la posición (sin señal GPS).',
          3: 'Tiempo de espera agotado.',
        }[err.code] || 'Error al obtener ubicación.';
        setError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, [geocode]);

  const clear = useCallback(() => {
    setCoords(null);
    setAddress(null);
    setError('');
  }, []);

  return { coords, address, loading, error, locate, geocode, clear, setCoords };
}
