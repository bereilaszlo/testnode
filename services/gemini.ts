import { GameLocation } from "../types";
import { GoogleGenAI, Type } from "@google/genai";

// Helper to generate a unique ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// Points to our local backend server
const API_BASE_URL = 'http://localhost:3000/api';

// --- FALLBACK CONFIGURATION ---
// If the backend is unreachable, we fallback to client-side calls.
// WARNING: This exposes the API key in the browser network tab.
// This is for development/demo convenience.
const fallbackClient = new GoogleGenAI({ apiKey: process.env.API_KEY });

const gameLocationSchema = {
  type: Type.OBJECT,
  properties: {
    gameName: { type: Type.STRING },
    studioName: { type: Type.STRING },
    city: { type: Type.STRING },
    country: { type: Type.STRING },
    latitude: { type: Type.NUMBER },
    longitude: { type: Type.NUMBER },
    description: { type: Type.STRING },
    year: { type: Type.INTEGER }
  },
  required: ["gameName", "studioName", "city", "country", "latitude", "longitude", "description", "year"],
};

const citySearchSchema = {
  type: Type.OBJECT,
  properties: {
    results: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          gameName: { type: Type.STRING },
          studioName: { type: Type.STRING },
          latitude: { type: Type.NUMBER },
          longitude: { type: Type.NUMBER },
          description: { type: Type.STRING },
          year: { type: Type.INTEGER }
        },
        required: ["gameName", "studioName", "latitude", "longitude", "description", "year"]
      }
    },
    city: { type: Type.STRING },
    country: { type: Type.STRING }
  },
  required: ["results", "city", "country"]
};

const countrySearchSchema = {
  type: Type.OBJECT,
  properties: {
    results: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          gameName: { type: Type.STRING },
          studioName: { type: Type.STRING },
          city: { type: Type.STRING },
          latitude: { type: Type.NUMBER },
          longitude: { type: Type.NUMBER },
          description: { type: Type.STRING },
          year: { type: Type.INTEGER }
        },
        required: ["gameName", "studioName", "city", "latitude", "longitude", "description", "year"]
      }
    },
    country: { type: Type.STRING }
  },
  required: ["results", "country"]
};

// --- SERVICES ---

const mapDataToLocation = (data: any): GameLocation => ({
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
});

export const fetchGameLocation = async (query: string): Promise<GameLocation> => {
  try {
    // Try Backend First
    const response = await fetch(`${API_BASE_URL}/game`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    if (!response.ok) throw new Error('Server returned an error');
    const data = await response.json();
    return mapDataToLocation(data);
  } catch (error) {
    console.warn("Backend unavailable, falling back to client-side Gemini:", error);
    
    // Fallback
    const prompt = `Identify the primary development location for the video game "${query}". 
    If the game was developed by multiple studios, choose the main headquarters or the studio responsible for the core game design.
    Provide precise latitude and longitude for the city.`;

    const response = await fallbackClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: gameLocationSchema,
        },
    });
    const data = JSON.parse(response.text);
    return mapDataToLocation(data);
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
    return mapDataToLocation(data);
  } catch (error) {
    console.warn("Backend unavailable, falling back to client-side Gemini:", error);

    const prompt = `Identify the global headquarters for the video game studio "${query}". 
    If it is a defunct studio, use their last known major location.
    Provide precise latitude and longitude for the HQ.
    Also, identify their single most famous 'flagship' game title to display as the 'Game Name'.`;

    const response = await fallbackClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: gameLocationSchema,
        },
    });
    const data = JSON.parse(response.text);
    return mapDataToLocation(data);
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
    return (data.results || []).map((item: any) => mapDataToLocation({ ...item, city: data.city, country: data.country }));
  } catch (error) {
    console.warn("Backend unavailable, falling back to client-side Gemini:", error);

    const prompt = `List top 3 major video game development studios located in or near "${cityQuery}". 
    For each studio, pick their most famous game title. 
    Provide coordinates for the studio headquarters.
    Keep the list short and relevant.`;

    const response = await fallbackClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: citySearchSchema,
        },
    });
    const data = JSON.parse(response.text);
    return (data.results || []).map((item: any) => mapDataToLocation({ ...item, city: data.city, country: data.country }));
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
    return (data.results || []).map((item: any) => mapDataToLocation({ ...item, country: data.country }));
  } catch (error) {
    console.warn("Backend unavailable, falling back to client-side Gemini:", error);
    
    const prompt = `List top 5 major video game development studios located in "${countryQuery}". 
    For each studio, pick their most famous game title and the specific city they are located in.
    Provide coordinates for the studio headquarters.
    Keep the list relevant and diverse if possible.`;

    const response = await fallbackClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: countrySearchSchema,
        },
    });
    const data = JSON.parse(response.text);
    return (data.results || []).map((item: any) => mapDataToLocation({ ...item, country: data.country }));
  }
};

export const suggestRandomGames = async (): Promise<string[]> => {
    return ["The Witcher 3", "Super Mario Bros", "Grand Theft Auto V", "Minecraft", "Dark Souls"];
};
