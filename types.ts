export interface GameLocation {
  id: string;
  gameName: string;
  studioName: string;
  city: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  description: string;
  year?: number;
  imageUrl?: string;
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface GeoJSONFeature {
  type: string;
  properties: {
    name: string;
  };
  geometry: {
    type: string;
    coordinates: number[][][] | number[][][][];
  };
}

export interface WorldData {
  type: string;
  features: GeoJSONFeature[];
}