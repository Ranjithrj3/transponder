import React, { useState } from 'react';
import { Cpu, Play, Pause, RotateCcw, Sliders, AlertOctagon, X, Zap, WifiOff } from 'lucide-react';
import { SimulatorConfig } from '../types';

interface SimulatorControlsProps {
  isOpen: boolean;
  onClose: () => void;
  isSimulating: boolean;
  config: SimulatorConfig;
  onStartSimulator: () => void;
  onStopSimulator: () => void;
  onUpdateConfig: (cfg: Partial<SimulatorConfig>) => void;
  onSimulateLossOfSignal: () => void;
}

export const SimulatorControls: React.FC<SimulatorControlsProps> = ({
  isOpen,
  onClose,
  isSimulating,
  config,
  onStartSimulator,
  onStopSimulator,
  onUpdateConfig,
  onSimulateLossOfSignal,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-sans text-xs">
      <div className="bg-[#1e293b] border border-slate-700 rounded-xl max-w-lg w-full p-4 flex flex-col gap-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              HARDWARE TELEMETRY SIMULATOR
            </h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status & Toggle */}
        <div className="bg-[#0f172a] border border-slate-700/80 p-3 rounded-xl flex items-center justify-between">
          <div>
            <div className="font-bold text-slate-200">
              SIMULATOR STATUS: {isSimulating ? <span className="text-amber-400 font-mono">RUNNING</span> : <span className="text-slate-500 font-mono">STOPPED</span>}
            </div>
            <div className="text-[10px] text-slate-400">Generates valid ESP32 telemetry string packets</div>
          </div>

          <button
            onClick={isSimulating ? onStopSimulator : onStartSimulator}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm ${
              isSimulating
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
            }`}
          >
            {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-slate-950" />}
            <span>{isSimulating ? 'STOP SIM' : 'START SIM'}</span>
          </button>
        </div>

        {/* Flight Pattern Presets */}
        <div className="flex flex-col gap-1.5 font-mono">
          <label className="text-slate-400 font-bold uppercase text-[10px] font-sans">FLIGHT PATTERN MODE</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'orbit', label: 'CIRCULAR ORBIT' },
              { id: 'waypoint', label: 'GRID SURVEY' },
              { id: 'linear', label: 'LINEAR TRANSIT' },
              { id: 'stationary', label: 'BENCH TEST' },
            ].map((preset) => (
              <button
                key={preset.id}
                onClick={() => onUpdateConfig({ mode: preset.id as any })}
                className={`p-2 rounded-xl font-bold text-left border transition-all ${
                  config.mode === preset.id
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-[#0f172a] border-slate-700/80 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Parameter Sliders */}
        <div className="grid grid-cols-2 gap-3 bg-[#0f172a] border border-slate-700/80 p-3 rounded-xl font-mono">
          {/* Flight Speed */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[10px] text-slate-400 font-sans">
              <span>SPEED (m/s)</span>
              <strong className="text-amber-400 font-mono">{config.speedMs} m/s</strong>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={config.speedMs}
              onChange={(e) => onUpdateConfig({ speedMs: parseFloat(e.target.value) })}
              className="accent-amber-400"
            />
          </div>

          {/* Packet Rate */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[10px] text-slate-400 font-sans">
              <span>PACKET INTERVAL</span>
              <strong className="text-amber-400 font-mono">{config.packetIntervalMs} ms</strong>
            </div>
            <input
              type="range"
              min="200"
              max="2000"
              step="100"
              value={config.packetIntervalMs}
              onChange={(e) => onUpdateConfig({ packetIntervalMs: parseInt(e.target.value, 10) })}
              className="accent-amber-400"
            />
          </div>

          {/* Base RSSI */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[10px] text-slate-400 font-sans">
              <span>BASE RSSI</span>
              <strong className="text-blue-400 font-mono">{config.rssiBase} dBm</strong>
            </div>
            <input
              type="range"
              min="-115"
              max="-50"
              value={config.rssiBase}
              onChange={(e) => onUpdateConfig({ rssiBase: parseInt(e.target.value, 10) })}
              className="accent-blue-400"
            />
          </div>

          {/* Base Altitude */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[10px] text-slate-400 font-sans">
              <span>BASE ALTITUDE</span>
              <strong className="text-blue-400 font-mono">{config.altitudeMeters} m</strong>
            </div>
            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={config.altitudeMeters}
              onChange={(e) => onUpdateConfig({ altitudeMeters: parseInt(e.target.value, 10) })}
              className="accent-blue-400"
            />
          </div>
        </div>

        {/* Emergency Fault Injection Controls */}
        <div className="flex items-center gap-2 font-mono">
          <button
            onClick={onSimulateLossOfSignal}
            className="flex-1 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 p-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
            title="Simulate 5-second LoRa signal loss freeze"
          >
            <WifiOff className="w-4 h-4 text-rose-400" />
            <span className="font-sans">TRIGGER LOSS OF SIGNAL (5s)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
