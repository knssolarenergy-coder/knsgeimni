import React, { useState, useEffect, useMemo } from 'react';
import {
  Navigation,
  Compass,
  Radio,
  MapPin,
  Clock,
  Battery,
  Zap,
  Phone,
  MessageCircle,
  AlertTriangle,
  RotateCcw,
  Play,
  Pause,
  Layers,
  ChevronRight,
  Shield,
  Eye,
  CheckCircle2,
  Bike,
  Truck,
  Crosshair,
  ExternalLink,
} from 'lucide-react';
import { TechnicianLiveLocation, RouteBreadcrumb, Technician } from '../types';
import { TrackingService } from '../services/trackingService';

interface LiveFleetMapProps {
  technicians: Technician[];
  onSelectTechnician?: (techId: string) => void;
}

// City viewport configurations for the map projection
const CITY_BOUNDS: Record<
  string,
  { centerLat: number; centerLng: number; zoomScale: number; name: string }
> = {
  All: { centerLat: 31.52, centerLng: 74.35, zoomScale: 1, name: 'All Regions' },
  Lahore: { centerLat: 31.48, centerLng: 74.34, zoomScale: 1.3, name: 'Lahore (لاہور)' },
  Islamabad: { centerLat: 33.69, centerLng: 73.04, zoomScale: 1.3, name: 'Islamabad (اسلام آباد)' },
  Karachi: { centerLat: 24.83, centerLng: 67.05, zoomScale: 1.3, name: 'Karachi (کراچی)' },
  Faisalabad: { centerLat: 31.42, centerLng: 73.10, zoomScale: 1.3, name: 'Faisalabad (فیصل آباد)' },
};

// Simplified SVG road network topology for Pakistani metro areas
const CITY_ROADS: Record<
  string,
  Array<{ name: string; path: string; isHighSpeed?: boolean }>
> = {
  Lahore: [
    { name: 'Ring Road (L-20)', path: 'M 30,120 Q 150,30 380,80 T 480,260 Q 420,380 260,370 Q 120,350 40,240 Z', isHighSpeed: true },
    { name: 'Ferozepur Road', path: 'M 180,20 L 220,160 L 280,320 L 320,440', isHighSpeed: true },
    { name: 'Canal Bank Road', path: 'M 30,300 Q 180,210 320,140 T 480,60', isHighSpeed: true },
    { name: 'Main Boulevard Gulberg', path: 'M 190,140 L 280,180 L 330,170' },
    { name: 'DHA Main Boulevard', path: 'M 320,180 Q 380,240 440,310' },
    { name: 'Khayaban-e-Jinnah / Johar Town', path: 'M 140,220 L 230,260 L 310,270' },
    { name: 'Model Town Circular', path: 'M 200,210 A 30,30 0 1,1 260,210 A 30,30 0 1,1 200,210' },
  ],
  Islamabad: [
    { name: 'Kashmir Highway / Srinagar Hwy', path: 'M 40,180 L 460,210', isHighSpeed: true },
    { name: 'Islamabad Expressway', path: 'M 320,40 L 300,420', isHighSpeed: true },
    { name: 'Jinnah Avenue / Blue Area', path: 'M 160,110 L 360,130' },
    { name: 'Margalla Road', path: 'M 60,60 L 440,70' },
    { name: 'Ibn-e-Sina Road', path: 'M 200,80 L 220,320' },
    { name: 'Faisal Avenue', path: 'M 260,60 L 260,360' },
  ],
  Karachi: [
    { name: 'Shahrah-e-Faisal', path: 'M 80,120 L 440,160', isHighSpeed: true },
    { name: 'Khayaban-e-Ittehad DHA', path: 'M 120,320 L 420,290', isHighSpeed: true },
    { name: 'Sea View Beach Road', path: 'M 60,380 Q 220,360 440,340' },
    { name: 'Clifton Marine Drive', path: 'M 140,240 L 260,340' },
    { name: 'Korangi Road', path: 'M 280,180 L 460,320' },
  ],
  Faisalabad: [
    { name: 'Canal Expressway', path: 'M 60,100 L 440,340', isHighSpeed: true },
    { name: 'Jaranwala Road', path: 'M 100,220 L 420,180' },
    { name: 'Mall Road / Clock Tower Rings', path: 'M 210,180 A 40,40 0 1,1 290,180 A 40,40 0 1,1 210,180' },
    { name: 'D-Ground Roundabout', path: 'M 300,220 A 25,25 0 1,1 350,220 A 25,25 0 1,1 300,220' },
  ],
};

