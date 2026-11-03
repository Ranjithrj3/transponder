import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal as TerminalIcon, 
  Trash2, 
  Copy, 
  Download, 
  Search, 
  Pause, 
  Play, 
  Check, 
  Bug,
  Code
} from 'lucide-react';
import { SerialLogMessage, TelemetryPacket } from '../types';
import { parseTelemetryLine } from '../utils/telemetryParser';

interface SerialTerminalProps {
  logs: SerialLogMessage[];
  onClearLogs: () => void;
  onSendRawSerial?: (data: string) => void;
}

export const SerialTerminal: React.FC<SerialTerminalProps> = ({
  logs,
  onClearLogs,
  onSendRawSerial,
}) => {
  const [filterText, setFilterText] = useState('');
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const [testInput, setTestInput] = useState('ID=DRONE01,SEQ=1245,LAT=40.712800,LON=-74.006000,ALT=124.50,SPD=15.20,CRS=185.00,SAT=9,HDOP=1.2,DATE=2026-08-11,TIME=14:20:55,RSSI=-85,SNR=9.50');
  const [parsedTestResult, setParsedTestResult] = useState<TelemetryPacket | null>(null);

  const logEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll logic
  useEffect(() => {
    if (isAutoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isAutoScroll]);

  // Copy logs to clipboard
  const handleCopyLogs = () => {
    const text = logs.map((l) => `[${l.timestamp}] ${l.data}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download logs as file
  const handleDownloadLogs = () => {
    const text = logs.map((l) => `[${l.timestamp}] ${l.data}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lora_serial_log_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '_')}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Test Parser Line
  const handleTestParse = () => {
    const parsed = parseTelemetryLine(testInput);
    setParsedTestResult(parsed);
  };

  // Filtered logs
  const filteredLogs = filterText
    ? logs.filter((l) => l.data.toLowerCase().includes(filterText.toLowerCase()))
    : logs;

  return (
    <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-4 shadow-md flex flex-col gap-3 font-sans">
      {/* Title & Terminal Controls Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-700 pb-2.5 gap-2">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-blue-400" />
          <h3 className="font-bold text-white text-xs tracking-wider uppercase">
            PACKET TERMINAL (COM5 @ 115200)
          </h3>
        </div>

        {/* Console Controls */}
        <div className="flex items-center gap-1.5">
          {/* Search/Filter Input */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="bg-[#0f172a] border border-slate-700 rounded-lg pl-8 pr-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500 w-28 sm:w-36 font-mono"
            />
          </div>

          {/* Pause / Resume Auto-scroll */}
          <button
            onClick={() => setIsAutoScroll(!isAutoScroll)}
            className={`p-1.5 rounded-lg border text-xs transition-all ${
              isAutoScroll
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title={isAutoScroll ? 'Auto-scroll Enabled' : 'Auto-scroll Paused'}
          >
            {isAutoScroll ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          {/* Copy Logs */}
          <button
            onClick={handleCopyLogs}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs transition-all"
            title="Copy Console Logs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Download Logs */}
          <button
            onClick={handleDownloadLogs}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs transition-all"
            title="Download Log File"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Clear Logs */}
          <button
            onClick={onClearLogs}
            className="p-1.5 bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 border border-slate-700 rounded-lg text-xs transition-all"
            title="Clear Console"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Output Box */}
      <div className="bg-black/50 border border-slate-800 rounded-lg p-3 h-52 overflow-y-auto font-mono text-[10px] sm:text-xs leading-relaxed flex flex-col gap-1 shadow-inner">
        {filteredLogs.length === 0 ? (
          <div className="text-slate-500 italic py-6 text-center font-mono">
            Waiting for serial telemetry packet stream...
          </div>
        ) : (
          filteredLogs.map((msg) => (
            <div key={msg.id} className="flex items-start gap-2 hover:bg-slate-900/60 p-0.5 rounded">
              <span className="text-slate-600 text-[10px] select-none shrink-0 font-mono">[{msg.timestamp}]</span>
              <span
                className={`break-all ${
                  msg.type === 'error'
                    ? 'text-rose-400 font-semibold'
                    : msg.type === 'system'
                    ? 'text-emerald-500 font-semibold'
                    : msg.type === 'sent'
                    ? 'text-blue-400 font-semibold'
                    : 'text-slate-300'
                }`}
              >
                {msg.data}
              </span>
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>

      {/* Interactive Serial Parser Tester Bench */}
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-xl p-3 flex flex-col gap-2 font-mono">
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase font-sans">
          <span className="flex items-center gap-1.5 text-blue-400">
            <Bug className="w-3.5 h-3.5" /> PACKET PARSER BENCH
          </span>
          <button
            onClick={handleTestParse}
            className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded text-[10px] font-bold transition-all shadow-sm"
          >
            TEST PARSE
          </button>
        </div>

        <input
          type="text"
          value={testInput}
          onChange={(e) => setTestInput(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 w-full font-mono"
          placeholder="Paste raw packet string"
        />

        {parsedTestResult && (
          <div className="bg-slate-900/90 border border-emerald-500/30 p-2.5 rounded-lg text-[11px] text-emerald-400 font-mono grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>ID: <strong>{parsedTestResult.id}</strong></div>
            <div>SEQ: <strong>{parsedTestResult.seq}</strong></div>
            <div>LAT: <strong>{parsedTestResult.lat.toFixed(6)}</strong></div>
            <div>LON: <strong>{parsedTestResult.lon.toFixed(6)}</strong></div>
            <div>ALT: <strong>{parsedTestResult.alt} m</strong></div>
            <div>SPD: <strong>{parsedTestResult.spd} m/s</strong></div>
            <div>SAT: <strong>{parsedTestResult.sat}</strong></div>
            <div>RSSI: <strong>{parsedTestResult.rssi} dBm</strong></div>
          </div>
        )}
      </div>
    </div>
  );
};
