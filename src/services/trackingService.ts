import { RouteBreadcrumb, TechnicianLiveLocation, TechTrackingStatus } from '../types';
import { INITIAL_TRACKING_DATA } from '../data/trackingData';
import { db } from './firebase';
import { collection, doc, onSnapshot, setDoc, Unsubscribe } from 'firebase/firestore';

const TRACKING_STORAGE_KEY = 'ks_solar_tech_tracking_v1';

type TrackingListener = (locations: Record<string, TechnicianLiveLocation>) => void;

export interface TechConnectionStatus {
  isOnline: boolean;
  isWeakSignal: boolean;
  statusLabel: 'LIVE (Online)' | 'Signal Delayed' | 'OFFLINE (Disconnected)' | 'No GPS Signal';
  badgeClass: string;
  dotColor: string;
  elapsedSeconds: number;
  timeAgoText: string;
  lastContactTime: string;
}

export function getTechConnectionStatus(tech?: Partial<TechnicianLiveLocation>): TechConnectionStatus {
  if (!tech || !tech.lastPing) {
    return {
      isOnline: false,
      isWeakSignal: false,
      statusLabel: 'No GPS Signal',
      badgeClass: 'bg-stone-100 text-stone-600 border-stone-200',
      dotColor: 'bg-stone-400',
      elapsedSeconds: Infinity,
      timeAgoText: 'Never connected',
      lastContactTime: 'Never',
    };
  }

  const pingTime = new Date(tech.lastPing).getTime();
  const now = Date.now();
  const elapsedSeconds = Math.max(0, Math.floor((now - pingTime) / 1000));

  const lastContactTime = new Date(tech.lastPing).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // Real-time ping within last 15 seconds = Active Live
  if (elapsedSeconds <= 15) {
    return {
      isOnline: true,
      isWeakSignal: false,
      statusLabel: 'LIVE (Online)',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotColor: 'bg-emerald-500 animate-pulse',
      elapsedSeconds,
      timeAgoText: elapsedSeconds <= 2 ? 'Active right now' : `${elapsedSeconds}s ago`,
      lastContactTime,
    };
  }

  // Ping between 15s and 60s = Signal Delayed
  if (elapsedSeconds <= 60) {
    return {
      isOnline: true,
      isWeakSignal: true,
      statusLabel: 'Signal Delayed',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      dotColor: 'bg-amber-500',
      elapsedSeconds,
      timeAgoText: `${elapsedSeconds}s ago`,
      lastContactTime,
    };
  }

  // Ping > 60s = OFFLINE / DISCONNECTED
  let timeAgoText = '';
  if (elapsedSeconds < 3600) {
    const mins = Math.floor(elapsedSeconds / 60);
    timeAgoText = `${mins} min${mins === 1 ? '' : 's'} ago`;
  } else if (elapsedSeconds < 86400) {
    const hours = Math.floor(elapsedSeconds / 3600);
    timeAgoText = `${hours} hour${hours === 1 ? '' : 's'} ago`;
  } else {
    const days = Math.floor(elapsedSeconds / 86400);
    timeAgoText = `${days} day${days === 1 ? '' : 's'} ago`;
  }

  return {
    isOnline: false,
    isWeakSignal: false,
    statusLabel: 'OFFLINE (Disconnected)',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    dotColor: 'bg-rose-500',
    elapsedSeconds,
    timeAgoText: `Offline since ${timeAgoText}`,
    lastContactTime,
  };
}

class TrackingServiceClass {
  private listeners: Set<TrackingListener> = new Set();
  private watchPositionId: number | null = null;
  private unsubscribeFirestore: Unsubscribe | null = null;

  constructor() {
    this.initFirestoreListener();
  }

