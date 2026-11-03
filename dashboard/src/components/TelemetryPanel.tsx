import React from 'react';
import { 
  Compass, 
  MapPin, 
  Mountain, 
  Gauge, 
  Satellite, 
  Wifi, 
  Calendar, 
  Clock, 
  Hash, 
  Radio, 
  ShieldCheck,
  Zap,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { TelemetryPacket } from '../types';
import { getHdopQuality, getRssiQuality } from '../utils/geoUtils';

interface TelemetryPanelProps {
  lastPacket: TelemetryPacket | null;
  prevPacket: TelemetryPacket | null;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({ lastPacket, prevPacket }) => {
  const rssiInfo = lastPacket ? getRssiQuality(lastPacket.rssi) : null;
  const hdopInfo = lastPacket ? getHdopQuality(lastPacket.hdop) : null;

  return (
    <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-4 shadow-md flex flex-col gap-3 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700 pb-2.5">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-blue-400" />
          <h2 className="font-bold text-white text-xs tracking-wider uppercase">
            PRIMARY TELEMETRY MATRIX
          </h2>
        </div>
        <span className="text-[10px] text-slate-400 bg-[#0f172a] px-2.5 py-1 rounded-full border border-slate-700 font-mono">
          ID: <strong className="text-blue-400">{lastPacket ? lastPacket.id : 'DRONE_ALPHA_01'}</strong>
        </span>
      </div>

      {/* Primary Telemetry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {/* Altitude */}
        <div className="bg-[#0f172a] border border-slate-700/80 p-3 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] text-blue-400 uppercase font-bold tracking-wider">ALTITUDE (AMSL)</span>
          <p className="text-2xl font-mono text-white my-1">
            {lastPacket ? lastPacket.alt.toFixed(2) : '124.50'}
            <span className="text-xs ml-1 text-slate-400 font-sans">m</span>
          </p>
          <span className="text-[10px] text-slate-500">
            {lastPacket ? `${(lastPacket.alt * 3.28084).toFixed(1)} ft` : '408.5 ft MSL'}
          </span>
        </div>

        {/* Speed */}
        <div className="bg-[#0f172a] border border-slate-700/80 p-3 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] text-blue-400 uppercase font-bold tracking-wider">GROUND SPEED</span>
          <p className="text-2xl font-mono text-white my-1">
            {lastPacket ? lastPacket.spd.toFixed(2) : '15.20'}
            <span className="text-xs ml-1 text-slate-400 font-sans">m/s</span>
          </p>
          <span className="text-[10px] text-slate-500">
            {lastPacket ? `${(lastPacket.spd * 3.6).toFixed(1)} km/h` : '54.7 km/h'}
          </span>
        </div>

        {/* Latitude */}
        <div className="bg-[#0f172a] border border-slate-700/80 p-3 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">LATITUDE</span>
          <p className="text-lg font-mono text-slate-100 my-1">
            {lastPacket ? lastPacket.lat.toFixed(6) : '40.712800'}
          </p>
          <span className="text-[10px] text-slate-500">degrees N</span>
        </div>

        {/* Longitude */}
        <div className="bg-[#0f172a] border border-slate-700/80 p-3 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">LONGITUDE</span>
          <p className="text-lg font-mono text-slate-100 my-1">
            {lastPacket ? lastPacket.lon.toFixed(6) : '-74.006000'}
          </p>
          <span className="text-[10px] text-slate-500">degrees W</span>
        </div>

        {/* Satellites */}
        <div className="bg-[#0f172a] border border-slate-700/80 p-3 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">SATELLITES</span>
          <div className="flex items-baseline space-x-1 my-1">
            <span className="text-xl font-mono text-emerald-400">{lastPacket ? lastPacket.sat : '09'}</span>
            <span className="text-[10px] text-slate-500">3D-FIX</span>
          </div>
          <span className="text-[10px] text-slate-500">GPS Constellation</span>
        </div>

        {/* HDOP */}
        <div className="bg-[#0f172a] border border-slate-700/80 p-3 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">HDOP</span>
          <p className="text-xl font-mono text-white my-1">
            {lastPacket ? lastPacket.hdop.toFixed(1) : '1.2'}
          </p>
          <span className="text-[10px] text-slate-500">Dilution Precision</span>
        </div>

        {/* Sequence Counter */}
        <div className="bg-[#0f172a] border border-slate-700/80 p-3 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">SEQ PACKET</span>
          <p className="text-lg font-mono text-blue-300 my-1">
            {lastPacket ? `#${lastPacket.seq}` : '#1245'}
          </p>
          <span className="text-[10px] text-slate-500 font-mono">sync uint32</span>
        </div>

        {/* LoRa RSSI */}
        <div className="bg-[#0f172a] border border-slate-700/80 p-3 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">LORA RSSI</span>
          <p className="text-lg font-mono text-white my-1">
            {lastPacket ? `${lastPacket.rssi} dBm` : '-85 dBm'}
          </p>
          <span className="text-[10px] text-slate-500">Signal Power</span>
        </div>

        {/* LoRa SNR */}
        <div className="bg-[#0f172a] border border-slate-700/80 p-3 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">LORA SNR</span>
          <p className="text-lg font-mono text-emerald-400 my-1">
            {lastPacket ? `${lastPacket.snr.toFixed(2)} dB` : '9.50 dB'}
          </p>
          <span className="text-[10px] text-slate-500">Signal-to-Noise</span>
        </div>

        {/* GPS Date */}
        <div className="bg-[#0f172a] border border-slate-700/80 p-3 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">UTC DATE</span>
          <p className="text-sm font-mono text-slate-200 my-1">
            {lastPacket ? lastPacket.date : '2026-08-11'}
          </p>
          <span className="text-[10px] text-slate-500">GPS Date</span>
        </div>

        {/* GPS Time */}
        <div className="bg-[#0f172a] border border-slate-700/80 p-3 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">UTC TIME</span>
          <p className="text-sm font-mono text-slate-200 my-1">
            {lastPacket ? lastPacket.time : '14:20:55'}
          </p>
          <span className="text-[10px] text-slate-500">GPS Time</span>
        </div>
      </div>
    </div>
  );
};
