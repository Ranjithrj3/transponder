import { TelemetryPacket } from '../types';

/**
 * Parses a telemetry string received from the ESP32 LoRa Ground Receiver via Serial.
 * Expected format:
 * ID=DRONE1,SEQ=102,LAT=37.774900,LON=-122.419400,ALT=120.50,SPD=15.20,CRS=180.00,SAT=12,HDOP=0.9,DATE=2026-08-11,TIME=14:32:05,RSSI=-85,SNR=9.50
 */
export function parseTelemetryLine(line: string): TelemetryPacket | null {
  if (!line || typeof line !== 'string') return null;

  const trimmed = line.trim();
  if (!trimmed) return null;

  // Key-value extractor helper
  const getValue = (data: string, key: string): string => {
    const keyPrefix = `${key}=`;
    const startIdx = data.indexOf(keyPrefix);
    if (startIdx === -1) return '';

    const valStart = startIdx + keyPrefix.length;
    const commaIdx = data.indexOf(',', valStart);
    const endIdx = commaIdx === -1 ? data.length : commaIdx;

    return data.substring(valStart, endIdx).trim();
  };

  const id = getValue(trimmed, 'ID');
  const seqStr = getValue(trimmed, 'SEQ');
  const latStr = getValue(trimmed, 'LAT');
  const lonStr = getValue(trimmed, 'LON');

  // At minimum, we need LAT and LON to form a valid packet
  if (!latStr || !lonStr) {
    return null;
  }

  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);

  // Basic boundary checks for coordinates
  if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return null;
  }

  const seq = parseInt(seqStr, 10) || 0;
  const alt = parseFloat(getValue(trimmed, 'ALT')) || 0;
  const spd = parseFloat(getValue(trimmed, 'SPD')) || 0;
  const crs = parseFloat(getValue(trimmed, 'CRS')) || 0;
  const sat = parseInt(getValue(trimmed, 'SAT'), 10) || 0;
  const hdop = parseFloat(getValue(trimmed, 'HDOP')) || 99.9;
  const date = getValue(trimmed, 'DATE') || new Date().toISOString().split('T')[0];
  const time = getValue(trimmed, 'TIME') || new Date().toTimeString().split(' ')[0];
  const rssi = parseInt(getValue(trimmed, 'RSSI'), 10) || -120;
  const snr = parseFloat(getValue(trimmed, 'SNR')) || -20.0;

  return {
    id: id || 'UNKNOWN',
    seq,
    lat,
    lon,
    alt,
    spd,
    crs: ((crs % 360) + 360) % 360, // Ensure 0-360 range
    sat,
    hdop,
    date,
    time,
    rssi,
    snr,
    timestamp: Date.now(),
    rawLine: trimmed,
  };
}

/**
 * Formats a telemetry packet back to the ESP32 serial ASCII format
 */
export function formatTelemetryLine(packet: Partial<TelemetryPacket>): string {
  const p = {
    id: packet.id || 'DRONE01',
    seq: packet.seq ?? 0,
    lat: packet.lat ?? 0.0,
    lon: packet.lon ?? 0.0,
    alt: packet.alt ?? 0.0,
    spd: packet.spd ?? 0.0,
    crs: packet.crs ?? 0.0,
    sat: packet.sat ?? 0,
    hdop: packet.hdop ?? 1.0,
    date: packet.date || new Date().toISOString().split('T')[0],
    time: packet.time || new Date().toTimeString().split(' ')[0],
    rssi: packet.rssi ?? -85,
    snr: packet.snr ?? 9.5,
  };

  return `ID=${p.id},SEQ=${p.seq},LAT=${p.lat.toFixed(6)},LON=${p.lon.toFixed(6)},ALT=${p.alt.toFixed(2)},SPD=${p.spd.toFixed(2)},CRS=${p.crs.toFixed(2)},SAT=${p.sat},HDOP=${p.hdop.toFixed(1)},DATE=${p.date},TIME=${p.time},RSSI=${p.rssi},SNR=${p.snr.toFixed(2)}`;
}
