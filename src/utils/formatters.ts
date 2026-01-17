/**
 * Formats a distance in meters to a human-readable string
 * @param meters - Distance in meters
 * @returns Formatted distance string (e.g., "5.2 km" or "3.1 mi")
 */
export function formatDistance(meters: number, unit: 'metric' | 'imperial' = 'metric'): string {
  if (unit === 'imperial') {
    const miles = meters / 1609.34;
    return `${miles.toFixed(2)} mi`;
  }
  
  const km = meters / 1000;
  return `${km.toFixed(2)} km`;
}

/**
 * Formats a duration in seconds to a human-readable string
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (e.g., "1h 23m 45s")
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts: string[] = [];
  
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  
  if (secs > 0 || parts.length === 0) {
    parts.push(`${secs}s`);
  }
  
  return parts.join(' ');
}

/**
 * Formats a pace in meters/second to min/km or min/mile
 * @param metersPerSecond - Speed in meters per second
 * @param unit - 'metric' for min/km, 'imperial' for min/mile
 * @returns Formatted pace string (e.g., "5:30 /km")
 */
export function formatPace(metersPerSecond: number, unit: 'metric' | 'imperial' = 'metric'): string {
  if (metersPerSecond === 0) {
    return '-- /km';
  }
  
  const kmPerHour = metersPerSecond * 3.6;
  
  let minutesPerUnit: number;
  let unitLabel: string;
  
  if (unit === 'imperial') {
    const milesPerHour = kmPerHour / 1.60934;
    minutesPerUnit = 60 / milesPerHour;
    unitLabel = '/mi';
  } else {
    minutesPerUnit = 60 / kmPerHour;
    unitLabel = '/km';
  }
  
  const minutes = Math.floor(minutesPerUnit);
  const seconds = Math.round((minutesPerUnit - minutes) * 60);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')} ${unitLabel}`;
}

/**
 * Formats elevation in meters to a human-readable string
 * @param meters - Elevation in meters
 * @param unit - 'metric' for meters, 'imperial' for feet
 * @returns Formatted elevation string (e.g., "250 m" or "820 ft")
 */
export function formatElevation(meters: number, unit: 'metric' | 'imperial' = 'metric'): string {
  if (unit === 'imperial') {
    const feet = meters * 3.28084;
    return `${Math.round(feet)} ft`;
  }
  
  return `${Math.round(meters)} m`;
}

/**
 * Formats a date string to a more readable format
 * @param dateString - ISO date string
 * @returns Formatted date string (e.g., "Jan 13, 2024 at 6:00 AM")
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
