import { RouteBreadcrumb, TechnicianLiveLocation } from '../types';

/**
 * 100% Real Tracking Store:
 * Zero demo/mock technicians. Only actual live GPS pings sent by registered
 * technicians' devices are stored and displayed.
 */
export const INITIAL_TRACKING_DATA: Record<string, TechnicianLiveLocation> = {};
