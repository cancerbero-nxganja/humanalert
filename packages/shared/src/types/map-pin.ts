export type MapPinCategory =
  | 'shelter'
  | 'water'
  | 'food'
  | 'medical'
  | 'evacuation'
  | 'danger'
  | 'community'
  | 'animal_rescue'
  | 'other';

export interface MapPin {
  id: string;
  category: MapPinCategory;
  title: string;
  description?: string;
  lat: number;
  lon: number;
  verified: boolean;
  upvotes: number;
  language: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

export interface CreateMapPinInput {
  category: MapPinCategory;
  title: string;
  description?: string;
  lat: number;
  lon: number;
  language: string;
  expires_at?: string;
}
