import React from 'react';
import { Wifi, Activity, AlertTriangle, ShieldCheck, Radio, Signal } from 'lucide-react';
import { TelemetryPacket } from '../types';
import { getRssiQuality } from '../utils/geoUtils';

interface SignalQualityMeterProps {
  lastPacket: TelemetryPacket | null;
  totalPackets: number;
  packetsLost: number;
}

export const SignalQualityMeter: React.FC<SignalQualityMeterProps> = ({
  lastPacket,
  totalPackets,
  packetsLost,
}) => {
  const rssi = lastPacket ? lastPacket.rssi : -85;
  const snr = lastPacket ? lastPacket.snr : 9.5;
  const rssiQuality = getRssiQuality(rssi);

  // Link quality percentage (0 - 100%)
  const linkHealth = totalPackets > 0
    ? Math.max(0, Math.min(100, Math.round(((totalPackets - packetsLost) / totalPackets) * 100)))
    : 100;

  // Signal strength bars count (0 to 5)
  const barCount = rssi >= -65 ? 5 : rssi >= -75 ? 4 : rssi >= -88 ? 3 : rssi >= -105 ? 2 : rssi >= -118 ? 1 : 0;

  return (
    <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-4 shadow-md flex flex-col gap-3 font-sans">
      {/* Title Bar */}
      <div className="flex items-center justify-between border-b border-slate-700 pb-2">
        <div className="flex items-center gap-2">
          <Signal className="w-4 h-4 text-blue-400" />
          <h3 className="font-bold text-white text-xs tracking-wider uppercase">
            SIGNAL INTEGRITY & LINK HEALTH
          </h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-slate-700 text-emerald-400 bg-emerald-500/10">
          {rssiQuality.label.toUpperCase()}
        </span>
      </div>

      {/* Bar Visualizer + dBm */}
      <div className="flex items-center justify-between bg-[#0f172a] border border-slate-700/80 p-3.5 rounded-xl">
        {/* Signal Bars Visualizer */}
        <div className="flex items-end gap-1.5 h-10">
          {[1, 2, 3, 4, 5].map((barIndex) => (
            <div
              key={barIndex}
              style={{ height: `${barIndex * 20}%` }}
              className={`w-3.5 rounded-t transition-all duration-300 ${
                barIndex <= barCount
                  ? barCount >= 4
                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                    : barCount >= 2
                    ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                    : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                  : 'bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Numeric Values */}
        <div className="text-right">
          <div className="text-2xl font-mono font-bold text-white tracking-tight">
            {lastPacket ? `${rssi} dBm` : '-85 dBm'}
          </div>
          <div className="text-xs font-mono text-emerald-400">
            SNR: {lastPacket ? `${snr.toFixed(2)} dB` : '9.50 dB'}
          </div>
        </div>
      </div>

      {/* Packet Reception Rate & Loss Tracker */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        {/* Link Health % */}
        <div className="bg-[#0f172a] border border-slate-700/80 p-3 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1 font-sans">
            <Activity className="w-3 h-3 text-blue-400" /> LINK QUALITY
          </span>
          <div className="text-lg font-bold text-emerald-400 my-1">
            {linkHealth}%
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all duration-300"
              style={{ width: `${linkHealth}%` }}
            />
          </div>
        </div>

        {/* Packet Loss Count */}
        <div className="bg-[#0f172a] border border-slate-700/80 p-3 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1 font-sans">
            <AlertTriangle className="w-3 h-3 text-amber-400" /> PACKET LOSS
          </span>
          <div className="text-lg font-bold text-amber-400 my-1">
            {packetsLost} <span className="text-xs text-slate-500 font-normal">/ {totalPackets}</span>
          </div>
          <span className="text-[9px] text-slate-500">
            {totalPackets > 0 ? `${((packetsLost / totalPackets) * 100).toFixed(1)}% loss rate` : '0.0% loss'}
          </span>
        </div>
      </div>
    </div>
  );
};