  private initFirestoreListener() {
    try {
      const colRef = collection(db, 'tech_locations');
      this.unsubscribeFirestore = onSnapshot(
        colRef,
        (snapshot) => {
          const current = this.getLocations();
          let hasChanges = false;

          snapshot.docs.forEach((docSnap) => {
            const data = docSnap.data() as TechnicianLiveLocation;
            if (data && data.technicianId) {
              current[data.technicianId] = {
                ...(current[data.technicianId] || {}),
                ...data,
              };
              hasChanges = true;
            }
          });

          if (hasChanges) {
            try {
              localStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(current));
            } catch {
              // ignore
            }
            this.notifyListeners(current);
          }
        },
        (err) => {
          console.warn('[TrackingService] Live Firestore subscription note:', err.message);
        }
      );
    } catch (e) {
      console.warn('[TrackingService] Could not initialize Firestore listener:', e);
    }
  }

  public getLocations(): Record<string, TechnicianLiveLocation> {
    try {
      const data = localStorage.getItem(TRACKING_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // fallback
    }
    return { ...INITIAL_TRACKING_DATA };
  }

  public getLocation(techId: string): TechnicianLiveLocation | undefined {
    const all = this.getLocations();
    return all[techId];
  }

  public saveLocations(data: Record<string, TechnicianLiveLocation>) {
    try {
      localStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(data));
      this.notifyListeners(data);
    } catch {
      // ignore
    }
  }

  public updateTechLocation(
    techId: string,
    updates: Partial<TechnicianLiveLocation>
  ): TechnicianLiveLocation {
    const all = this.getLocations();
    const current = all[techId] || {
      technicianId: techId,
      technicianName: 'Technician',
      phone: '',
      city: 'Bhakkar',
      lat: 31.6253,
      lng: 71.0657,
      speedKmh: 0,
      heading: 0,
      status: 'idle',
      vehicle: 'bike',
      distanceRemainingKm: 0,
      etaMinutes: 0,
      lastPing: new Date().toISOString(),
      isLiveBeaconActive: true,
      routeHistory: [],
    };

    const updated: TechnicianLiveLocation = {
      ...current,
      ...updates,
      technicianId: techId,
      lastPing: new Date().toISOString(),
    };

    all[techId] = updated;
    this.saveLocations(all);

    // Sync to Cloud Firestore in real-time
    try {
      const docRef = doc(db, 'tech_locations', techId);
      setDoc(docRef, updated, { merge: true }).catch((err) => {
        console.warn('[TrackingService] Firestore sync warning:', err);
      });
    } catch (err) {
      console.warn('[TrackingService] Firestore update error:', err);
    }

    return updated;
  }

  public toggleBeacon(techId: string, _active?: boolean): boolean {
    const all = this.getLocations();
    const tech = all[techId];
    if (!tech) return false;

    tech.isLiveBeaconActive = true;
    tech.is24hTrackingEnforced = true;
    tech.isLocationLockActive = true;
    tech.lastHeartbeat = new Date().toISOString();
    tech.lastPing = new Date().toISOString();

    if (tech.status === 'offline') {
      tech.status = tech.distanceRemainingKm && tech.distanceRemainingKm > 0.1 ? 'moving' : 'at_customer';
    }

    this.updateTechLocation(techId, tech);
    return true;
  }

  public subscribe(listener: TrackingListener): () => void {
    this.listeners.add(listener);
    // immediately call with current real data
    listener(this.getLocations());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(data: Record<string, TechnicianLiveLocation>) {
    this.listeners.forEach((fn) => {
      try {
        fn(data);
      } catch (e) {
        console.error('Error in tracking listener', e);
      }
    });
  }

  // Real Geolocation watch on physical technician device
  public startDeviceGeolocation(
    techId: string,
    onSuccess?: (coords: { lat: number; lng: number }) => void,
    onError?: (err: GeolocationPositionError) => void
  ) {
    if (!navigator.geolocation) return;

    if (this.watchPositionId !== null) {
      navigator.geolocation.clearWatch(this.watchPositionId);
    }

    this.watchPositionId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed, heading } = position.coords;
        const currentSpeedKmh = speed ? Math.round(speed * 3.6) : 0;
        this.updateTechLocation(techId, {
          lat: latitude,
          lng: longitude,
          speedKmh: currentSpeedKmh,
          heading: heading || 0,
          status: currentSpeedKmh > 3 ? 'moving' : 'at_customer',
          isLiveBeaconActive: true,
        });
        if (onSuccess) {
          onSuccess({ lat: latitude, lng: longitude });
        }
      },
      (error) => {
        console.warn('Geolocation watch error:', error.message);
        if (onError) onError(error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );
  }

  public stopDeviceGeolocation() {
    if (this.watchPositionId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchPositionId);
      this.watchPositionId = null;
    }
  }

  // Reset: clear storage so only real live data is collected
  public resetToDefault() {
    this.saveLocations({});
  }
}

export const TrackingService = new TrackingServiceClass();
