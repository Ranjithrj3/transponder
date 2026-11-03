import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Layers, 
  Crosshair, 
  Home, 
  Trash2, 
  Compass, 
  MapPin, 
  Ruler, 
  Eye, 
  EyeOff,
  Navigation,
  Globe
} from 'lucide-react';
import { HomeLocation, MapSettings, TelemetryPacket, TileLayerType } from '../types';
import { calculateDistanceMeters, formatDistance } from '../utils/geoUtils';

interface MapContainerProps {
  lastPacket: TelemetryPacket | null;
  history: TelemetryPacket[];
  homeLocation: HomeLocation | null;
  onSetHomeLocation: (loc: HomeLocation | null) => void;
  mapSettings: MapSettings;
  onUpdateMapSettings: (settings: Partial<MapSettings>) => void;
}

const TILE_SERVERS: Record<TileLayerType, { name: string; url: string; attribution: string; maxZoom: number }> = {
  osm: {
    name: 'OpenStreetMap Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
  satellite: {
    name: 'Esri World Imagery (Satellite)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 18,
  },
  dark: {
    name: 'CartoDB Dark Matter',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    maxZoom: 19,
  },
  topo: {
    name: 'OpenTopoMap',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)',
    maxZoom: 17,
  },
};

export const MapContainer: React.FC<MapContainerProps> = ({
  lastPacket,
  history,
  homeLocation,
  onSetHomeLocation,
  mapSettings,
  onUpdateMapSettings,
}) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const droneMarkerRef = useRef<L.Marker | null>(null);
  const homeMarkerRef = useRef<L.Marker | null>(null);
  const trailPolylineRef = useRef<L.Polyline | null>(null);
  const homeLineRef = useRef<L.Polyline | null>(null);
  const ringCirclesRef = useRef<L.Circle[]>([]);

  const [showTileMenu, setShowTileMenu] = useState(false);
  const [showRings, setShowRings] = useState(true);

  const onSetHomeLocationRef = useRef(onSetHomeLocation);
  const lastPacketRef = useRef(lastPacket);

  useEffect(() => {
    onSetHomeLocationRef.current = onSetHomeLocation;
    lastPacketRef.current = lastPacket;
  });

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    // Default center: San Francisco or initial telemetry lat/lon
    const initialLat = lastPacket?.lat ?? 37.7749;
    const initialLon = lastPacket?.lon ?? -122.4194;

    const map = L.map(mapRef.current, {
      center: [initialLat, initialLon],
      zoom: 15,
      zoomControl: false,
    });

    // Add zoom control to top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Initial Tile Layer
    const tileConf = TILE_SERVERS[mapSettings.tileLayer];
    const tileLayer = L.tileLayer(tileConf.url, {
      attribution: tileConf.attribution,
      maxZoom: tileConf.maxZoom,
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    leafletMapRef.current = map;

    // Handle Map Click to Assign/Re-assign Home Location
    map.on('click', (e: L.LeafletMouseEvent) => {
      onSetHomeLocationRef.current({
        lat: e.latlng.lat,
        lon: e.latlng.lng,
        alt: lastPacketRef.current?.alt ?? 0,
        setAt: Date.now(),
      });
    });

    // Trail Polyline
    trailPolylineRef.current = L.polyline([], {
      color: '#3b82f6', // Blue
      weight: 3,
      opacity: 0.85,
      dashArray: '6, 6',
    }).addTo(map);

    // Home Vector Line
    homeLineRef.current = L.polyline([], {
      color: '#f59e0b', // Amber
      weight: 2,
      opacity: 0.6,
      dashArray: '4, 4',
    }).addTo(map);

    return () => {
      map.remove();
      leafletMapRef.current = null;
    };
  }, []);

  // Update Tile Layer when settings change
  useEffect(() => {
    if (!leafletMapRef.current) return;
    const map = leafletMapRef.current;
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    const tileConf = TILE_SERVERS[mapSettings.tileLayer];
    tileLayerRef.current = L.tileLayer(tileConf.url, {
      attribution: tileConf.attribution,
      maxZoom: tileConf.maxZoom,
    }).addTo(map);
  }, [mapSettings.tileLayer]);

  // Update Drone Marker & Rotation on Telemetry Packet
  useEffect(() => {
    if (!leafletMapRef.current || !lastPacket) return;
    const map = leafletMapRef.current;
    const { lat, lon, crs, alt, spd } = lastPacket;

    // Custom SVG Drone Icon with rotation
    const droneSvg = `
      <div style="transform: rotate(${crs}deg); transition: transform 0.3s ease-out;" class="relative flex items-center justify-center">
        <!-- Pulse ring -->
        <div class="absolute -inset-2 bg-blue-500/30 rounded-full animate-ping"></div>
        <!-- Drone SVG Icon -->
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L16 9L12 7L8 9L12 2Z" fill="#3b82f6" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M12 7V22" stroke="#3b82f6" stroke-width="2"/>
          <path d="M5 14L12 17L19 14" stroke="#60a5fa" stroke-width="2" stroke-linecap="round"/>
          <circle cx="12" cy="12" r="3" fill="#60a5fa" stroke="#ffffff" stroke-width="1.5"/>
        </svg>
      </div>
    `;

    const customIcon = L.divIcon({
      html: droneSvg,
      className: 'drone-custom-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    if (droneMarkerRef.current) {
      droneMarkerRef.current.setLatLng([lat, lon]);
      droneMarkerRef.current.setIcon(customIcon);
      droneMarkerRef.current.setTooltipContent(
        `<div class="font-mono text-xs p-1">
          <strong class="text-blue-400">${lastPacket.id}</strong><br/>
          ALT: ${alt.toFixed(1)} m | SPD: ${spd.toFixed(1)} m/s
        </div>`
      );
    } else {
      droneMarkerRef.current = L.marker([lat, lon], { icon: customIcon })
        .addTo(map)
        .bindTooltip(
          `<div class="font-mono text-xs p-1">
            <strong class="text-blue-400">${lastPacket.id}</strong><br/>
            ALT: ${alt.toFixed(1)} m | SPD: ${spd.toFixed(1)} m/s
          </div>`,
          { permanent: false, direction: 'top', offset: [0, -10] }
        );
    }

    // Auto-center / Follow Drone Mode
    if (mapSettings.followDrone) {
      map.panTo([lat, lon], { animate: true, duration: 0.5 });
    }
  }, [lastPacket, mapSettings.followDrone]);

  // Update Flight Path Trail
  useEffect(() => {
    if (!trailPolylineRef.current) return;
    if (!mapSettings.showTrail) {
      trailPolylineRef.current.setLatLngs([]);
      return;
    }

    const maxPts = mapSettings.trailLength || 300;
    const trailPoints: L.LatLngExpression[] = history
      .slice(-maxPts)
      .map((p) => [p.lat, p.lon]);

    trailPolylineRef.current.setLatLngs(trailPoints);
  }, [history, mapSettings.showTrail, mapSettings.trailLength]);

  // Update Home Location & Distance Line & Rings
  useEffect(() => {
    if (!leafletMapRef.current) return;
    const map = leafletMapRef.current;

    // Clear existing rings
    ringCirclesRef.current.forEach((ring) => map.removeLayer(ring));
    ringCirclesRef.current = [];

    if (!homeLocation) {
      if (homeMarkerRef.current) {
        map.removeLayer(homeMarkerRef.current);
        homeMarkerRef.current = null;
      }
      if (homeLineRef.current) {
        homeLineRef.current.setLatLngs([]);
      }
      return;
    }

    const { lat: homeLat, lon: homeLon } = homeLocation;

    // Home Marker
    const homeIconHtml = `
      <div class="relative flex items-center justify-center text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>
    `;

    const homeIcon = L.divIcon({
      html: homeIconHtml,
      className: 'home-custom-marker',
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    });

    if (homeMarkerRef.current) {
      homeMarkerRef.current.setLatLng([homeLat, homeLon]);
    } else {
      homeMarkerRef.current = L.marker([homeLat, homeLon], {
        icon: homeIcon,
        draggable: true,
      })
        .addTo(map)
        .bindTooltip('LAUNCH / HOME POINT', {
          permanent: false, // ONLY SHOW TEXT WHEN CURSOR HOVERS HERE
          direction: 'top',
          offset: [0, -28],
        });

      homeMarkerRef.current.on('dragend', (e: L.DragEndEvent) => {
        const position = e.target.getLatLng();
        onSetHomeLocationRef.current({
          lat: position.lat,
          lon: position.lng,
          alt: homeLocation?.alt ?? 0,
          setAt: Date.now(),
        });
      });
    }

    // Line from Home to Drone
    if (homeLineRef.current && lastPacket) {
      homeLineRef.current.setLatLngs([
        [homeLat, homeLon],
        [lastPacket.lat, lastPacket.lon],
      ]);
    }

    // Distance Radius Rings
    if (showRings) {
      const distances = [100, 500, 1000, 2500]; // Meters
      distances.forEach((radius) => {
        const circle = L.circle([homeLat, homeLon], {
          radius,
          color: '#f59e0b',
          weight: 1,
          opacity: 0.35,
          fill: false,
          dashArray: '3, 6',
        }).addTo(map);

        circle.bindTooltip(`${radius >= 1000 ? `${radius / 1000}km` : `${radius}m`}`, {
          permanent: false, // ONLY SHOW ON HOVER
          direction: 'right',
          className: 'ring-tooltip-style',
        });

        ringCirclesRef.current.push(circle);
      });
    }
  }, [homeLocation, lastPacket, showRings]);

  // Center Map on Drone
  const centerOnDrone = () => {
    if (!leafletMapRef.current || !lastPacket) return;
    leafletMapRef.current.flyTo([lastPacket.lat, lastPacket.lon], 16, { duration: 1 });
  };

  // Center Map on Home Location
  const centerOnHome = () => {
    if (!leafletMapRef.current || !homeLocation) return;
    leafletMapRef.current.flyTo([homeLocation.lat, homeLocation.lon], 16, { duration: 1 });
  };

  // Set Home Location from Current Drone Coordinate
  const handleSetHomeFromDrone = () => {
    if (!lastPacket) return;
    onSetHomeLocation({
      lat: lastPacket.lat,
      lon: lastPacket.lon,
      alt: lastPacket.alt,
      setAt: Date.now(),
    });
  };

  // Calculate current distance from Home
  const distFromHome = homeLocation && lastPacket
    ? calculateDistanceMeters(homeLocation.lat, homeLocation.lon, lastPacket.lat, lastPacket.lon)
    : null;

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-xl overflow-hidden border border-slate-700 bg-[#0f172a] shadow-md flex flex-col font-sans">
      {/* Map Element */}
      <div ref={mapRef} className="w-full h-full flex-1 z-0" />

      {/* Floating Map Controls Bar (Top Left) */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 font-sans">
        {/* Map Layers Selector Button */}
        <div className="relative">
          <button
            onClick={() => setShowTileMenu(!showTileMenu)}
            className="bg-[#1e293b] hover:bg-slate-800 text-slate-200 border border-slate-700 p-2 rounded-xl shadow-lg flex items-center gap-2 text-xs transition-all"
            title="Change Map Tile Server"
          >
            <Layers className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline capitalize font-medium">{TILE_SERVERS[mapSettings.tileLayer].name}</span>
          </button>

          {/* Tile Menu Popup */}
          {showTileMenu && (
            <div className="absolute top-11 left-0 bg-[#1e293b] border border-slate-700 p-2 rounded-xl shadow-2xl w-56 flex flex-col gap-1 z-20">
              <div className="text-[10px] text-slate-400 px-2 py-1 uppercase font-bold border-b border-slate-700">
                Map Layer Select
              </div>
              {(Object.keys(TILE_SERVERS) as TileLayerType[]).map((layerKey) => (
                <button
                  key={layerKey}
                  onClick={() => {
                    onUpdateMapSettings({ tileLayer: layerKey });
                    setShowTileMenu(false);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs text-left transition-all flex items-center justify-between ${
                    mapSettings.tileLayer === layerKey
                      ? 'bg-blue-600/20 text-blue-300 font-semibold border border-blue-500/40'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <span>{TILE_SERVERS[layerKey].name}</span>
                  {mapSettings.tileLayer === layerKey && <span className="text-blue-400">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Map Action Tools */}
        <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-1 shadow-lg flex flex-col gap-1">
          {/* Follow Mode Toggle */}
          <button
            onClick={() => onUpdateMapSettings({ followDrone: !mapSettings.followDrone })}
            className={`p-2 rounded-lg text-xs transition-all flex items-center gap-2 font-mono ${
              mapSettings.followDrone
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                : 'hover:bg-slate-800 text-slate-400'
            }`}
            title={mapSettings.followDrone ? 'Auto-Follow Enabled' : 'Auto-Follow Disabled'}
          >
            <Navigation className={`w-4 h-4 ${mapSettings.followDrone ? 'animate-pulse text-blue-400' : ''}`} />
            <span className="hidden md:inline font-sans font-medium">FOLLOW</span>
          </button>

          {/* Center Drone */}
          <button
            onClick={centerOnDrone}
            disabled={!lastPacket}
            className="p-2 hover:bg-slate-800 text-slate-300 disabled:opacity-40 rounded-lg text-xs transition-all flex items-center gap-2"
            title="Recenter Map on Drone Position"
          >
            <Crosshair className="w-4 h-4 text-blue-400" />
            <span className="hidden md:inline font-sans font-medium">CENTER</span>
          </button>

          {/* Set / Cancel Home Location */}
          {homeLocation ? (
            <div className="flex gap-1">
              <button
                onClick={centerOnHome}
                className="flex-1 p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs transition-all flex items-center gap-1.5"
                title="Focus Map on Home Location"
              >
                <Home className="w-4 h-4 text-amber-400" />
                <span className="hidden md:inline font-sans font-medium">HOME</span>
              </button>
              <button
                onClick={() => onSetHomeLocation(null)}
                className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-xs transition-all flex items-center justify-center"
                title="Cancel / Clear Current Home Location"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleSetHomeFromDrone}
              disabled={!lastPacket}
              className="p-2 hover:bg-slate-800 text-slate-300 disabled:opacity-40 rounded-lg text-xs transition-all flex items-center gap-2"
              title="Set Home/Launch Point to Drone GPS (or Click Map)"
            >
              <Home className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline font-sans font-medium">SET HOME</span>
            </button>
          )}

          {/* Toggle Trail */}
          <button
            onClick={() => onUpdateMapSettings({ showTrail: !mapSettings.showTrail })}
            className={`p-2 rounded-lg text-xs transition-all flex items-center gap-2 ${
              mapSettings.showTrail
                ? 'bg-slate-800 text-blue-300'
                : 'text-slate-500 hover:bg-slate-800'
            }`}
            title="Toggle Flight Path Trail"
          >
            {mapSettings.showTrail ? <Eye className="w-4 h-4 text-blue-400" /> : <EyeOff className="w-4 h-4 text-slate-500" />}
            <span className="hidden md:inline font-sans font-medium">TRAIL</span>
          </button>

          {/* Toggle Range Rings */}
          <button
            onClick={() => setShowRings(!showRings)}
            className={`p-2 rounded-lg text-xs transition-all flex items-center gap-2 ${
              showRings ? 'bg-slate-800 text-amber-300' : 'text-slate-500 hover:bg-slate-800'
            }`}
            title="Toggle Distance Radius Rings from Home"
          >
            <Ruler className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline font-sans font-medium">RINGS</span>
          </button>
        </div>
      </div>

      {/* Floating Bottom Telemetry Overlay Badge on Map */}
      <div className="absolute bottom-3 left-3 right-3 z-10 font-mono flex flex-wrap items-center justify-between gap-2 bg-[#1e293b]/95 border border-slate-700 p-2.5 rounded-xl text-xs shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-300">
            <MapPin className="w-4 h-4 text-blue-400" />
            <span>
              LAT: <strong className="text-white">{lastPacket ? lastPacket.lat.toFixed(6) : '40.712800'}</strong>
            </span>
            <span className="text-slate-600">|</span>
            <span>
              LON: <strong className="text-white">{lastPacket ? lastPacket.lon.toFixed(6) : '-74.006000'}</strong>
            </span>
          </div>

          {distFromHome !== null && homeLocation && (
            <div className="hidden sm:flex items-center gap-2 text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md text-xs">
              <button
                onClick={centerOnHome}
                className="flex items-center gap-1 hover:text-amber-200 transition-colors"
                title="Center Map on Home Location"
              >
                <Home className="w-3.5 h-3.5 text-amber-400" />
                <span>DIST HOME: <strong>{formatDistance(distFromHome)}</strong></span>
              </button>
              <button
                onClick={() => onSetHomeLocation(null)}
                className="p-0.5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded transition-all"
                title="Cancel / Clear Home Location"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-slate-400 text-[11px]">
          <span>TRAIL: {history.length} pts</span>
          <span className="hidden sm:inline">|</span>
          <span className="hidden sm:inline">GPS FIX: {lastPacket && lastPacket.sat >= 4 ? '3D FIX' : 'NO FIX'}</span>
        </div>
      </div>
    </div>
  );
};
