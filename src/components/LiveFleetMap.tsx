import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
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
  Layers,
  ChevronRight,
  Shield,
  Eye,
  CheckCircle2,
  Bike,
  Truck,
  Crosshair,
  ExternalLink,
  Search,
  RefreshCw,
  LocateFixed,
  Filter,
  Wifi,
  WifiOff,
  AlertOctagon,
} from 'lucide-react';
import { TechnicianLiveLocation, Technician } from '../types';
import {
  TrackingService,
  getTechConnectionStatus,
  TechConnectionStatus,
} from '../services/trackingService';

interface LiveFleetMapProps {
  technicians: Technician[];
  onSelectTechnician?: (techId: string) => void;
}

// Pre-defined city coordinates for instant map focus
const CITY_CENTERS: Record<string, { lat: number; lng: number; zoom: number; label: string }> = {
  All: { lat: 31.6253, lng: 71.0657, zoom: 7, label: 'All Fleet' },
  Bhakkar: { lat: 31.6253, lng: 71.0657, zoom: 13, label: 'Bhakkar (HQ)' },
  Lahore: { lat: 31.5204, lng: 74.3587, zoom: 12, label: 'Lahore' },
  Islamabad: { lat: 33.6844, lng: 73.0479, zoom: 12, label: 'Islamabad' },
  Karachi: { lat: 24.8607, lng: 67.0011, zoom: 12, label: 'Karachi' },
  Faisalabad: { lat: 31.4180, lng: 73.0791, zoom: 12, label: 'Faisalabad' },
  Multan: { lat: 30.1575, lng: 71.5249, zoom: 12, label: 'Multan' },
  Rawalpindi: { lat: 33.5651, lng: 73.0169, zoom: 12, label: 'Rawalpindi' },
};

// Map Tile Layers
const TILE_LAYERS = {
  streets: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar',
    maxZoom: 18,
  },
};