export const LiveFleetMap: React.FC<LiveFleetMapProps> = ({ technicians, onSelectTechnician }) => {
  const [locations, setLocations] = useState<Record<string, TechnicianLiveLocation>>(() =>
    TrackingService.getLocations()
  );
  const [selectedTechId, setSelectedTechId] = useState<string>('tech-1');
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [showSatelliteView, setShowSatelliteView] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('Just now');
  const [mapScale, setMapScale] = useState<number>(1);

  // Subscribe to live GPS updates
  useEffect(() => {
    const unsubscribe = TrackingService.subscribe((updated) => {
      setLocations({ ...updated });
      setLastRefreshed(new Date().toLocaleTimeString());
    });
    return () => unsubscribe();
  }, []);

  const activeTechList = useMemo(() => {
    return Object.values(locations).filter((tech) => {
      if (selectedCity === 'All') return true;
      return tech.city.toLowerCase() === selectedCity.toLowerCase();
    });
  }, [locations, selectedCity]);

  const selectedTech = locations[selectedTechId] || activeTechList[0] || Object.values(locations)[0];

  // Map coordinates projection helper to SVG 500x460 canvas
  const projectCoords = (
    lat: number,
    lng: number,
    city: string
  ): { x: number; y: number } => {
    let bounds = { minLat: 31.42, maxLat: 31.54, minLng: 74.26, maxLng: 74.42 };

    if (city === 'Islamabad') {
      bounds = { minLat: 33.66, maxLat: 33.74, minLng: 73.0, maxLng: 73.09 };
    } else if (city === 'Karachi') {
      bounds = { minLat: 24.78, maxLat: 24.89, minLng: 67.01, maxLng: 67.09 };
    } else if (city === 'Faisalabad') {
      bounds = { minLat: 31.39, maxLat: 31.46, minLng: 73.06, maxLng: 73.14 };
    }

    const normX = (lng - bounds.minLng) / (bounds.maxLng - bounds.minLng);
    const normY = (bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat);

    const clampedX = Math.max(0.08, Math.min(0.92, normX));
    const clampedY = Math.max(0.08, Math.min(0.92, normY));

    return {
      x: Math.round(clampedX * 460 + 20),
      y: Math.round(clampedY * 400 + 30),
    };
  };

  const handleToggleSimulation = () => {
    if (isSimulating) {
      TrackingService.stopBackgroundSimulation();
      setIsSimulating(false);
    } else {
      TrackingService.startBackgroundSimulation();
      setIsSimulating(true);
    }
  };

  const handleResetTrip = () => {
    TrackingService.resetToDefault();
    setLocations(TrackingService.getLocations());
  };

  const handlePingTech = (techId: string) => {
    TrackingService.stepSimulation();
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = (phone: string, techName: string) => {
    const clean = phone.replace(/\D/g, '');
    const msg = `Salam ${techName}! K&S Solar Dispatch Head Office here. Please report your current site status.`;
    window.open(`https://wa.me/92${clean.replace(/^0/, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Metrics for overview
  const totalFleet = Object.keys(locations).length;
  const movingCount = Object.values(locations).filter((t) => t.status === 'moving').length;
  const onSiteCount = Object.values(locations).filter((t) => t.status === 'at_customer').length;
  const offlineCount = Object.values(locations).filter((t) => t.status === 'offline').length;

  return (
    <div className="flex flex-col gap-3 w-full bg-stone-900 text-stone-100 rounded-2xl p-2.5 sm:p-4 border border-stone-800 shadow-xl">
      {/* Top Banner & Live Radar Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>Live Technician Fleet GPS Tracking</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                لائیو ٹریکنگ
              </span>
            </h2>
          </div>
          <p className="text-xs text-stone-400 mt-0.5">
            Real-time movement radar, vehicle telemetry &amp; breadcrumb journey history for field technicians.
          </p>
        </div>

        {/* Live Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* City Filter Pills */}
          <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs">
            {['All', 'Lahore', 'Islamabad', 'Karachi'].map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCity(c)}
                className={`px-2.5 py-1 rounded-lg font-bold transition text-[11px] ${
                  selectedCity === c
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Simulation Toggle */}
          <button
            onClick={handleToggleSimulation}
            title={isSimulating ? 'Pause Live Moving Radar' : 'Resume Live Moving Radar'}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition border ${
              isSimulating
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900/60'
                : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-750'
            }`}
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5 text-emerald-400" /> : <Play className="w-3.5 h-3.5 text-amber-400" />}
            <span>{isSimulating ? 'Radar: LIVE' : 'Radar: Paused'}</span>
          </button>

          {/* Reset Trip */}
          <button
            onClick={handleResetTrip}
            title="Reset demo technician trips to start positions"
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-300 text-xs font-medium border border-stone-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Fleet KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="bg-stone-950/80 p-2.5 rounded-xl border border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Navigation className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] text-stone-400 uppercase font-semibold">Moving (En Route)</div>
              <div className="text-sm font-black text-emerald-400">{movingCount} Techs on Road</div>
            </div>
          </div>
        </div>

        <div className="bg-stone-950/80 p-2.5 rounded-xl border border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-stone-400 uppercase font-semibold">On Site (Customer)</div>
              <div className="text-sm font-black text-amber-400">{onSiteCount} Working</div>
            </div>
          </div>
        </div>

        <div className="bg-stone-950/80 p-2.5 rounded-xl border border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-stone-400 uppercase font-semibold">Total GPS Beacons</div>
              <div className="text-sm font-black text-white">{totalFleet} Tracked</div>
            </div>
          </div>
        </div>

        <div className="bg-stone-950/80 p-2.5 rounded-xl border border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-stone-800 text-stone-400 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-stone-400 uppercase font-semibold">Radar Ping Rate</div>
              <div className="text-[11px] font-bold text-stone-200">Every 3.5s (5G Telemetry)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Radar Map (Left) + Technician Detail & History Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* Interactive Visual Fleet Radar Canvas (8 cols on lg) */}
        <div className="lg:col-span-7 xl:col-span-8 bg-stone-950 rounded-2xl border border-stone-800 overflow-hidden relative flex flex-col shadow-inner">
          {/* Map Header Overlay Bar */}
          <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between pointer-events-none">
            <div className="bg-stone-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-stone-750 text-xs flex items-center gap-2 shadow-lg pointer-events-auto">
              <Compass className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '14s' }} />
              <span className="font-bold text-stone-200">
                {selectedCity === 'All' ? 'Pakistan Central Dispatch Grid' : `${selectedCity} Sector Grid`}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>

            {/* Map Mode Buttons */}
            <div className="bg-stone-900/90 backdrop-blur-md p-1 rounded-xl border border-stone-750 flex items-center gap-1 shadow-lg pointer-events-auto">
              <button
                onClick={() => setShowSatelliteView(false)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                  !showSatelliteView ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Road Radar
              </button>
              <button
                onClick={() => setShowSatelliteView(true)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                  showSatelliteView ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Satellite Dark
              </button>
            </div>
          </div>

          {/* Interactive SVG City Radar Map */}
          <div className="relative w-full h-[360px] sm:h-[440px] bg-stone-950 overflow-hidden select-none">
            {/* Background Grid Pattern */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 500 440"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path
                    d="M 24 0 L 0 0 0 24"
                    fill="none"
                    stroke={showSatelliteView ? 'rgba(70, 85, 110, 0.15)' : 'rgba(255, 255, 255, 0.04)'}
                    strokeWidth="1"
                  />
                </pattern>
                {/* Radar Sweep Effect */}
                <radialGradient id="radarSweep" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.12" />
                  <stop offset="70%" stopColor="#059669" stopOpacity="0.04" />
                  <stop offset="100%" stopColor="#047857" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Base terrain background */}
              <rect
                width="500"
                height="440"
                fill={showSatelliteView ? '#0c131d' : '#0a0a0a'}
              />
              <rect width="500" height="440" fill="url(#grid)" />

              {/* Waterway / Canal (Canal Road Lahore / River / Coast) */}
              <path
                d="M 10,320 Q 180,240 320,160 T 500,80"
                fill="none"
                stroke={showSatelliteView ? '#1e3a5f' : '#142a42'}
                strokeWidth="16"
                strokeLinecap="round"
                opacity="0.6"
              />
              <path
                d="M 10,320 Q 180,240 320,160 T 500,80"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="3"
                strokeDasharray="4 4"
                opacity="0.5"
              />

              {/* Arterial Roads & Highways */}
              {(CITY_ROADS[selectedCity === 'All' ? 'Lahore' : selectedCity] || CITY_ROADS['Lahore']).map(
                (road, idx) => (
                  <g key={idx}>
                    {/* Road bed glow */}
                    <path
                      d={road.path}
                      fill="none"
                      stroke={road.isHighSpeed ? '#334155' : '#262626'}
                      strokeWidth={road.isHighSpeed ? '8' : '5'}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Highway center dash */}
                    <path
                      d={road.path}
                      fill="none"
                      stroke={road.isHighSpeed ? '#eab308' : '#737373'}
                      strokeWidth={road.isHighSpeed ? '1.5' : '1'}
                      strokeDasharray={road.isHighSpeed ? '6 4' : 'none'}
                      opacity={road.isHighSpeed ? '0.7' : '0.4'}
                    />
                  </g>
                )
              )}

              {/* Major District Landmarks */}
              <g className="text-[9px] font-bold fill-stone-500 select-none">
                <text x="210" y="140" fill="#94a3b8">Gulberg III</text>
                <text x="360" y="240" fill="#94a3b8">DHA Phase 5</text>
                <text x="140" y="270" fill="#94a3b8">Johar Town</text>
                <text x="220" y="320" fill="#94a3b8">Model Town</text>
                <text x="400" y="80" fill="#38bdf8">Ring Road L-20</text>
              </g>

              {/* Selected Technician: Render Journey Route Trail / Breadcrumbs ("Kha Kha Ja Raha Ha") */}
              {selectedTech && selectedTech.routeHistory && selectedTech.routeHistory.length > 0 && (
                <g id="selected-tech-journey-trail">
                  {/* Draw Polyline connecting waypoints */}
                  <polyline
                    points={selectedTech.routeHistory
                      .map((pt) => {
                        const p = projectCoords(pt.lat, pt.lng, selectedTech.city);
                        return `${p.x},${p.y}`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="6 4"
                    opacity="0.85"
                  />

                  {/* Waypoint markers on trail */}
                  {selectedTech.routeHistory.map((point, pIdx) => {
                    const coords = projectCoords(point.lat, point.lng, selectedTech.city);
                    const isOrigin = point.type === 'origin';
                    const isStop = point.type === 'stop';
                    const isDest = point.type === 'destination';

                    return (
                      <g key={point.id || pIdx} transform={`translate(${coords.x}, ${coords.y})`}>
                        {isOrigin && (
                          <circle r="7" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
                        )}
                        {isStop && (
                          <g>
                            <circle r="6" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                            <text
                              x="9"
                              y="3"
                              className="text-[9px] font-black fill-emerald-300"
                            >
                              ✓ {point.label}
                            </text>
                          </g>
                        )}
                        {isDest && (
                          <g>
                            <circle r="8" fill="#ef4444" stroke="#ffffff" strokeWidth="2" className="animate-pulse" />
                            <text
                              x="11"
                              y="4"
                              className="text-[9px] font-black fill-rose-300"
                            >
                              🎯 {point.label}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </g>
              )}

              {/* Render All Technicians as Active Moving Radar Blips */}
              {activeTechList.map((tech) => {
                const pt = projectCoords(tech.lat, tech.lng, tech.city);
                const isSelected = selectedTech?.technicianId === tech.technicianId;
                const isMoving = tech.status === 'moving';
                const isAtCustomer = tech.status === 'at_customer';

                return (
                  <g
                    key={tech.technicianId}
                    transform={`translate(${pt.x}, ${pt.y})`}
                    className="cursor-pointer group"
                    onClick={() => {
                      setSelectedTechId(tech.technicianId);
                      if (onSelectTechnician) onSelectTechnician(tech.technicianId);
                    }}
                  >
                    {/* Live Radar Pulse Rings */}
                    {isMoving && (
                      <circle
                        r="22"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="1.5"
                        opacity="0.6"
                        className="animate-ping"
                      />
                    )}
                    {isAtCustomer && (
                      <circle
                        r="18"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="1.5"
                        opacity="0.5"
                        className="animate-ping"
                      />
                    )}

                    {/* Outer halo if selected */}
                    {isSelected && (
                      <circle
                        r="18"
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth="3"
                        strokeDasharray="4 2"
                      />
                    )}

                    {/* Blip Circle */}
                    <circle
                      r={isSelected ? '12' : '10'}
                      fill={isMoving ? '#10b981' : isAtCustomer ? '#f59e0b' : '#64748b'}
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      className="shadow-xl"
                    />

                    {/* Blip Vehicle Icon */}
                    <text
                      x="0"
                      y="3.5"
                      textAnchor="middle"
                      className="text-[9px] font-black fill-stone-950 pointer-events-none select-none"
                    >
                      {tech.vehicle === 'van' ? '🚐' : '🏍️'}
                    </text>

                    {/* Technician Name Floating Tag */}
                    <g transform="translate(0, -18)">
                      <rect
                        x="-48"
                        y="-14"
                        width="96"
                        height="16"
                        rx="8"
                        fill={isSelected ? '#f59e0b' : '#1c1917'}
                        stroke={isSelected ? '#ffffff' : '#44403c'}
                        strokeWidth="1"
                        className="shadow-md"
                      />
                      <text
                        x="0"
                        y="-3"
                        textAnchor="middle"
                        fill={isSelected ? '#0c0a09' : '#f5f5f4'}
                        className="text-[9px] font-extrabold"
                      >
                        {tech.technicianName.split(' ')[0]} • {tech.speedKmh}k/h
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>

            {/* Bottom Left Map Legend */}
            <div className="absolute bottom-2.5 left-2.5 bg-stone-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-stone-800 text-[10px] space-y-1 z-10 shadow-lg">
              <div className="font-bold text-stone-300 uppercase tracking-wider text-[9px]">Map Legend</div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-stone-300">En Route / Moving (آن روٹ)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-stone-300">At Customer Site (سائٹ پر)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-1 border-t-2 border-dashed border-amber-400" />
                <span className="text-stone-300">Live Journey Trail (کہاں کہاں گیا)</span>
              </div>
            </div>

            {/* Bottom Right Re-center Button */}
            <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 z-10">
              <button
                onClick={() => handlePingTech(selectedTech?.technicianId || 'tech-1')}
                className="px-2.5 py-1.5 rounded-xl bg-stone-900/90 hover:bg-stone-800 backdrop-blur-md border border-stone-750 text-stone-200 text-xs font-bold flex items-center gap-1 shadow-lg active:scale-95"
              >
                <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                <span>Track Step</span>
              </button>
            </div>
          </div>
        </div>

        {/* Technician Inspector & Journey History Drawer (4-5 cols on lg) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-3">
          {/* Active Technician Profile Card */}
          {selectedTech ? (
            <div className="bg-stone-950 p-3.5 rounded-2xl border border-stone-800 flex flex-col gap-3 shadow-lg">
              {/* Header: Tech Name, Role & Status */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-stone-950 flex items-center justify-center font-black text-sm shadow-md">
                      {selectedTech.technicianName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <span
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-stone-950 flex items-center justify-center text-[8px] ${
                        selectedTech.status === 'moving'
                          ? 'bg-emerald-500'
                          : selectedTech.status === 'at_customer'
                          ? 'bg-amber-500'
                          : 'bg-stone-600'
                      }`}
                    >
                      {selectedTech.vehicle === 'van' ? '🚐' : '🏍️'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>{selectedTech.technicianName}</span>
                    </h3>
                    <div className="text-[11px] text-stone-400 flex items-center gap-1">
                      <span>{selectedTech.city}</span>
                      <span>•</span>
                      <span className="font-mono text-stone-300">{selectedTech.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Status Pill */}
                <div className="text-right">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      selectedTech.status === 'moving'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : selectedTech.status === 'at_customer'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    {selectedTech.status === 'moving' ? (
                      <>
                        <Navigation className="w-3 h-3 animate-pulse" />
                        <span>En Route</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="w-3 h-3" />
                        <span>At Customer</span>
                      </>
                    )}
                  </span>
                  <div className="text-[10px] text-stone-400 mt-1">
                    Ping: {new Date(selectedTech.lastPing).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>
              </div>

              {/* Telemetry Gauge Bar: Speed, Battery, Distance */}
              <div className="grid grid-cols-3 gap-2 bg-stone-900/80 p-2.5 rounded-xl border border-stone-800/80 text-center">
                <div>
                  <div className="text-[10px] text-stone-400 font-semibold uppercase flex items-center justify-center gap-1">
                    <Navigation className="w-3 h-3 text-emerald-400" />
                    <span>Speed</span>
                  </div>
                  <div className="text-base font-black text-emerald-400 mt-0.5">
                    {selectedTech.speedKmh} <span className="text-[10px] font-normal text-stone-400">km/h</span>
                  </div>
                </div>

                <div className="border-x border-stone-800">
                  <div className="text-[10px] text-stone-400 font-semibold uppercase flex items-center justify-center gap-1">
                    <Battery className="w-3 h-3 text-amber-400" />
                    <span>Battery</span>
                  </div>
                  <div className="text-base font-black text-amber-400 mt-0.5">
                    {selectedTech.batteryLevel}%
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-stone-400 font-semibold uppercase flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3 text-blue-400" />
                    <span>Est. Arrival</span>
                  </div>
                  <div className="text-base font-black text-blue-400 mt-0.5">
                    {selectedTech.etaMinutes ? `${selectedTech.etaMinutes} min` : 'On Site'}
                  </div>
                </div>
              </div>

              {/* Current Live Address */}
              <div className="bg-stone-900/60 p-2.5 rounded-xl border border-stone-800/60">
                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Current GPS Address (موجودہ لوکیشن)</span>
                  <span className="text-emerald-400 text-[9px] font-mono">GPS ±3m</span>
                </div>
                <div className="text-xs font-semibold text-stone-200 leading-snug">
                  {selectedTech.address}
                </div>
                <div className="text-[10px] font-mono text-stone-400 mt-1">
                  Coords: {selectedTech.lat.toFixed(5)}° N, {selectedTech.lng.toFixed(5)}° E
                </div>
              </div>

              {/* Current Job Reference & Target Site */}
              {selectedTech.destinationCustomer && (
                <div className="bg-amber-500/10 border border-amber-500/25 p-2.5 rounded-xl">
                  <div className="text-[10px] font-black text-amber-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Active Assigned Job (کرنٹ ٹاسک)</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[9px]">
                      {selectedTech.currentJobId || 'JOB-ACTIVE'}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-stone-100">
                    Customer: {selectedTech.destinationCustomer}
                  </div>
                  <div className="text-[11px] text-stone-300 mt-0.5">
                    📍 {selectedTech.destinationAddress}
                  </div>
                  {selectedTech.distanceRemainingKm !== undefined && selectedTech.distanceRemainingKm > 0 && (
                    <div className="text-[10px] font-bold text-amber-300 mt-1 flex items-center gap-1">
                      <span>Remaining: {selectedTech.distanceRemainingKm} km</span>
                      <span>•</span>
                      <span>ETA: ~{selectedTech.etaMinutes} mins</span>
                    </div>
                  )}
                </div>
              )}

              {/* Direct Quick Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-800/80">
                <button
                  onClick={() => handleCall(selectedTech.phone)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-stone-850 hover:bg-stone-800 border border-stone-750 text-stone-200 text-xs font-bold active:scale-95 transition"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Call Tech</span>
                </button>

                <button
                  onClick={() => handleWhatsApp(selectedTech.phone, selectedTech.technicianName)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold active:scale-95 transition shadow-sm"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-white" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-stone-950 p-6 rounded-2xl border border-stone-800 text-center text-stone-400">
              Select a technician from the roster or map to inspect their live GPS position.
            </div>
          )}

          {/* Today's Journey History & Breadcrumb Trail ("Kha Kha Ja Raha Ha") */}
          {selectedTech && selectedTech.routeHistory && (
            <div className="bg-stone-950 p-3.5 rounded-2xl border border-stone-800 flex flex-col gap-2.5 shadow-lg">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Today's Trip Route ("کہاں کہاں گیا")</span>
                </h4>
                <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  {selectedTech.routeHistory.length} Waypoints
                </span>
              </div>

              {/* Vertical Timeline */}
              <div className="space-y-3 pt-1">
                {selectedTech.routeHistory.map((pt, idx) => {
                  const isOrigin = pt.type === 'origin';
                  const isStop = pt.type === 'stop';
                  const isCurrent = pt.type === 'current';
                  const isDest = pt.type === 'destination';

                  return (
                    <div key={pt.id || idx} className="flex items-start gap-2.5 relative">
                      {/* Timeline Line */}
                      {idx < selectedTech.routeHistory.length - 1 && (
                        <div className="absolute left-2.5 top-5 bottom-0 w-0.5 bg-stone-800 -mb-3" />
                      )}

                      {/* Timeline Icon */}
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 z-10 text-[9px] font-bold ${
                          isOrigin
                            ? 'bg-blue-600 text-white'
                            : isStop
                            ? 'bg-emerald-600 text-white'
                            : isCurrent
                            ? 'bg-amber-500 text-stone-950 ring-4 ring-amber-500/20 animate-pulse'
                            : 'bg-rose-600 text-white'
                        }`}
                      >
                        {isOrigin ? 'HQ' : isStop ? '✓' : isCurrent ? '📍' : '🎯'}
                      </div>

                      {/* Content */}
                      <div className="flex-1 bg-stone-900/60 p-2 rounded-xl border border-stone-850 text-xs">
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-bold text-[11px] ${
                              isCurrent
                                ? 'text-amber-400'
                                : isDest
                                ? 'text-rose-400'
                                : 'text-stone-200'
                            }`}
                          >
                            {pt.label}
                          </span>
                          <span className="text-[9px] font-mono text-stone-400">{pt.time}</span>
                        </div>
                        <div className="text-[10px] text-stone-300 mt-0.5">{pt.address}</div>
                        {pt.status && (
                          <div className="text-[9px] text-stone-400 mt-1 italic bg-stone-950/40 px-1.5 py-0.5 rounded">
                            {pt.status}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Technician Fleet Roster Cards (Quick Switcher bar at bottom) */}
      <div className="mt-1 bg-stone-950 p-3 rounded-2xl border border-stone-800">
        <div className="text-xs font-bold text-stone-300 mb-2 flex items-center justify-between">
          <span>All Registered Field Technicians (آن فیلڈ ٹیکنیشنز کی لسٹ)</span>
          <span className="text-[10px] text-stone-400">Click technician to track on radar map</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {Object.values(locations).map((t) => {
            const isSelected = selectedTech?.technicianId === t.technicianId;
            return (
              <button
                key={t.technicianId}
                onClick={() => setSelectedTechId(t.technicianId)}
                className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/60 text-white shadow-md'
                    : 'bg-stone-900/70 hover:bg-stone-850 border-stone-800 text-stone-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-stone-800 text-amber-400 flex items-center justify-center font-bold text-xs">
                    {t.technicianName[0]}
                  </div>
                  <div>
                    <div className="text-xs font-bold leading-tight">{t.technicianName}</div>
                    <div className="text-[10px] text-stone-400 flex items-center gap-1">
                      <span>{t.city}</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-mono">{t.speedKmh} km/h</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`w-2.5 h-2.5 rounded-full inline-block ${
                      t.status === 'moving'
                        ? 'bg-emerald-500 animate-ping'
                        : t.status === 'at_customer'
                        ? 'bg-amber-500'
                        : 'bg-stone-600'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
