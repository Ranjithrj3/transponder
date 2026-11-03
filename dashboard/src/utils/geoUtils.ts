/**
 * Distance in meters between two lat/lon points using the Haversine formula
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radius of Earth in meters
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
 * Calculates initial bearing/heading from point 1 to point 2 in degrees (0..360)
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const theta = Math.atan2(y, x);
  const bearing = ((theta * 180) / Math.PI + 360) % 360;
  return bearing;
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
}

export function formatSpeed(speedMps: number, unit: 'mps' | 'kmh' | 'knots' | 'mph' = 'mps'): string {
  switch (unit) {
    case 'kmh':
      return `${(speedMps * 3.6).toFixed(1)} km/h`;
    case 'knots':
      return `${(speedMps * 1.94384).toFixed(1)} kts`;
    case 'mph':
      return `${(speedMps * 2.23694).toFixed(1)} mph`;
    case 'mps':
    default:
      return `${speedMps.toFixed(1)} m/s`;
  }
}

export function getRssiQuality(rssi: number): {
  label: string;
  color: string;
  percent: number;
} {
  // RSSI typically -120 dBm (worst) to -30 dBm (best)
  if (rssi >= -65) {
    return { label: 'Strong', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', percent: 100 };
  } else if (rssi >= -85) {
    return { label: 'Good', color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10', percent: 75 };
  } else if (rssi >= -105) {
    return { label: 'Fair', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10', percent: 45 };
  } else if (rssi >= -120) {
    return { label: 'Weak', color: 'text-rose-400 border-rose-500/30 bg-rose-500/10', percent: 20 };
  } else {
    return { label: 'No Signal', color: 'text-slate-500 border-slate-700 bg-slate-800/40', percent: 0 };
  }
}

export function getHdopQuality(hdop: number): { label: string; color: string } {
  if (hdop <= 1.0) return { label: 'Ideal', color: 'text-emerald-400' };
  if (hdop <= 2.0) return { label: 'Excellent', color: 'text-cyan-400' };
  if (hdop <= 5.0) return { label: 'Good', color: 'text-amber-400' };
  if (hdop <= 10.0) return { label: 'Moderate', color: 'text-orange-400' };
  return { label: 'Poor', color: 'text-rose-400' };
}
