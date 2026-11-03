import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ConnectionStatus, 
  ConnectionType, 
  FlightStats, 
  HomeLocation, 
  MapSettings, 
  SerialLogMessage, 
  SimulatorConfig, 
  TelemetryPacket 
} from './types';
import { parseTelemetryLine } from './utils/telemetryParser';
import { calculateDistanceMeters } from './utils/geoUtils';
import { Header } from './components/Header';
import { MapContainer } from './components/MapContainer';
import { HUDAttitude } from './components/HUDAttitude';
import { TelemetryPanel } from './components/TelemetryPanel';
import { SignalQualityMeter } from './components/SignalQualityMeter';
import { SerialTerminal } from './components/SerialTerminal';
import { PythonBridgeModal } from './components/PythonBridgeModal';
import { FlightStatsCard } from './components/FlightStatsCard';
import { ExportDataModal } from './components/ExportDataModal';

export default function App() {
  // Connection State
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [connectionType, setConnectionType] = useState<ConnectionType>('websocket');

  // Telemetry State
  const [lastPacket, setLastPacket] = useState<TelemetryPacket | null>(null);
  const [prevPacket, setPrevPacket] = useState<TelemetryPacket | null>(null);
  const [history, setHistory] = useState<TelemetryPacket[]>([]);
  const [logs, setLogs] = useState<SerialLogMessage[]>([]);
  const [homeLocation, setHomeLocation] = useState<HomeLocation | null>(null);

  // Flight Statistics
  const [flightStats, setFlightStats] = useState<FlightStats>({
    maxAlt: 0,
    maxSpd: 0,
    distTraveled: 0,
    distFromHome: 0,
    totalPackets: 0,
    packetsLost: 0,
    lastSeq: 0,
    avgRssi: -85,
    avgSnr: 9.5,
    startTime: null,
    lastPacketTime: null,
  });

  // Recording State
  const [isRecording, setIsRecording] = useState<boolean>(true);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);

  // Map Settings State
  const [mapSettings, setMapSettings] = useState<MapSettings>({
    tileLayer: 'dark',
    followDrone: true,
    showTrail: true,
    showWaypoints: true,
    trailLength: 500,
  });

  // Simulator Config State
  const [simConfig, setSimConfig] = useState<SimulatorConfig>({
    mode: 'orbit',
    speedMs: 14.5,
    radiusMeters: 250,
    centerLat: 37.774900,
    centerLon: -122.419400,
    altitudeMeters: 125.0,
    rssiBase: -82,
    snrBase: 9.5,
    packetIntervalMs: 1000,
    simulatePacketDrop: false,
  });

  // Modals
  const [isBridgeModalOpen, setIsBridgeModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const serialPortRef = useRef<any>(null);
  const serialReaderRef = useRef<any>(null);
  const simIntervalRef = useRef<any>(null);
  const recordingTimerRef = useRef<any>(null);
  const hasInitialAutoHomeSetRef = useRef(false);

  // Add Log Message helper
  const addLog = useCallback((data: string, type: 'incoming' | 'system' | 'error' | 'sent' = 'incoming') => {
    const timeStr = new Date().toTimeString().split(' ')[0];
    const newMsg: SerialLogMessage = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: timeStr,
      data,
      type,
    };
    setLogs((prev) => [...prev.slice(-300), newMsg]); // Keep last 300 logs
  }, []);

  // Process Raw Telemetry Line
  const processTelemetryLine = useCallback((rawLine: string) => {
    addLog(rawLine, 'incoming');

    const packet = parseTelemetryLine(rawLine);
    if (!packet) return;

    setPrevPacket((prev) => {
      setLastPacket(packet);

      // Set Home Location automatically on first 3D GPS fix if not set yet
      if (packet.sat >= 4 && !homeLocation && !hasInitialAutoHomeSetRef.current) {
        hasInitialAutoHomeSetRef.current = true;
        setHomeLocation({
          lat: packet.lat,
          lon: packet.lon,
          alt: packet.alt,
          setAt: Date.now(),
        });
      }

      // Record in History if recording enabled
      if (isRecording) {
        setHistory((prevHist) => [...prevHist.slice(-2000), packet]);
      }

      // Calculate Flight Statistics
      setFlightStats((prevStats) => {
        const isFirst = prevStats.totalPackets === 0;
        const newTotal = prevStats.totalPackets + 1;

        // Sequence loss calculation
        let seqLoss = 0;
        if (prevStats.lastSeq > 0 && packet.seq > prevStats.lastSeq + 1) {
          seqLoss = packet.seq - prevStats.lastSeq - 1;
        }

        // Distance traveled incremental
        let incrementalDist = 0;
        if (prev) {
          incrementalDist = calculateDistanceMeters(prev.lat, prev.lon, packet.lat, packet.lon);
        }

        return {
          maxAlt: Math.max(prevStats.maxAlt, packet.alt),
          maxSpd: Math.max(prevStats.maxSpd, packet.spd),
          distTraveled: prevStats.distTraveled + incrementalDist,
          distFromHome: homeLocation
            ? calculateDistanceMeters(homeLocation.lat, homeLocation.lon, packet.lat, packet.lon)
            : 0,
          totalPackets: newTotal,
          packetsLost: prevStats.packetsLost + seqLoss,
          lastSeq: packet.seq,
          avgRssi: Math.round((prevStats.avgRssi * (newTotal - 1) + packet.rssi) / newTotal),
          avgSnr: parseFloat(((prevStats.avgSnr * (newTotal - 1) + packet.snr) / newTotal).toFixed(2)),
          startTime: prevStats.startTime || Date.now(),
          lastPacketTime: Date.now(),
        };
      });

      return packet;
    });
  }, [addLog, homeLocation, isRecording]);

  // Connect Server WebSocket
  const connectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    addLog(`Connecting to GCS Server WebSocket: ${wsUrl}...`, 'system');
    setConnectionStatus('connecting');
    setConnectionType('websocket');

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('connected');
      addLog('GCS Server WebSocket Connected successfully!', 'system');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'TELEMETRY' && data.raw) {
          processTelemetryLine(data.raw);
        }
      } catch {
        if (typeof event.data === 'string') {
          processTelemetryLine(event.data);
        }
      }
    };

    ws.onerror = (err) => {
      addLog(`WebSocket Error occurred. Verify Python bridge is running.`, 'error');
      setConnectionStatus('error');
    };

    ws.onclose = () => {
      addLog('WebSocket connection closed.', 'system');
      if (connectionType === 'websocket') {
        setConnectionStatus('disconnected');
      }
    };
  }, [addLog, connectionType, processTelemetryLine]);

  // Connect Direct WebSerial (Chrome / Edge COM5 @ 115200)
  const connectWebSerial = async () => {
    if (!('serial' in navigator)) {
      alert('WebSerial is not supported in this browser. Use Google Chrome, Microsoft Edge, or the Python Bridge script.');
      return;
    }

    try {
      addLog('Requesting USB Serial device (COM5) at 115200 baud...', 'system');
      setConnectionStatus('connecting');

      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 115200 });

      serialPortRef.current = port;
      setConnectionStatus('connected');
      setConnectionType('webserial');
      addLog('WebSerial Port COM5 Connected @ 115200 Baud!', 'system');

      const textDecoder = new TextDecoderStream();
      const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();
      serialReaderRef.current = reader;

      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          reader.releaseLock();
          break;
        }
        if (value) {
          buffer += value;
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete trailing line

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed) {
              processTelemetryLine(trimmed);
            }
          }
        }
      }
    } catch (err: any) {
      addLog(`WebSerial Error: ${err.message || err}`, 'error');
      setConnectionStatus('error');
    }
  };

  // Disconnect active connection
  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (serialReaderRef.current) {
      serialReaderRef.current.cancel().catch(() => {});
      serialReaderRef.current = null;
    }
    if (serialPortRef.current) {
      serialPortRef.current.close().catch(() => {});
      serialPortRef.current = null;
    }
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }

    setConnectionStatus('disconnected');
    addLog('Disconnected all hardware connections.', 'system');
  };

  // Start Hardware Telemetry Simulator
  const startSimulator = () => {
    disconnect();

    setConnectionStatus('simulating');
    setConnectionType('simulator');
    addLog('Hardware Telemetry Simulator started (generating ESP32 packets)...', 'system');

    let seq = 1;
    let angle = 0;

    simIntervalRef.current = setInterval(() => {
      angle = (angle + 0.05) % (2 * Math.PI);
      const r = simConfig.radiusMeters / 111000; // Radius to lat/lon degrees approx

      let lat = simConfig.centerLat;
      let lon = simConfig.centerLon;
      let crs = (angle * (180 / Math.PI) + 90) % 360;

      if (simConfig.mode === 'orbit') {
        lat = simConfig.centerLat + r * Math.sin(angle);
        lon = simConfig.centerLon + r * Math.cos(angle);
      } else if (simConfig.mode === 'linear') {
        lat = simConfig.centerLat + (seq * 0.00005);
        lon = simConfig.centerLon + (seq * 0.00005);
        crs = 45.0;
      } else if (simConfig.mode === 'waypoint') {
        const step = Math.floor(seq / 20) % 4;
        if (step === 0) { lat += 0.0005; crs = 0; }
        else if (step === 1) { lon += 0.0005; crs = 90; }
        else if (step === 2) { lat -= 0.0005; crs = 180; }
        else { lon -= 0.0005; crs = 270; }
      }

      const alt = simConfig.altitudeMeters + (Math.sin(angle) * 15);
      const spd = simConfig.speedMs + (Math.random() * 1.5 - 0.75);
      const rssi = simConfig.rssiBase + Math.floor(Math.random() * 6 - 3);
      const snr = simConfig.snrBase + (Math.random() * 2 - 1);

      const packetStr = `ID=DRONE01,SEQ=${seq},LAT=${lat.toFixed(6)},LON=${lon.toFixed(6)},ALT=${alt.toFixed(2)},SPD=${spd.toFixed(2)},CRS=${crs.toFixed(2)},SAT=12,HDOP=0.8,DATE=2026-08-11,TIME=${new Date().toTimeString().split(' ')[0]},RSSI=${rssi},SNR=${snr.toFixed(2)}`;

      processTelemetryLine(packetStr);
      seq += 1;
    }, simConfig.packetIntervalMs);
  };

  // Stop Simulator
  const stopSimulator = () => {
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    setConnectionStatus('disconnected');
    addLog('Simulator stopped.', 'system');
  };

  // Initial connect on mount
  useEffect(() => {
    connectWebSocket();

    return () => {
      disconnect();
    };
  }, []);

  // Recording Timer
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording]);

  // Handle Loss of Signal Test
  const handleSimulateLossOfSignal = () => {
    addLog('⚠️ EMERGENCY FAULT INJECTION: Simulated LoRa Signal Loss (Freeze 5s)...', 'error');
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      setTimeout(() => {
        if (connectionType === 'simulator') {
          startSimulator();
        }
      }, 5000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header Navigation */}
      <Header
        connectionStatus={connectionStatus}
        connectionType={connectionType}
        lastPacket={lastPacket}
        packetCount={history.length}
        isRecording={isRecording}
        recordingDuration={recordingDuration}
        onToggleRecording={() => setIsRecording(!isRecording)}
        onOpenBridgeModal={() => setIsBridgeModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onConnectWebSerial={connectWebSerial}
        onDisconnect={disconnect}
      />

      {/* Main Ground Station Layout Container */}
      <main className="flex-1 p-3 md:p-4 grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4 items-stretch max-w-[1920px] mx-auto w-full">
        {/* Left Column (Map & PFD Flight Horizon) - 8 Cols on Large Screens */}
        <div className="lg:col-span-8 flex flex-col gap-3 md:gap-4">
          {/* Leaflet Interactive Map */}
          <div className="h-[480px] md:h-[580px] w-full">
            <MapContainer
              lastPacket={lastPacket}
              history={history}
              homeLocation={homeLocation}
              onSetHomeLocation={(loc) => setHomeLocation(loc)}
              mapSettings={mapSettings}
              onUpdateMapSettings={(st) => setMapSettings((prev) => ({ ...prev, ...st }))}
            />
          </div>

          {/* Primary Flight Display (HUD / Horizon Gauges) */}
          <div className="min-h-[240px]">
            <HUDAttitude lastPacket={lastPacket} prevPacket={prevPacket} />
          </div>
        </div>

        {/* Right Column (Live Telemetry Matrix, Link Health, Console Stream) - 4 Cols */}
        <div className="lg:col-span-4 flex flex-col gap-3 md:gap-4">
          {/* Mission Stats Card */}
          <FlightStatsCard stats={flightStats} />

          {/* Telemetry Matrix Grid */}
          <TelemetryPanel lastPacket={lastPacket} prevPacket={prevPacket} />

          {/* RF Link Quality & Packet Loss Meter */}
          <SignalQualityMeter
            lastPacket={lastPacket}
            totalPackets={flightStats.totalPackets}
            packetsLost={flightStats.packetsLost}
          />

          {/* Serial Console Log Stream */}
          <SerialTerminal
            logs={logs}
            onClearLogs={() => setLogs([])}
          />
        </div>
      </main>

      {/* Modals */}
      <PythonBridgeModal
        isOpen={isBridgeModalOpen}
        onClose={() => setIsBridgeModalOpen(false)}
      />

      <ExportDataModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        history={history}
      />
    </div>
  );
}
