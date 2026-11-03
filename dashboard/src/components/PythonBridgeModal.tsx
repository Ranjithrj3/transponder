import React, { useState } from 'react';
import { X, Copy, Download, Check, Terminal, Cpu, Zap, HelpCircle } from 'lucide-react';
import { PYTHON_BRIDGE_CODE } from '../utils/pythonBridgeScript';

interface PythonBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PythonBridgeModal: React.FC<PythonBridgeModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'python' | 'webserial'>('python');

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(PYTHON_BRIDGE_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadScript = () => {
    const blob = new Blob([PYTHON_BRIDGE_CODE], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bridge.py';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-[#1e293b] border border-slate-700 rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans text-xs">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-[#0f172a]">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              HARDWARE CONNECTIVITY SETUP (COM5 @ 115200 BAUD)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-700 bg-[#0f172a]/50 p-2 gap-2">
          <button
            onClick={() => setActiveTab('python')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'python'
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Terminal className="w-4 h-4 text-blue-400" />
            <span>OPTION 1: PYTHON SERIAL BRIDGE (COM5)</span>
          </button>
          <button
            onClick={() => setActiveTab('webserial')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'webserial'
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Zap className="w-4 h-4 text-blue-400" />
            <span>OPTION 2: WEBSERIAL DIRECT (BROWSER)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4 font-mono">
          {activeTab === 'python' ? (
            <>
              {/* Step 1 */}
              <div className="bg-[#0f172a] border border-slate-700/80 p-3.5 rounded-xl flex flex-col gap-2">
                <span className="text-blue-400 font-bold uppercase text-[11px] flex items-center gap-1.5 font-sans">
                  <span className="w-5 h-5 bg-blue-500/20 text-blue-300 rounded-full flex items-center justify-center text-xs">1</span>
                  Install Python Serial & WebSocket Dependencies
                </span>
                <p className="text-slate-300 font-sans">Run this command in Windows Command Prompt or PowerShell:</p>
                <div className="bg-slate-900 border border-slate-700 p-2 rounded-lg text-emerald-400 select-all font-mono">
                  pip install pyserial websocket-client
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-[#0f172a] border border-slate-700/80 p-3.5 rounded-xl flex flex-col gap-2">
                <span className="text-blue-400 font-bold uppercase text-[11px] flex items-center gap-1.5 font-sans">
                  <span className="w-5 h-5 bg-blue-500/20 text-blue-300 rounded-full flex items-center justify-center text-xs">2</span>
                  Download or Copy Python Bridge Script (<code className="text-amber-400 font-bold">bridge.py</code>)
                </span>
                <div className="flex items-center gap-2 my-1 font-sans">
                  <button
                    onClick={handleDownloadScript}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>DOWNLOAD BRIDGE.PY</span>
                  </button>
                  <button
                    onClick={handleCopyCode}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'COPIED TO CLIPBOARD' : 'COPY SCRIPT CODE'}</span>
                  </button>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-[#0f172a] border border-slate-700/80 p-3.5 rounded-xl flex flex-col gap-2">
                <span className="text-blue-400 font-bold uppercase text-[11px] flex items-center gap-1.5 font-sans">
                  <span className="w-5 h-5 bg-blue-500/20 text-blue-300 rounded-full flex items-center justify-center text-xs">3</span>
                  Execute Bridge on Windows PC (COM5 @ 115200)
                </span>
                <p className="text-slate-300 font-sans">Start the bridge to forward serial packets from COM5 to this GCS Dashboard:</p>
                <div className="bg-slate-900 border border-slate-700 p-2 rounded-lg text-amber-300 select-all font-mono">
                  python bridge.py --port COM5 --baud 115200
                </div>
              </div>

              {/* Code Script View */}
              <div className="flex flex-col gap-1">
                <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-between font-sans">
                  <span>SCRIPT SOURCE CODE (bridge.py)</span>
                  <span className="text-emerald-400 font-mono">AUTHORITATIVE ESP32 COMPATIBLE</span>
                </div>
                <pre className="bg-slate-900 border border-slate-700 p-3 rounded-xl max-h-48 overflow-y-auto text-[10px] text-slate-300 leading-relaxed font-mono">
                  {PYTHON_BRIDGE_CODE}
                </pre>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-3 font-sans">
              <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl text-slate-200 flex flex-col gap-2">
                <h4 className="font-bold text-blue-300 text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4" /> WEBSERIAL DIRECT CONNECTION
                </h4>
                <p className="leading-relaxed">
                  Modern browsers (Google Chrome, Microsoft Edge, Opera) support direct USB Serial communication using the <code className="text-amber-400 font-mono">WebSerial API</code>. You can connect your ESP32 LoRa Ground Receiver directly to this dashboard without installing Python!
                </p>
                <ol className="list-decimal list-inside space-y-1 mt-1 text-slate-300">
                  <li>Plug your LILYGO/ESP32 LoRa Ground Receiver into your PC's USB port (COM5).</li>
                  <li>Click the <strong className="text-blue-400">COM5 (115200)</strong> button in the GCS header bar.</li>
                  <li>Select your ESP32 / USB-Serial CH340 / CP210x device in the browser prompt.</li>
                  <li>Select Baud Rate <strong className="text-amber-400 font-mono">115200</strong> and click Connect.</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-700 bg-[#0f172a] flex items-center justify-between text-slate-400 text-[11px] font-sans">
          <span>Compatible with LILYGO T-Beam & SX1278 433MHz ESP32 Ground Receivers</span>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg font-bold transition-all"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
