import { GameLocation } from "../types";

// Helper to generate a unique ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// Points to our local backend server
const API_BASE_URL = 'http://localhost:3001/api';

export const fetchGameLocation = async (query: string): Promise<GameLocation> => {
  try {
    const response = await fetch(`${API_BASE_URL}/game`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    if (!response.ok) throw new Error('Server returned an error');
    
    const data = await response.json();

    return {
      id: generateId(),
      gameName: data.gameName,
      studioName: data.studioName,
      city: data.city,
      country: data.country,
      coordinates: {
        lat: data.latitude,
        lng: data.longitude
      },
      description: data.description,
      year: data.year,
      imageUrl: `https://picsum.photos/seed/${encodeURIComponent(data.gameName)}/400/200`
    };

  } catch (error) {
    console.error("Error fetching game location:", error);
    throw error;
  }
};

export const fetchStudioLocation = async (query: string): Promise<GameLocation> => {
  try {
    const response = await fetch(`${API_BASE_URL}/studio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    if (!response.ok) throw new Error('Server returned an error');

    const data = await response.json();

    return {
      id: generateId(),
      gameName: data.gameName,
      studioName: data.studioName,
      city: data.city,
      country: data.country,
      coordinates: {
        lat: data.latitude,
        lng: data.longitude
      },
      description: data.description,
      year: data.year,
      imageUrl: `https://picsum.photos/seed/${encodeURIComponent(data.gameName)}/400/200`
    };

  } catch (error) {
    console.error("Error fetching studio location:", error);
    throw error;
  }
};

export const fetchStudiosInCity = async (cityQuery: string): Promise<GameLocation[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/city`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city: cityQuery })
    });

    if (!response.ok) throw new Error('Server returned an error');

    const data = await response.json();

    if (!data.results || !Array.isArray(data.results)) {
        return [];
    }

    return data.results.map((item: any) => ({
      id: generateId(),
      gameName: item.gameName,
      studioName: item.studioName,
      city: data.city,
      country: data.country,
      coordinates: {
        lat: item.latitude,
        lng: item.longitude
      },
      description: item.description,
      year: item.year,
      imageUrl: `https://picsum.photos/seed/${encodeURIComponent(item.gameName)}/400/200`
    }));

  } catch (error) {
    console.error("Error fetching city studios:", error);
    throw error;
  }
};

export const fetchStudiosInCountry = async (countryQuery: string): Promise<GameLocation[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/country`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: countryQuery })
    });

    if (!response.ok) throw new Error('Server returned an error');

    const data = await response.json();

    if (!data.results || !Array.isArray(data.results)) {
        return [];
    }

    return data.results.map((item: any) => ({
      id: generateId(),
      gameName: item.gameName,
      studioName: item.studioName,
      city: item.city,
      country: data.country,
      coordinates: {
        lat: item.latitude,
        lng: item.longitude
      },
      description: item.description,
      year: item.year,
      imageUrl: `https://picsum.photos/seed/${encodeURIComponent(item.gameName)}/400/200`
    }));

  } catch (error) {
    console.error("Error fetching country studios:", error);
    throw error;
  }
};

export const suggestRandomGames = async (): Promise<string[]> => {
    return ["The Witcher 3", "Super Mario Bros", "Grand Theft Auto V", "Minecraft", "Dark Souls"];
};