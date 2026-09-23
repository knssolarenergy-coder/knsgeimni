import { RouteBreadcrumb, TechnicianLiveLocation, TechTrackingStatus } from '../types';
import { INITIAL_TRACKING_DATA } from '../data/trackingData';

const TRACKING_STORAGE_KEY = 'ks_solar_tech_tracking_v1';
const SIMULATION_ACTIVE_KEY = 'ks_solar_tech_sim_active_v1';

type TrackingListener = (locations: Record<string, TechnicianLiveLocation>) => void;

class TrackingServiceClass {
  private listeners: Set<TrackingListener> = new Set();
  private simulationInterval: number | null = null;
  private watchPositionId: number | null = null;

  constructor() {
    // Start simulation by default so admin preview is active immediately
    this.startBackgroundSimulation();
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
    this.saveLocations(INITIAL_TRACKING_DATA);
    return INITIAL_TRACKING_DATA;
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
  ): TechnicianLiveLocation | null {
    const all = this.getLocations();
    const current = all[techId];
    if (!current) return null;

    const updated: TechnicianLiveLocation = {
      ...current,
      ...updates,
      lastPing: new Date().toISOString(),
    };

    all[techId] = updated;
    this.saveLocations(all);
    return updated;
  }

  public toggleBeacon(techId: string, _active?: boolean): boolean {
    const all = this.getLocations();
    const tech = all[techId];
    if (!tech) return false;

    // Enforce 24/7 Live Tracking: Technicians CANNOT turn off location
    tech.isLiveBeaconActive = true;
    tech.is24hTrackingEnforced = true;
    tech.isLocationLockActive = true;
    tech.lastHeartbeat = new Date().toISOString();
    tech.lastPing = new Date().toISOString();
    
    if (tech.status === 'offline') {
      tech.status = tech.distanceRemainingKm && tech.distanceRemainingKm > 0.1 ? 'moving' : 'at_customer';
    }

    all[techId] = tech;
    this.saveLocations(all);
    return true; // always active
  }

  public subscribe(listener: TrackingListener): () => void {
    this.listeners.add(listener);
    // immediately call with current data
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

  // Real Geolocation integration for mobile tech device
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
        const currentSpeedKmh = speed ? Math.round(speed * 3.6) : 25;
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
        maximumAge: 10000,
        timeout: 20000,
      }
    );
  }

  public stopDeviceGeolocation() {
    if (this.watchPositionId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchPositionId);
      this.watchPositionId = null;
    }
  }

  // Realistic movement simulation for testing and admin dispatch view
  public startBackgroundSimulation() {
    if (this.simulationInterval) return;

    // Run tick every 3.5 seconds
    this.simulationInterval = window.setInterval(() => {
      this.stepSimulation();
    }, 3500);
  }

  public stopBackgroundSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  public isSimulationActive(): boolean {
    return this.simulationInterval !== null;
  }

  public stepSimulation() {
    const all = this.getLocations();
    let hasChanges = false;

    // Simulate Tech 1 (Usman in Lahore) & Tech 3 (Tariq in Islamabad) & Tech 4 (Hamza in Karachi)
    Object.keys(all).forEach((techId) => {
      const tech = all[techId];
      if (!tech || !tech.isLiveBeaconActive || tech.status === 'offline') return;

      // Only move if status is moving and has a destination
      if (tech.status === 'moving' && tech.destinationLat && tech.destinationLng) {
        // Calculate vector towards destination
        const dLat = tech.destinationLat - tech.lat;
        const dLng = tech.destinationLng - tech.lng;
        const dist = Math.sqrt(dLat * dLat + dLng * dLng);

        if (dist > 0.0008) {
          // Move 2-5% towards target per tick
          const stepFactor = 0.035;
          const nextLat = tech.lat + dLat * stepFactor + (Math.random() - 0.5) * 0.0001;
          const nextLng = tech.lng + dLng * stepFactor + (Math.random() - 0.5) * 0.0001;
          const nextDistKm = Math.max(0.1, (tech.distanceRemainingKm || 2) - 0.15);
          const nextSpeed = Math.floor(28 + Math.random() * 16);
          const nextEta = Math.max(1, Math.round(nextDistKm / (nextSpeed / 60)));

          tech.lat = parseFloat(nextLat.toFixed(6));
          tech.lng = parseFloat(nextLng.toFixed(6));
          tech.speedKmh = nextSpeed;
          tech.distanceRemainingKm = parseFloat(nextDistKm.toFixed(1));
          tech.etaMinutes = nextEta;
          tech.lastPing = new Date().toISOString();
          hasChanges = true;
        } else {
          // Arrived at destination customer!
          tech.status = 'at_customer';
          tech.speedKmh = 0;
          tech.distanceRemainingKm = 0;
          tech.etaMinutes = 0;
          tech.address = `${tech.destinationAddress || 'Customer Site'} (On Site)`;
          hasChanges = true;

          // Add arrived breadcrumb if not present
          const hasArrived = tech.routeHistory.some((b) => b.type === 'destination' && b.status?.includes('Arrived'));
          if (!hasArrived) {
            tech.routeHistory.push({
              id: `bp-${tech.technicianId}-arrived`,
              lat: tech.lat,
              lng: tech.lng,
              label: `Arrived at ${tech.destinationCustomer || 'Customer'}`,
              address: tech.destinationAddress || 'Customer Site',
              time: 'Just Now',
              type: 'stop',
              status: 'Technician reached customer location. Commenced job.',
            });
          }
        }
      } else if (tech.status === 'at_customer') {
        // slight jitter / working ping
        tech.lastPing = new Date().toISOString();
      }
    });

    if (hasChanges) {
      this.saveLocations(all);
    }
  }

  // Reset simulation back to initial points
  public resetToDefault() {
    this.saveLocations(INITIAL_TRACKING_DATA);
  }
}

export const TrackingService = new TrackingServiceClass();
