import React, { useState } from 'react';
import { Download, FileText, Globe, Code, X, Check } from 'lucide-react';
import { TelemetryPacket } from '../types';

interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: TelemetryPacket[];
}

export const ExportDataModal: React.FC<ExportDataModalProps> = ({
  isOpen,
  onClose,
  history,
}) => {
  const [format, setFormat] = useState<'csv' | 'kml' | 'json'>('csv');
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    let content = '';
    let mimeType = 'text/plain';
    let fileExt = 'txt';

    const filename = `lora_flight_telemetry_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '_')}`;

    if (format === 'csv') {
      mimeType = 'text/csv';
      fileExt = 'csv';
      const headers = 'ID,SEQ,LAT,LON,ALT_M,SPD_MPS,CRS_DEG,SAT,HDOP,DATE,TIME,RSSI_DBM,SNR_DB,TIMESTAMP\n';
      const rows = history
        .map(
          (p) =>
            `${p.id},${p.seq},${p.lat.toFixed(6)},${p.lon.toFixed(6)},${p.alt.toFixed(2)},${p.spd.toFixed(2)},${p.crs.toFixed(2)},${p.sat},${p.hdop.toFixed(1)},${p.date},${p.time},${p.rssi},${p.snr.toFixed(2)},${p.timestamp}`
        )
        .join('\n');
      content = headers + rows;
    } else if (format === 'json') {
      mimeType = 'application/json';
      fileExt = 'json';
      content = JSON.stringify(history, null, 2);
    } else if (format === 'kml') {
      mimeType = 'application/vnd.google-earth.kml+xml';
      fileExt = 'kml';
      const coords = history.map((p) => `${p.lon},${p.lat},${p.alt}`).join('\n          ');
      content = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>LoRa Drone Flight Track</name>
    <description>Recorded LoRa Telemetry Flight Track from ESP32 Ground Receiver</description>
    <Style id="yellowLineGreenPoly">
      <LineStyle>
        <color>7f00ffff</color>
        <width>4</width>
      </LineStyle>
      <PolyStyle>
        <color>7f00ff00</color>
      </PolyStyle>
    </Style>
    <Placemark>
      <name>Drone Path</name>
      <styleUrl>#yellowLineGreenPoly</styleUrl>
      <LineString>
        <extrude>1</extrude>
        <tessellate>1</tessellate>
        <altitudeMode>absolute</altitudeMode>
        <coordinates>
          ${coords}
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${fileExt}`;
    a.click();
    URL.revokeObjectURL(url);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-sans text-xs">
      <div className="bg-[#1e293b] border border-slate-700 rounded-xl max-w-md w-full p-4 flex flex-col gap-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              EXPORT FLIGHT TELEMETRY
            </h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info */}
        <div className="bg-[#0f172a] border border-slate-700/80 p-3 rounded-xl flex flex-col gap-1">
          <span className="text-slate-400 font-bold uppercase text-[10px]">RECORDED TELEMETRY LOGS</span>
          <div className="text-lg font-bold text-blue-400 font-mono">{history.length} Packets</div>
          <span className="text-[10px] text-slate-400">Ready to export for analysis or Google Earth</span>
        </div>

        {/* Format Selector */}
        <div className="flex flex-col gap-2 font-mono">
          <label className="text-slate-400 font-bold uppercase text-[10px] font-sans">SELECT FILE FORMAT</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setFormat('csv')}
              className={`p-3 rounded-xl font-bold border flex flex-col items-center gap-1.5 transition-all ${
                format === 'csv'
                  ? 'bg-blue-600/20 text-blue-300 border-blue-500/50'
                  : 'bg-[#0f172a] border-slate-700/80 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <FileText className="w-5 h-5 text-blue-400" />
              <span>CSV DATA</span>
            </button>

            <button
              onClick={() => setFormat('kml')}
              className={`p-3 rounded-xl font-bold border flex flex-col items-center gap-1.5 transition-all ${
                format === 'kml'
                  ? 'bg-blue-600/20 text-blue-300 border-blue-500/50'
                  : 'bg-[#0f172a] border-slate-700/80 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Globe className="w-5 h-5 text-emerald-400" />
              <span>KML (EARTH)</span>
            </button>

            <button
              onClick={() => setFormat('json')}
              className={`p-3 rounded-xl font-bold border flex flex-col items-center gap-1.5 transition-all ${
                format === 'json'
                  ? 'bg-blue-600/20 text-blue-300 border-blue-500/50'
                  : 'bg-[#0f172a] border-slate-700/80 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Code className="w-5 h-5 text-amber-400" />
              <span>JSON LOG</span>
            </button>
          </div>
        </div>

        {/* Export Action */}
        <button
          onClick={handleExport}
          disabled={history.length === 0}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-40 shadow-sm"
        >
          {downloaded ? <Check className="w-5 h-5 text-emerald-400" /> : <Download className="w-5 h-5" />}
          <span>{downloaded ? 'FILE DOWNLOADED!' : `EXPORT ${format.toUpperCase()} FILE`}</span>
        </button>
      </div>
    </div>
  );
};
