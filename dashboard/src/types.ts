export interface TelemetryPacket {
  id: string;          // Drone/Vehicle ID (e.g. DRONE01)
  seq: number;          // Sequence counter (uint32)
  lat: number;          // Latitude (-90 to 90)
  lon: number;          // Longitude (-180 to 180)
  alt: number;          // Altitude in meters
  spd: number;          // Speed in m/s or knots
  crs: number;          // Course / Heading in degrees (0 - 360)
  sat: number;          // Number of GPS satellites
  hdop: number;         // Horizontal Dilution of Precision
  date: string;         // GPS Date string (YYYY-MM-DD or DD/MM/YY)
  time: string;         // GPS Time string (HH:MM:SS)
  rssi: number;         // LoRa Received Signal Strength Indicator (dBm)
  snr: number;          // LoRa Signal-to-Noise Ratio (dB)
  timestamp: number;    // Receiver local arrival timestamp (ms)
  rawLine?: string;     // Raw ASCII line from serial
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'simulating' | 'error';
export type ConnectionType = 'webserial' | 'websocket' | 'simulator';

export interface HomeLocation {
  lat: number;
  lon: number;
  alt: number;
  setAt: number; // Timestamp
}

export interface FlightStats {
  maxAlt: number;
  maxSpd: number;
  distTraveled: number;     // in meters
  distFromHome: number;     // in meters
  totalPackets: number;
  packetsLost: number;
  lastSeq: number;
  avgRssi: number;
  avgSnr: number;
  startTime: number | null; // Flight start timestamp
  lastPacketTime: number | null;
}

export type TileLayerType = 'osm' | 'satellite' | 'dark' | 'topo';

export interface MapSettings {
  tileLayer: TileLayerType;
  followDrone: boolean;
  showTrail: boolean;
  showWaypoints: boolean;
  trailLength: number; // Max trail points to draw
}

export interface SerialLogMessage {
  id: string;
  timestamp: string;
  data: string;
  type: 'incoming' | 'system' | 'error' | 'sent';
}

export interface SimulatorConfig {
  mode: 'orbit' | 'waypoint' | 'linear' | 'stationary';
  speedMs: number;
  radiusMeters: number;
  centerLat: number;
  centerLon: number;
  altitudeMeters: number;
  rssiBase: number;
  snrBase: number;
  packetIntervalMs: number;
  simulatePacketDrop: boolean;
}
