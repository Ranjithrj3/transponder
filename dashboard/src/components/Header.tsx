import React from 'react';
import { 
  Radio, 
  Satellite, 
  Wifi, 
  Terminal, 
  Play, 
  Square, 
  Download, 
  Zap,
} from 'lucide-react';
import { ConnectionStatus, ConnectionType, TelemetryPacket } from '../types';
import { getRssiQuality } from '../utils/geoUtils';

interface HeaderProps {
  connectionStatus: ConnectionStatus;
  connectionType: ConnectionType;
  lastPacket: TelemetryPacket | null;
  packetCount: number;
  isRecording: boolean;
  recordingDuration: number;
  onToggleRecording: () => void;
  onOpenBridgeModal: () => void;
  onOpenExportModal: () => void;
  onConnectWebSerial: () => void;
  onDisconnect: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  connectionStatus,
  connectionType,
  lastPacket,
  packetCount,
  isRecording,
  recordingDuration,
  onToggleRecording,
  onOpenBridgeModal,
  onOpenExportModal,
  onConnectWebSerial,
  onDisconnect,
}) => {
  const rssiInfo = lastPacket ? getRssiQuality(lastPacket.rssi) : null;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="bg-[#1e293b] border-b border-slate-700 px-4 md:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-lg z-20 sticky top-0">
      {/* Brand & System Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]">
          <Radio className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-white uppercase font-sans">
              LORA GCS <span className="text-blue-400 font-normal text-sm">v1.0.4</span>
            </h1>
          </div>
          <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
            {lastPacket ? `ID: ${lastPacket.id} | Active Link` : 'Ground Control Station | Terminal Active'}
          </p>
        </div>
      </div>

      {/* Center Status Indicators */}
      <div className="flex items-center gap-2 sm:gap-3 font-mono text-xs overflow-x-auto py-1">
        {/* Connection Status Badge */}
        <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
          <span
            className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected'
                ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse'
                : connectionStatus === 'simulating'
                ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                : connectionStatus === 'connecting'
                ? 'bg-blue-500 animate-ping'
                : 'bg-rose-500'
            }`}
          />
          <span className="text-slate-400">WEBSOCKET:</span>
          <span
            className={`font-bold ${
              connectionStatus === 'connected'
                ? 'text-emerald-400'
                : connectionStatus === 'simulating'
                ? 'text-amber-400'
                : 'text-slate-300'
            }`}
          >
            {connectionStatus === 'connected'
              ? `CONNECTED (${connectionType.toUpperCase()})`
              : connectionStatus === 'simulating'
              ? 'SIMULATING'
              : connectionStatus.toUpperCase()}
          </span>
        </div>

        {/* Frequency / Link */}
        <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
          <span className="text-slate-400">FREQ:</span>
          <span className="text-blue-300 font-bold">433.00 MHz</span>
        </div>

        {/* Satellites & HDOP */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 text-xs">
          <Satellite className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-slate-400">SAT:</span>
          <span className="text-emerald-400 font-bold">{lastPacket ? lastPacket.sat : '--'}</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">HDOP:</span>
          <span className="text-white font-bold">{lastPacket ? lastPacket.hdop.toFixed(1) : '--'}</span>
        </div>

        {/* RSSI & SNR */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 text-xs">
          <Wifi className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-slate-400">RSSI:</span>
          <span className="text-white font-bold">{lastPacket ? `${lastPacket.rssi} dBm` : '--'}</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">SNR:</span>
          <span className="text-emerald-400 font-bold">{lastPacket ? `${lastPacket.snr} dB` : '--'}</span>
        </div>
      </div>

      {/* Right Actions & Controls */}
      <div className="flex items-center gap-2">
        {/* Record Flight Button */}
        <button
          onClick={onToggleRecording}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 border transition-all ${
            isRecording
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.3)] animate-pulse'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
          }`}
          title={isRecording ? 'Stop Recording Flight Log' : 'Start Recording Flight Log'}
        >
          {isRecording ? (
            <>
              <Square className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
              <span>REC {formatDuration(recordingDuration)}</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
              <span>REC LOG</span>
            </>
          )}
        </button>

        {/* WebSerial Connect */}
        {'serial' in navigator && (
          <button
            onClick={connectionStatus === 'connected' && connectionType === 'webserial' ? onDisconnect : onConnectWebSerial}
            className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all"
            title="Connect COM5 directly using WebSerial API in browser"
          >
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">
              {connectionStatus === 'connected' && connectionType === 'webserial' ? 'DISCONNECT' : 'COM5 (115200)'}
            </span>
          </button>
        )}

        {/* Python Bridge Setup */}
        <button
          onClick={onOpenBridgeModal}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all"
          title="Python Serial Bridge setup for COM5 @ 115200"
        >
          <Terminal className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">PYTHON BRIDGE</span>
        </button>

        {/* Export Data Button */}
        <button
          onClick={onOpenExportModal}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 p-2 rounded-lg text-xs transition-all"
          title="Export CSV/KML flight data"
        >
          <Download className="w-4 h-4 text-slate-300" />
        </button>
      </div>
    </header>
  );
};