export const LiveFleetMap: React.FC<LiveFleetMapProps> = ({ technicians, onSelectTechnician }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const routeLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // 1-second live ticker to update connection elapsed times in real time
  const [currentTimestamp, setCurrentTimestamp] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimestamp(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [locations, setLocations] = useState<Record<string, TechnicianLiveLocation>>(() =>
    TrackingService.getLocations()
  );
  const [selectedTechId, setSelectedTechId] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [mapType, setMapType] = useState<'streets' | 'satellite'>('streets');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'offline'>('all');
  const [lastRefreshed, setLastRefreshed] = useState<string>('Live Stream Active');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [deviceGpsMessage, setDeviceGpsMessage] = useState<string>('');
  const [showTechDrawer, setShowTechDrawer] = useState<boolean>(false);

  // Subscribe to real-time GPS telemetry from Firestore & Local Broadcast
  useEffect(() => {
    const unsubscribe = TrackingService.subscribe((updated) => {
      setLocations({ ...updated });
      setLastRefreshed(
        new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    });
    return () => unsubscribe();
  }, []);

  // Merge registered technicians with ONLY REAL location telemetry
  // ZERO fake random coordinates!
  const enrichedTechnicians = useMemo(() => {
    return technicians.map((t) => {
      const loc = locations[t.id];
      const hasRealGps = !!(loc && typeof loc.lat === 'number' && typeof loc.lng === 'number');
      const connection = getTechConnectionStatus(loc);

      const mergedData: TechnicianLiveLocation & {
        hasRealGps: boolean;
        connection: TechConnectionStatus;
      } = {
        technicianId: t.id,
        technicianName: t.name,
        phone: t.phone || loc?.phone || '',
        city: t.city || loc?.city || 'Bhakkar',
        lat: hasRealGps ? loc.lat : 31.6253,
        lng: hasRealGps ? loc.lng : 71.0657,
        address: hasRealGps ? loc.address || `${t.city} GPS Area` : 'No GPS Signal Received',
        speedKmh: hasRealGps && connection.isOnline ? loc.speedKmh || 0 : 0,
        heading: loc?.heading || 0,
        batteryLevel: loc?.batteryLevel ?? null,
        status: !hasRealGps
          ? 'offline'
          : !connection.isOnline
          ? 'offline'
          : loc.status || 'at_customer',
        vehicle: loc?.vehicle || 'bike',
        currentJobId: loc?.currentJobId,
        currentJobType: loc?.currentJobType,
        destinationCustomer: loc?.destinationCustomer,
        destinationAddress: loc?.destinationAddress,
        destinationLat: loc?.destinationLat,
        destinationLng: loc?.destinationLng,
        distanceRemainingKm: loc?.distanceRemainingKm || 0,
        etaMinutes: loc?.etaMinutes || 0,
        lastPing: loc?.lastPing,
        isLiveBeaconActive: connection.isOnline,
        routeHistory: loc?.routeHistory || [],
        hasRealGps,
        connection,
      };

      return mergedData;
    });
  }, [technicians, locations, currentTimestamp]);

  // Set default selected tech
  useEffect(() => {
    if (!selectedTechId && enrichedTechnicians.length > 0) {
      setSelectedTechId(enrichedTechnicians[0].technicianId);
    }
  }, [enrichedTechnicians, selectedTechId]);

  // Filtered technicians list
  const filteredTechList = useMemo(() => {
    return enrichedTechnicians.filter((tech) => {
      // City filter
      if (selectedCity !== 'All' && tech.city.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }
      // Status filter (all, live, offline)
      if (statusFilter === 'live' && !tech.connection.isOnline) {
        return false;
      }
      if (statusFilter === 'offline' && tech.connection.isOnline) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = tech.technicianName.toLowerCase().includes(q);
        const matchesCity = tech.city.toLowerCase().includes(q);
        const matchesPhone = tech.phone.includes(q);
        return matchesName || matchesCity || matchesPhone;
      }
      return true;
    });
  }, [enrichedTechnicians, selectedCity, statusFilter, searchQuery]);

  const selectedTech =
    enrichedTechnicians.find((t) => t.technicianId === selectedTechId) ||
    filteredTechList[0] ||
    enrichedTechnicians[0];

  // Counts
  const totalFleetCount = enrichedTechnicians.length;
  const liveCount = enrichedTechnicians.filter((t) => t.connection.isOnline).length;
  const offlineCount = enrichedTechnicians.filter((t) => !t.connection.isOnline).length;
  const offlineTechniciansList = enrichedTechnicians.filter((t) => !t.connection.isOnline);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialCenter: [number, number] = [
        selectedTech?.hasRealGps ? selectedTech.lat : 31.6253,
        selectedTech?.hasRealGps ? selectedTech.lng : 71.0657,
      ];

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 12,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      L.control
        .attribution({ position: 'bottomleft', prefix: false })
        .addAttribution('&copy; <a href="https://openstreetmap.org">OSM</a> | K&amp;S Solar Live GPS')
        .addTo(map);

      // Tile Layer
      const tileConfig = TILE_LAYERS[mapType];
      const tileLayer = L.tileLayer(tileConfig.url, {
        maxZoom: tileConfig.maxZoom,
      }).addTo(map);
      tileLayerRef.current = tileLayer;

      // Layer group for route polylines
      const routeGroup = L.layerGroup().addTo(map);
      routeLayerGroupRef.current = routeGroup;

      mapInstanceRef.current = map;

      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current.clear();
      }
    };
  }, []);

  // Handle Map Type change (Street vs Satellite)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const tileConfig = TILE_LAYERS[mapType];
    const newTileLayer = L.tileLayer(tileConfig.url, {
      maxZoom: tileConfig.maxZoom,
    }).addTo(map);

    tileLayerRef.current = newTileLayer;
  }, [mapType]);

  // Update Technician Markers on Map
  // ONLY render markers for technicians with REAL GPS coordinates!
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const currentMarkers = markersRef.current;
    const activeIds = new Set<string>();

    enrichedTechnicians.forEach((tech) => {
      // Only plot if technician has real GPS coordinates
      if (!tech.hasRealGps) return;

      activeIds.add(tech.technicianId);

      const isSelected = tech.technicianId === selectedTechId;
      const isOnline = tech.connection.isOnline;
      const isMoving = isOnline && tech.speedKmh > 3;

      const markerBg = isOnline ? '#10b981' : '#e11d48'; // Emerald for online, Rose for offline

      // Custom HTML DivIcon
      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer select-none">
          ${
            isOnline
              ? `<span class="absolute w-10 h-10 rounded-full animate-ping opacity-75" style="background-color: ${markerBg}40;"></span>`
              : ''
          }
          <div class="w-9 h-9 rounded-2xl flex items-center justify-center text-white shadow-xl transition-transform ${
            isSelected ? 'scale-125 ring-3 ring-cyan-400' : 'hover:scale-110'
          }" style="background-color: ${markerBg}; border: 2.5px solid white;">
            <span class="text-xs font-black">${tech.technicianName.charAt(0)}</span>
          </div>
          <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 ${
            isOnline ? 'bg-slate-900/95 text-white' : 'bg-rose-950/95 text-rose-200 border border-rose-600/60'
          } text-[9px] font-black px-1.5 py-0.5 rounded-md whitespace-nowrap shadow-md pointer-events-none flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}"></span>
            <span>${tech.technicianName.split(' ')[0]}</span>
            ${isMoving ? `<span class="text-emerald-400 font-bold">${tech.speedKmh}k</span>` : ''}
            ${!isOnline ? `<span class="text-rose-400 font-bold">OFFLINE</span>` : ''}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-leaflet-tech-marker',
        html: iconHtml,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -22],
      });

      // Construct Popup Content with actions
      const cleanPhone = (tech.phone || '03362475996').replace(/\D/g, '');
      const intlPhone = cleanPhone.startsWith('0') ? '92' + cleanPhone.slice(1) : cleanPhone;
      const gMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${tech.lat},${tech.lng}`;

      const popupHtml = `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 230px; padding: 4px;" class="text-slate-800">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
            <div>
              <h4 style="font-size: 13px; font-weight: 800; margin: 0; color: #0f172a;">${tech.technicianName}</h4>
              <p style="font-size: 10px; color: #64748b; margin: 0;">📍 ${tech.city} · ${tech.phone}</p>
            </div>
            <span style="background-color: ${isOnline ? '#ecfdf5' : '#fff1f2'}; color: ${
        isOnline ? '#059669' : '#e11d48'
      }; font-size: 9px; font-weight: 800; padding: 2px 7px; border-radius: 9999px; border: 1px solid ${
        isOnline ? '#a7f3d0' : '#fecdd3'
      }; text-transform: uppercase;">
              ● ${isOnline ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; background-color: #f8fafc; padding: 6px; border-radius: 8px; margin-bottom: 8px; font-size: 11px;">
            <div>
              <span style="font-size: 9px; color: #94a3b8; display: block; font-weight: 700;">STATUS</span>
              <strong style="color: ${isOnline ? '#059669' : '#e11d48'};">${tech.connection.timeAgoText}</strong>
            </div>
            <div>
              <span style="font-size: 9px; color: #94a3b8; display: block; font-weight: 700;">SPEED</span>
              <strong style="color: #0f172a;">${tech.speedKmh} km/h</strong>
            </div>
          </div>

          <div style="font-size: 10px; color: #475569; margin-bottom: 8px; line-height: 1.3;">
            <p style="margin: 0;"><strong>Address:</strong> ${tech.address}</p>
            <p style="margin: 3px 0 0 0; color: #64748b;"><strong>Last Ping:</strong> ${tech.connection.lastContactTime}</p>
          </div>

          <div style="display: flex; gap: 4px; padding-top: 6px; border-top: 1px solid #f1f5f9;">
            <a href="tel:${tech.phone}" style="flex: 1; text-align: center; background-color: #0f172a; color: white; padding: 6px 4px; border-radius: 6px; font-size: 10px; font-weight: 800; text-decoration: none;">
              📞 Call
            </a>
            <a href="https://wa.me/${intlPhone}" target="_blank" style="flex: 1; text-align: center; background-color: #10b981; color: white; padding: 6px 4px; border-radius: 6px; font-size: 10px; font-weight: 800; text-decoration: none;">
              💬 WhatsApp
            </a>
            <a href="${gMapsUrl}" target="_blank" style="flex: 1; text-align: center; background-color: #0284c7; color: white; padding: 6px 4px; border-radius: 6px; font-size: 10px; font-weight: 800; text-decoration: none;">
              🗺️ Nav
            </a>
          </div>
        </div>
      `;

      if (currentMarkers.has(tech.technicianId)) {
        const marker = currentMarkers.get(tech.technicianId)!;
        marker.setLatLng([tech.lat, tech.lng]);
        marker.setIcon(customIcon);
        marker.setPopupContent(popupHtml);
      } else {
        const marker = L.marker([tech.lat, tech.lng], { icon: customIcon }).addTo(map);
        marker.bindPopup(popupHtml);
        marker.on('click', () => {
          setSelectedTechId(tech.technicianId);
        });
        currentMarkers.set(tech.technicianId, marker);
      }
    });

    // Remove markers for technicians without GPS or obsolete
    currentMarkers.forEach((marker, id) => {
      if (!activeIds.has(id)) {
        map.removeLayer(marker);
        currentMarkers.delete(id);
      }
    });
  }, [enrichedTechnicians, selectedTechId]);

  // City Switch handler
  const handleSelectCity = (cityKey: string) => {
    setSelectedCity(cityKey);
    const map = mapInstanceRef.current;
    if (!map) return;

    if (cityKey === 'All') {
      const realPoints = enrichedTechnicians
        .filter((t) => t.hasRealGps)
        .map((t) => [t.lat, t.lng] as [number, number]);

      if (realPoints.length > 0) {
        const bounds = L.latLngBounds(realPoints);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      } else {
        const defaultCoord = CITY_CENTERS.Bhakkar;
        map.flyTo([defaultCoord.lat, defaultCoord.lng], 10);
      }
    } else {
      const city = CITY_CENTERS[cityKey];
      if (city) {
        map.flyTo([city.lat, city.lng], city.zoom, { duration: 1.2 });
      }
    }
  };

  // Fly directly to a technician
  const handleFlyToTech = (tech: (typeof enrichedTechnicians)[0]) => {
    setSelectedTechId(tech.technicianId);
    if (onSelectTechnician) {
      onSelectTechnician(tech.technicianId);
    }
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tech.hasRealGps) {
      map.flyTo([tech.lat, tech.lng], 15, { duration: 1 });
      const marker = markersRef.current.get(tech.technicianId);
      if (marker) {
        setTimeout(() => marker.openPopup(), 1000);
      }
    } else {
      setDeviceGpsMessage(`⚠️ ${tech.technicianName} has not transmitted GPS yet.`);
      setTimeout(() => setDeviceGpsMessage(''), 4000);
    }
  };

  // Trigger Real Device GPS capture
  const handlePingHardwareGps = () => {
    if (!navigator.geolocation) {
      setDeviceGpsMessage('Geolocation not supported by device browser.');
      setTimeout(() => setDeviceGpsMessage(''), 3000);
      return;
    }

    setIsRefreshing(true);
    setDeviceGpsMessage('Fixing real hardware satellite GPS position...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy, speed } = pos.coords;
        const currentSpeedKmh = speed ? Math.round(speed * 3.6) : 0;

        const targetId = selectedTechId || enrichedTechnicians[0]?.technicianId || 'tech-1';
        TrackingService.updateTechLocation(targetId, {
          lat: latitude,
          lng: longitude,
          speedKmh: currentSpeedKmh,
          accuracy: Math.round(accuracy),
          status: currentSpeedKmh > 3 ? 'moving' : 'at_customer',
          address: `Live Fixed: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
          lastPing: new Date().toISOString(),
        });

        setIsRefreshing(false);
        setDeviceGpsMessage(`✓ Live GPS Transmitted: ±${Math.round(accuracy)}m accuracy`);
        setTimeout(() => setDeviceGpsMessage(''), 4000);

        const map = mapInstanceRef.current;
        if (map) {
          map.flyTo([latitude, longitude], 16, { duration: 1.2 });
        }
      },
      (err) => {
        setIsRefreshing(false);
        setDeviceGpsMessage(`GPS Error: ${err.message}`);
        setTimeout(() => setDeviceGpsMessage(''), 4000);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-3 font-sans">
      {/* 1. TOP LIVE FLEET TELEMETRY HEADER BAR */}
      <div className="bg-slate-900 text-white rounded-3xl p-3.5 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <span>Live Fleet GPS Stream</span>
                <span className="text-[10px] text-emerald-300 font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded-full border border-emerald-500/40">
                  ⚡ 1s Realtime
                </span>
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">
                Stream: {lastRefreshed} · Zero Demo Data
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Real Hardware GPS Broadcast */}
            <button
              type="button"
              onClick={handlePingHardwareGps}
              disabled={isRefreshing}
              title="Broadcast Live GPS Ping"
              className="px-2.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Broadcasting...' : 'Ping GPS'}</span>
            </button>

            {/* Toggle Satellite / Street */}
            <button
              type="button"
              onClick={() => setMapType(mapType === 'streets' ? 'satellite' : 'streets')}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white text-[11px] font-bold border border-slate-700 flex items-center gap-1 transition"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span className="capitalize">{mapType === 'streets' ? 'Satellite' : 'Street'}</span>
            </button>
          </div>
        </div>

        {/* Feedback Banner for GPS Hardware Ping */}
        {deviceGpsMessage && (
          <div className="px-3 py-1.5 rounded-xl bg-cyan-950/90 border border-cyan-500/50 text-cyan-200 text-[11px] font-bold flex items-center gap-2 animate-in fade-in">
            <LocateFixed className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>{deviceGpsMessage}</span>
          </div>
        )}

        {/* 3 Metric Status Cards: Total, Live, Offline */}
        <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-800">
          <div
            onClick={() => setStatusFilter('all')}
            className={`cursor-pointer rounded-2xl p-2 border transition ${
              statusFilter === 'all'
                ? 'bg-slate-700 border-cyan-400'
                : 'bg-slate-800/80 border-slate-700/60 hover:bg-slate-750'
            }`}
          >
            <p className="text-[10px] text-slate-400 font-bold uppercase">Total Fleet</p>
            <p className="text-sm font-black text-white">{totalFleetCount}</p>
          </div>

          <div
            onClick={() => setStatusFilter('live')}
            className={`cursor-pointer rounded-2xl p-2 border transition ${
              statusFilter === 'live'
                ? 'bg-emerald-900 border-emerald-400'
                : 'bg-emerald-950/50 border-emerald-500/30 hover:bg-emerald-900/40'
            }`}
          >
            <p className="text-[10px] text-emerald-400 font-bold uppercase">Live Online</p>
            <p className="text-sm font-black text-emerald-400 flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
              <span>{liveCount}</span>
            </p>
          </div>

          <div
            onClick={() => setStatusFilter('offline')}
            className={`cursor-pointer rounded-2xl p-2 border transition ${
              statusFilter === 'offline'
                ? 'bg-rose-900 border-rose-400'
                : 'bg-rose-950/50 border-rose-500/30 hover:bg-rose-900/40'
            }`}
          >
            <p className="text-[10px] text-rose-400 font-bold uppercase">Offline</p>
            <p className="text-sm font-black text-rose-400 flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
              <span>{offlineCount}</span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. PROMINENT OFFLINE ALERT BANNER */}
      {offlineCount > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <p className="text-xs font-black text-rose-900">
                ⚠️ {offlineCount} Technician{offlineCount > 1 ? 's' : ''} Offline (No GPS Signal)
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'offline' ? 'all' : 'offline')}
              className="text-[10px] font-bold text-rose-700 bg-white px-2.5 py-1 rounded-xl border border-rose-200 hover:bg-rose-100 transition"
            >
              {statusFilter === 'offline' ? 'Show All Fleet' : 'View Offline Only'}
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {offlineTechniciansList.map((t) => (
              <button
                key={t.technicianId}
                type="button"
                onClick={() => handleFlyToTech(t)}
                className="flex items-center gap-1.5 bg-white border border-rose-200 px-2 py-1 rounded-xl text-left text-[11px] text-rose-900 hover:bg-rose-100/70 transition"
              >
                <WifiOff className="w-3 h-3 text-rose-600 shrink-0" />
                <span className="font-bold">{t.technicianName}</span>
                <span className="text-[10px] text-rose-600 font-mono">({t.connection.timeAgoText})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. CITY QUICK-ZOOM CHIPS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {Object.keys(CITY_CENTERS).map((cKey) => {
          const isSelected = selectedCity === cKey;
          return (
            <button
              key={cKey}
              type="button"
              onClick={() => handleSelectCity(cKey)}
              className={`px-3 py-1 rounded-full text-xs font-black whitespace-nowrap transition active:scale-95 ${
                isSelected
                  ? 'bg-[#00838f] text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {CITY_CENTERS[cKey].label}
            </button>
          );
        })}
      </div>

      {/* 4. REAL LEAFLET MAP CONTAINER */}
      <div className="relative rounded-3xl overflow-hidden shadow-md border border-slate-200 bg-slate-100">
        <div
          ref={mapContainerRef}
          style={{ height: '380px', width: '100%', zIndex: 1 }}
          className="w-full bg-slate-100"
        />

        {/* Map Overlay: Selected Tech Status Pill */}
        {selectedTech && (
          <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-md rounded-2xl p-2 px-3 shadow-md border border-slate-200 flex items-center gap-2 max-w-[240px]">
            <div
              className={`w-7 h-7 rounded-xl text-white font-black text-xs flex items-center justify-center shrink-0 ${
                selectedTech.connection.isOnline ? 'bg-emerald-600' : 'bg-rose-600'
              }`}
            >
              {selectedTech.technicianName.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-1">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    selectedTech.connection.isOnline
                      ? 'bg-emerald-500 animate-pulse'
                      : 'bg-rose-500'
                  }`}
                />
                <h4 className="text-xs font-black text-slate-900 truncate leading-tight">
                  {selectedTech.technicianName}
                </h4>
              </div>
              <p className="text-[10px] font-bold text-slate-600 truncate">
                {selectedTech.connection.isOnline
                  ? `🚀 ${selectedTech.speedKmh} km/h · ${selectedTech.connection.timeAgoText}`
                  : `🔴 ${selectedTech.connection.timeAgoText}`}
              </p>
            </div>
          </div>
        )}

        {/* Floating Quick Action Drawer Toggle */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => handleSelectCity('All')}
            title="Fit All Technicians"
            className="w-9 h-9 rounded-2xl bg-white/95 backdrop-blur-md text-slate-700 border border-slate-200 shadow-md flex items-center justify-center hover:bg-slate-50 active:scale-95 transition"
          >
            <Crosshair className="w-4 h-4 text-slate-800" />
          </button>
          <button
            type="button"
            onClick={() => setShowTechDrawer(!showTechDrawer)}
            title="Toggle Technician List"
            className="w-9 h-9 rounded-2xl bg-white/95 backdrop-blur-md text-slate-700 border border-slate-200 shadow-md flex items-center justify-center hover:bg-slate-50 active:scale-95 transition"
          >
            <Filter className="w-4 h-4 text-cyan-700" />
          </button>
        </div>
      </div>

      {/* 5. SEARCH & STATUS FILTER BAR */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search technicians by name, city or phone..."
            className="w-full pl-9 pr-3 py-2 bg-white rounded-2xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00838f]"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowTechDrawer(!showTechDrawer)}
          className="px-3 py-2 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50 transition shrink-0"
        >
          <span>List ({filteredTechList.length})</span>
        </button>
      </div>

      {/* 6. TECHNICIAN CARDS GRID */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-600 px-1">
          <span>Active Fleet Roster</span>
          <span className="text-[10px] text-slate-400 font-mono">
            {liveCount} Online · {offlineCount} Offline
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {filteredTechList.map((tech) => {
            const isSelected = tech.technicianId === selectedTechId;
            const isOnline = tech.connection.isOnline;
            const cleanPhone = (tech.phone || '03362475996').replace(/\D/g, '');
            const intlPhone = cleanPhone.startsWith('0') ? '92' + cleanPhone.slice(1) : cleanPhone;

            return (
              <div
                key={tech.technicianId}
                onClick={() => handleFlyToTech(tech)}
                className={`p-3 rounded-2xl border transition cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-cyan-50/70 border-[#00838f] ring-2 ring-[#00838f]/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white font-black text-xs shrink-0 shadow-2xs ${
                        isOnline ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}
                    >
                      {tech.technicianName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <span>{tech.technicianName}</span>
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border ${tech.connection.badgeClass}`}
                        >
                          {isOnline ? '🟢 LIVE' : '🔴 OFFLINE'}
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">
                        📍 {tech.city} · 📞 {tech.phone || 'No phone'}
                      </p>
                    </div>
                  </div>

                  {/* Speed / Live indicator */}
                  <div className="text-right">
                    <span
                      className={`text-[10px] font-black font-mono block ${
                        isOnline ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {tech.connection.timeAgoText}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {isOnline ? `${tech.speedKmh} km/h` : 'No Signal'}
                    </span>
                  </div>
                </div>

                {/* Address & Quick Actions */}
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <p className="text-[10px] text-slate-600 truncate max-w-[180px]">
                    {tech.hasRealGps ? tech.address : '⚠️ No device GPS transmitted'}
                  </p>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={`tel:${tech.phone}`}
                      className="px-2 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-bold hover:bg-slate-800 transition"
                      title="Call"
                    >
                      Call
                    </a>
                    <a
                      href={`https://wa.me/${intlPhone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-500 transition"
                      title="WhatsApp"
                    >
                      WhatsApp
                    </a>
                    {tech.hasRealGps && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${tech.lat},${tech.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 rounded-lg bg-cyan-600 text-white text-[10px] font-bold hover:bg-cyan-500 transition"
                        title="Google Maps"
                      >
                        Nav
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
