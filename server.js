import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const port = 3001;

// Enable CORS so the frontend (usually on port 3000/5173) can call this server
app.use(cors());
app.use(express.json());

// Initialize Gemini with the API Key from the server environment
// This key is now safe and never exposed to the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- SCHEMAS ---

const gameLocationSchema = {
  type: Type.OBJECT,
  properties: {
    gameName: { type: Type.STRING, description: "The official name of the video game." },
    studioName: { type: Type.STRING, description: "The name of the development studio." },
    city: { type: Type.STRING, description: "The city where the studio is located." },
    country: { type: Type.STRING, description: "The country where the studio is located." },
    latitude: { type: Type.NUMBER, description: "The latitude of the city." },
    longitude: { type: Type.NUMBER, description: "The longitude of the city." },
    description: { type: Type.STRING, description: "A one-sentence fun fact about the game's development or setting." },
    year: { type: Type.INTEGER, description: "The release year of the game." }
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
          gameName: { type: Type.STRING, description: "The most famous game from this studio." },
          studioName: { type: Type.STRING, description: "Name of the game studio." },
          latitude: { type: Type.NUMBER, description: "Latitude of the studio/city." },
          longitude: { type: Type.NUMBER, description: "Longitude of the studio/city." },
          description: { type: Type.STRING, description: "Brief description of the studio's significance in this city." },
          year: { type: Type.INTEGER, description: "Year the famous game was released." }
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
          gameName: { type: Type.STRING, description: "The most famous game from this studio." },
          studioName: { type: Type.STRING, description: "Name of the game studio." },
          city: { type: Type.STRING, description: "The city where this specific studio is located." },
          latitude: { type: Type.NUMBER, description: "Latitude of the studio/city." },
          longitude: { type: Type.NUMBER, description: "Longitude of the studio/city." },
          description: { type: Type.STRING, description: "Brief description of the studio's significance." },
          year: { type: Type.INTEGER, description: "Year the famous game was released." }
        },
        required: ["gameName", "studioName", "city", "latitude", "longitude", "description", "year"]
      }
    },
    country: { type: Type.STRING }
  },
  required: ["results", "country"]
};

// --- ROUTES ---

app.post('/api/game', async (req, res) => {
  const { query } = req.body;
  const prompt = `Identify the primary development location for the video game "${query}". 
  If the game was developed by multiple studios, choose the main headquarters or the studio responsible for the core game design.
  Provide precise latitude and longitude for the city.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: gameLocationSchema,
        systemInstruction: "You are a video game historian database. Provide accurate geographical data for game development studios."
      },
    });
    res.json(JSON.parse(response.text));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch game data" });
  }
});

app.post('/api/studio', async (req, res) => {
  const { query } = req.body;
  const prompt = `Identify the global headquarters for the video game studio "${query}". 
  If it is a defunct studio, use their last known major location.
  Provide precise latitude and longitude for the HQ.
  Also, identify their single most famous 'flagship' game title to display as the 'Game Name'.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: gameLocationSchema,
        systemInstruction: "You are a video game historian database. Provide accurate geographical data for game studios."
      },
    });
    res.json(JSON.parse(response.text));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch studio data" });
  }
});

app.post('/api/city', async (req, res) => {
  const { city } = req.body;
  const prompt = `List top 3 major video game development studios located in or near "${city}". 
  For each studio, pick their most famous game title. 
  Provide coordinates for the studio headquarters.
  Keep the list short and relevant.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: citySearchSchema,
        systemInstruction: "You are a video game historian database. Focus on finding studios in the specified city."
      },
    });
    res.json(JSON.parse(response.text));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch city data" });
  }
});

app.post('/api/country', async (req, res) => {
  const { country } = req.body;
  const prompt = `List top 5 major video game development studios located in "${country}". 
  For each studio, pick their most famous game title and the specific city they are located in.
  Provide coordinates for the studio headquarters.
  Keep the list relevant and diverse if possible.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: countrySearchSchema,
        systemInstruction: "You are a video game historian database. Focus on finding key studios in the specified country."
      },
    });
    res.json(JSON.parse(response.text));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch country data" });
  }
});

app.listen(port, () => {
  console.log(`GameAtlas API Server running on port ${port}`);
});