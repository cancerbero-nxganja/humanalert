export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'active' | 'resolved' | 'expired';
export type AlertType = 'emergency' | 'warning' | 'info' | 'missing_person' | 'animal' | 'community';

export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  description: string;
  location: GeoPoint;
  radius_km: number;
  language: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  created_by?: string;
}

export interface CreateAlertInput {
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  location: GeoPoint;
  radius_km: number;
  language: string;
  expires_at?: string;
}
