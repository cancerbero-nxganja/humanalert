export type MissingPersonStatus = 'missing' | 'found' | 'case_closed';
export type MissingPersonGender = 'male' | 'female' | 'nonbinary' | 'unknown';

export interface MissingPerson {
  id: string;
  status: MissingPersonStatus;
  first_name: string;
  last_name_initial: string;
  age_range_min: number;
  age_range_max: number;
  gender: MissingPersonGender;
  physical_description?: string;
  last_seen_at: string;
  last_seen_location: {
    lat: number;
    lon: number;
    description?: string;
  };
  photo_hash?: string;
  contact_hash: string;
  amber_alert: boolean;
  language: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

export interface CreateMissingPersonInput {
  first_name: string;
  last_name_initial: string;
  age_range_min: number;
  age_range_max: number;
  gender: MissingPersonGender;
  physical_description?: string;
  last_seen_at: string;
  last_seen_location: {
    lat: number;
    lon: number;
    description?: string;
  };
  photo_hash?: string;
  contact_hash: string;
  amber_alert?: boolean;
  language: string;
}
