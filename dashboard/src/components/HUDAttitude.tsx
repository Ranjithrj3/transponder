import React from 'react';
import { ArrowUp, ArrowDown, Activity, Navigation } from 'lucide-react';
import { TelemetryPacket } from '../types';

interface HUDAttitudeProps {
  lastPacket: TelemetryPacket | null;
  prevPacket: TelemetryPacket | null;
}

export const HUDAttitude: React.FC<HUDAttitudeProps> = ({ lastPacket, prevPacket }) => {
  const crs = lastPacket ? lastPacket.crs : 0;
  const alt = lastPacket ? lastPacket.alt : 0;
  const spd = lastPacket ? lastPacket.spd : 0;

  // Calculate rate of climb / descent (m/s)
  let climbRate = 0;
  if (lastPacket && prevPacket && lastPacket.timestamp > prevPacket.timestamp) {
    const dtSeconds = (lastPacket.timestamp - prevPacket.timestamp) / 1000;
    if (dtSeconds > 0) {
      climbRate = (lastPacket.alt - prevPacket.alt) / dtSeconds;
    }
  }

  // Heading compass direction helper
  const getCardinal = (heading: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(heading / 45) % 8];
  };

  return (
    <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-4 shadow-md flex flex-col justify-between h-full font-sans relative overflow-hidden">
      {/* Background Subtle Grid Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />

      {/* Top PFD Header Bar */}
      <div className="relative z-10 w-full bg-[#0f172a] border border-slate-700/80 rounded-xl px-3 py-2 flex items-center justify-between font-mono">
        <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 font-sans">
          <Activity className="w-4 h-4 text-blue-400" />
          <span>FLIGHT HORIZON & ATTITUDE HUD</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span>MODE: <strong className="text-emerald-400">AUTO_NAV</strong></span>
        </div>
      </div>

      {/* Center Artificial Horizon & Instrument Canvas */}
      <div className="relative z-10 my-3 flex-1 flex items-center justify-between gap-2 min-h-[160px]">
        {/* Left Speed Ladder */}
        <div className="bg-[#0f172a] border border-slate-700/80 p-2.5 rounded-xl flex flex-col items-center min-w-[70px] font-mono">
          <span className="text-[9px] text-slate-400 font-bold uppercase mb-1 font-sans">SPEED</span>
          <div className="text-lg font-bold text-emerald-400">{spd.toFixed(1)}</div>
          <span className="text-[10px] text-slate-500">m/s</span>
          <div className="text-[9px] text-slate-400 mt-1 font-sans">{(spd * 3.6).toFixed(1)} km/h</div>
        </div>

        {/* Center Flight Horizon Display */}
        <div className="relative flex-1 h-full min-h-[140px] bg-black/40 rounded-xl border border-slate-700 overflow-hidden flex items-center justify-center">
          {/* Simulated Sky/Ground Horizon */}
          <div
            className="absolute inset-0 transition-transform duration-300"
            style={{
              background: 'linear-gradient(to bottom, #0284c7 0%, #0369a1 48%, #1e293b 52%, #0f172a 100%)',
              transform: `rotate(${-crs * 0.1}deg) translateY(${Math.min(30, Math.max(-30, climbRate * 5))}px)`,
            }}
          >
            {/* Horizon Line */}
            <div className="absolute top-1/2 left-0 right-0 border-b-2 border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
          </div>

          {/* Fixed Aircraft Crosshair Overlay */}
          <div className="relative z-10 flex items-center justify-center pointer-events-none">
            {/* Reticle */}
            <div className="w-16 h-16 border-2 border-amber-400/90 rounded-full flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.5)]">
              <div className="w-2 h-2 bg-amber-400 rounded-full" />
              <div className="absolute w-8 h-0.5 bg-amber-400 -left-6" />
              <div className="absolute w-8 h-0.5 bg-amber-400 -right-6" />
              <div className="absolute h-4 w-0.5 bg-amber-400 -top-4" />
            </div>
          </div>

          {/* Climb Rate Badge overlay */}
          <div className="absolute bottom-2 left-2 bg-[#0f172a] border border-slate-700 px-2 py-1 rounded text-[10px] text-slate-200 flex items-center gap-1 font-mono">
            {climbRate > 0.1 ? (
              <ArrowUp className="w-3 h-3 text-emerald-400 animate-bounce" />
            ) : climbRate < -0.1 ? (
              <ArrowDown className="w-3 h-3 text-rose-400 animate-bounce" />
            ) : (
              <Activity className="w-3 h-3 text-slate-500" />
            )}
            <span>VSI: {climbRate.toFixed(1)} m/s</span>
          </div>
        </div>

        {/* Right Altitude Ladder */}
        <div className="bg-[#0f172a] border border-slate-700/80 p-2.5 rounded-xl flex flex-col items-center min-w-[70px] font-mono">
          <span className="text-[9px] text-slate-400 font-bold uppercase mb-1 font-sans">ALTITUDE</span>
          <div className="text-lg font-bold text-blue-300">{alt.toFixed(1)}</div>
          <span className="text-[10px] text-slate-500">meters</span>
          <div className="text-[9px] text-slate-400 mt-1 font-sans">{(alt * 3.28084).toFixed(0)} ft</div>
        </div>
      </div>

      {/* Bottom PFD Footer Summary */}
      <div className="relative z-10 w-full bg-[#0f172a] border border-slate-700/80 rounded-xl p-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <span>LAT: <strong className="text-white">{lastPacket ? lastPacket.lat.toFixed(5) : '40.71280'}</strong></span>
          <span>LON: <strong className="text-white">{lastPacket ? lastPacket.lon.toFixed(5) : '-74.00600'}</strong></span>
        </div>
        <div className="flex items-center gap-1.5 text-blue-400 font-bold">
          <Navigation className="w-3.5 h-3.5" />
          <span>{lastPacket ? `${lastPacket.sat} SAT / HDOP ${lastPacket.hdop}` : '9 SAT / HDOP 1.2'}</span>
        </div>
      </div>
    </div>
  );
};
