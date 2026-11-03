import React from 'react';
import { Award, Clock, Flame, Mountain, Gauge, Navigation, Activity } from 'lucide-react';
import { FlightStats } from '../types';
import { formatDistance } from '../utils/geoUtils';

interface FlightStatsCardProps {
  stats: FlightStats;
}

export const FlightStatsCard: React.FC<FlightStatsCardProps> = ({ stats }) => {
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  const durationSec = stats.startTime
    ? Math.max(0, Math.floor(((stats.lastPacketTime || Date.now()) - stats.startTime) / 1000))
    : 0;

  return (
    <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-4 shadow-md flex flex-col gap-3 font-sans">
      <div className="flex items-center justify-between border-b border-slate-700 pb-2">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-blue-400" />
          <h3 className="font-bold text-white text-xs tracking-wider uppercase">
            MISSION METADATA & SUMMARY
          </h3>
        </div>
        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
          {durationSec > 0 ? 'ACTIVE FLIGHT' : 'STANDBY'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
        {/* Flight Time */}
        <div className="bg-[#0f172a] border border-slate-700/80 p-3 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1 font-sans">
            <Clock className="w-3 h-3 text-blue-400" /> MISSION UPTIME
          </span>
          <div className="text-base font-bold text-white my-1">
            {formatTime(durationSec)}
          </div>
          <span className="text-[9px] text-slate-500">elapsed time</span>
        </div>

        {/* Max Altitude */}
        <div className="bg-[#0f172a] border border-slate-700/80 p-3 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1 font-sans">
            <Mountain className="w-3 h-3 text-blue-400" /> MAX ALTITUDE
          </span>
          <div className="text-base font-bold text-blue-300 my-1">
            {stats.maxAlt.toFixed(1)} m
          </div>
          <span className="text-[9px] text-slate-500">{(stats.maxAlt * 3.28084).toFixed(0)} ft peak</span>
        </div>

        {/* Max Speed */}
        <div className="bg-[#0f172a] border border-slate-700/80 p-3 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1 font-sans">
            <Gauge className="w-3 h-3 text-emerald-400" /> MAX SPEED
          </span>
          <div className="text-base font-bold text-emerald-400 my-1">
            {stats.maxSpd.toFixed(1)} m/s
          </div>
          <span className="text-[9px] text-slate-500">{(stats.maxSpd * 3.6).toFixed(1)} km/h max</span>
        </div>

        {/* Distance Traveled */}
        <div className="bg-[#0f172a] border border-slate-700/80 p-3 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1 font-sans">
            <Navigation className="w-3 h-3 text-amber-400" /> TOTAL DISTANCE
          </span>
          <div className="text-base font-bold text-amber-400 my-1">
            {formatDistance(stats.distTraveled)}
          </div>
          <span className="text-[9px] text-slate-500">track path length</span>
        </div>
      </div>
    </div>
  );
};
