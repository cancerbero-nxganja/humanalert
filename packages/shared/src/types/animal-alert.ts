export type AnimalAlertStatus = 'LOST' | 'FOUND' | 'REUNITED';
export type AnimalSpecies =
  | 'dog'
  | 'cat'
  | 'bird'
  | 'rabbit'
  | 'horse'
  | 'wildlife'
  | 'other';

export interface AnimalAlert {
  id: string;
  species: AnimalSpecies;
  name?: string;
  photo_url?: string;
  last_seen_lat: number;
  last_seen_lon: number;
  contact_hash: string;
  status: AnimalAlertStatus;
  description?: string;
  language: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

export interface CreateAnimalAlertInput {
  species: AnimalSpecies;
  name?: string;
  photo_url?: string;
  last_seen_lat: number;
  last_seen_lon: number;
  contact_hash: string;
  status: AnimalAlertStatus;
  description?: string;
  language: string;
}
