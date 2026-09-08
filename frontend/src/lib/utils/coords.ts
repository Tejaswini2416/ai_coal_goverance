/**
 * Geospatial coordinate parsing and reordering utilities.
 * PostGIS uses POINT(lon lat).
 * Leaflet uses [lat, lon].
 */

export function parsePoint(pointStr?: string | null): [number, number] | null {
  if (!pointStr) return null;
  const match = pointStr.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
  if (!match) return null;
  const lon = parseFloat(match[1]);
  const lat = parseFloat(match[2]);
  if (isNaN(lon) || isNaN(lat)) return null;
  return [lat, lon]; // Return Leaflet order: [latitude, longitude]
}

export function formatGpsLocation(lat: number, lon: number): string {
  // PostGIS standard: POINT(lon lat)
  return `POINT(${lon.toFixed(6)} ${lat.toFixed(6)})`;
}

export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
