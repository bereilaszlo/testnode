import React, { useState } from 'react';
import Globe from './components/Globe';
import Sidebar from './components/Sidebar';
import MusicPlayer from './components/MusicPlayer';
import { GameLocation, LoadingState } from './types';
import { fetchGameLocation, fetchStudiosInCity, fetchStudioLocation, fetchStudiosInCountry } from './services/gemini';

// Pre-load a few famous games so the map isn't empty on first load
const INITIAL_GAMES: Partial<GameLocation>[] = [
  {
    id: 'init_1',
    gameName: "The Witcher 3: Wild Hunt",
    studioName: "CD Projekt Red",
    city: "Warsaw",
    country: "Poland",
    coordinates: { lat: 52.2297, lng: 21.0122 },
    description: "Developed by CD Projekt Red in Warsaw, helping put the Polish game industry on the map.",
    year: 2015
  },
  {
    id: 'init_2',
    gameName: "Super Mario Bros.",
    studioName: "Nintendo EAD",
    city: "Kyoto",
    country: "Japan",
    coordinates: { lat: 35.0116, lng: 135.7681 },
    description: "Created by Shigeru Miyamoto and his team at Nintendo's headquarters in Kyoto.",
    year: 1985
  },
  {
    id: 'init_3',
    gameName: "Grand Theft Auto V",
    studioName: "Rockstar North",
    city: "Edinburgh",
    country: "Scotland",
    coordinates: { lat: 55.9533, lng: -3.1883 },
    description: "Primarily developed by Rockstar North in the historic city of Edinburgh.",
    year: 2013
  }
];

const App: React.FC = () => {
  const [locations, setLocations] = useState<GameLocation[]>(INITIAL_GAMES as GameLocation[]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [viewCenter, setViewCenter] = useState<{lat: number, lng: number} | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (query: string) => {
    const exists = locations.find(l => l.gameName.toLowerCase() === query.toLowerCase());
    if (exists) {
      setSelectedLocationId(exists.id);
      setViewCenter(null);
      return;
    }

    setLoadingState(LoadingState.LOADING);
    setError(null);

    try {
      const newLocation = await fetchGameLocation(query);
      setLocations(prev => [newLocation, ...prev]);
      setSelectedLocationId(newLocation.id);
      setViewCenter(null);
      setLoadingState(LoadingState.SUCCESS);
    } catch (err) {
      console.error(err);
      setError("LOC_NOT_FOUND: CHECK SPELLING");
      setLoadingState(LoadingState.ERROR);
    } finally {
      setTimeout(() => {
          // Reset to IDLE if not in ERROR state (to keep error msg visible if needed)
          setLoadingState(prev => prev === LoadingState.ERROR ? prev : LoadingState.IDLE);
      }, 2000);
    }
  };

  const handleStudioSearch = async (studio: string) => {
    // Check if we already have this studio roughly
    const exists = locations.find(l => l.studioName.toLowerCase().includes(studio.toLowerCase()));
    if (exists) {
      setSelectedLocationId(exists.id);
      setViewCenter(null);
      return;
    }

    setLoadingState(LoadingState.LOADING);
    setError(null);

    try {
      const newLocation = await fetchStudioLocation(studio);
      setLocations(prev => [newLocation, ...prev]);
      setSelectedLocationId(newLocation.id);
      setViewCenter(null);
      setLoadingState(LoadingState.SUCCESS);
    } catch (err) {
      console.error(err);
      setError("STUDIO_NOT_FOUND");
      setLoadingState(LoadingState.ERROR);
    } finally {
      setTimeout(() => {
          setLoadingState(prev => prev === LoadingState.ERROR ? prev : LoadingState.IDLE);
      }, 2000);
    }
  };

  const handleCitySearch = async (city: string) => {
    setLoadingState(LoadingState.LOADING);
    setError(null);

    try {
      const newLocations = await fetchStudiosInCity(city);
      
      if (newLocations.length === 0) {
        throw new Error("No studios found");
      }

      setLocations(prev => {
        // Prevent exact duplicates (simple check by game+studio name)
        const existingKeys = new Set(prev.map(l => `${l.gameName}-${l.studioName}`));
        const filteredNew = newLocations.filter(l => !existingKeys.has(`${l.gameName}-${l.studioName}`));
        return [...filteredNew, ...prev];
      });

      // Show list of games, but rotate globe to the city location
      if (newLocations.length > 0) {
        setViewCenter(newLocations[0].coordinates);
        setSelectedLocationId(null); // Ensure no single item is selected so list is visible
      }
      
      setLoadingState(LoadingState.SUCCESS);
    } catch (err) {
      console.error(err);
      setError("NO DATA FOUND FOR CITY");
      setLoadingState(LoadingState.ERROR);
    } finally {
      setTimeout(() => {
          setLoadingState(prev => prev === LoadingState.ERROR ? prev : LoadingState.IDLE);
      }, 2000);
    }
  };

  const handleCountrySearch = async (country: string) => {
    setLoadingState(LoadingState.LOADING);
    setError(null);

    try {
      const newLocations = await fetchStudiosInCountry(country);
      
      if (newLocations.length === 0) {
        throw new Error("No studios found in country");
      }

      setLocations(prev => {
        const existingKeys = new Set(prev.map(l => `${l.gameName}-${l.studioName}`));
        const filteredNew = newLocations.filter(l => !existingKeys.has(`${l.gameName}-${l.studioName}`));
        return [...filteredNew, ...prev];
      });

      if (newLocations.length > 0) {
        setViewCenter(newLocations[0].coordinates);
        setSelectedLocationId(null);
      }
      
      setLoadingState(LoadingState.SUCCESS);
    } catch (err) {
      console.error(err);
      setError("NO DATA FOUND FOR COUNTRY");
      setLoadingState(LoadingState.ERROR);
    } finally {
      setTimeout(() => {
          setLoadingState(prev => prev === LoadingState.ERROR ? prev : LoadingState.IDLE);
      }, 2000);
    }
  };

  const handleRemoveLocation = (id: string) => {
    setLocations(prev => prev.filter(l => l.id !== id));
    if (selectedLocationId === id) setSelectedLocationId(null);
  };

  const handleLocationSelect = (id: string | null) => {
      setSelectedLocationId(id);
      if (id) setViewCenter(null);
  };

  return (
    <div className="flex h-screen w-screen bg-black overflow-hidden relative font-sans">
      
      {/* Sidebar for controls and info */}
      <Sidebar 
        locations={locations}
        selectedLocationId={selectedLocationId}
        onLocationSelect={handleLocationSelect}
        onSearch={handleSearch}
        onCitySearch={handleCitySearch}
        onStudioSearch={handleStudioSearch}
        onCountrySearch={handleCountrySearch}
        loadingState={loadingState}
        onRemoveLocation={handleRemoveLocation}
      />

      {/* Main Map Area */}
      <main className="flex-1 relative h-full w-full">
        <MusicPlayer />
        
        <Globe 
          locations={locations}
          selectedLocationId={selectedLocationId}
          onLocationSelect={handleLocationSelect}
          viewCenter={viewCenter}
        />

        {/* Floating Error Toast 8-bit style */}
        {error && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-4 border-4 border-white shadow-[8px_8px_0px_0px_#000] flex items-center gap-4 animate-bounce">
            <span className="font-pixel text-xs text-yellow-300">ERROR &gt;&gt;</span> 
            <span className="font-terminal text-xl uppercase">{error}</span>
            <button onClick={() => setError(null)} className="ml-4 bg-black/20 hover:bg-black/40 p-1 border border-white">
              <span className="font-pixel text-[10px]">X</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;