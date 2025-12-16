import React, { useState } from 'react';
import { GameLocation, LoadingState } from '../types';
import { Search, MapPin, Info, Gamepad2, Loader2, X, Building2, Map, Globe } from 'lucide-react';

interface SidebarProps {
  locations: GameLocation[];
  selectedLocationId: string | null;
  onLocationSelect: (id: string | null) => void;
  onSearch: (query: string) => void;
  onCitySearch: (city: string) => void;
  onStudioSearch: (studio: string) => void;
  onCountrySearch: (country: string) => void;
  loadingState: LoadingState;
  onRemoveLocation: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  locations, 
  selectedLocationId, 
  onLocationSelect, 
  onSearch, 
  onCitySearch,
  onStudioSearch,
  onCountrySearch,
  loadingState,
  onRemoveLocation
}) => {
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'GAME' | 'STUDIO' | 'CITY' | 'COUNTRY'>('GAME');
  
  const selectedLocation = locations.find(l => l.id === selectedLocationId);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      if (searchMode === 'GAME') {
        onSearch(query);
      } else if (searchMode === 'STUDIO') {
        onStudioSearch(query);
      } else if (searchMode === 'CITY') {
        onCitySearch(query);
      } else {
        onCountrySearch(query);
      }
      setQuery('');
    }
  };

  const getPlaceholder = () => {
    switch (searchMode) {
      case 'GAME': return "ENTER GAME TITLE...";
      case 'STUDIO': return "ENTER STUDIO NAME...";
      case 'CITY': return "ENTER CITY NAME...";
      case 'COUNTRY': return "ENTER COUNTRY...";
    }
  };

  return (
    <div className="w-full md:w-[450px] bg-black h-full border-r-4 border-green-700 flex flex-col z-20 absolute left-0 top-0 shadow-[10px_0px_0px_0px_rgba(0,0,0,0.5)]">
      
      {/* Header */}
      <div className="p-6 border-b-4 border-green-700 bg-green-900/20">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-2 bg-green-600 border-2 border-green-400 shadow-[4px_4px_0px_0px_#000]">
            <Gamepad2 className="w-8 h-8 text-black" />
          </div>
          <div>
            <h1 className="text-xl font-pixel text-green-400 tracking-widest leading-loose">GAME<br/>ATLAS</h1>
            <p className="text-[8px] font-pixel text-green-500 mt-1 tracking-wider">MADE BY B.LASZLO</p>
          </div>
        </div>
        <p className="text-green-600/80 font-terminal text-xl uppercase tracking-widest">&gt; SYSTEM READY...</p>
      </div>

      {/* Search Mode Toggle */}
      <div className="flex border-b-4 border-green-700 bg-black">
        <button 
          className={`flex-1 py-3 font-pixel text-[8px] md:text-[10px] flex flex-col items-center justify-center gap-2 transition-colors ${
            searchMode === 'GAME' 
            ? 'bg-green-700 text-black' 
            : 'text-green-600 hover:bg-green-900'
          }`}
          onClick={() => setSearchMode('GAME')}
          title="Search by Game Title"
        >
          <Gamepad2 className="w-4 h-4" /> GAME
        </button>
        <button 
          className={`flex-1 py-3 font-pixel text-[8px] md:text-[10px] flex flex-col items-center justify-center gap-2 transition-colors ${
            searchMode === 'STUDIO' 
            ? 'bg-green-700 text-black' 
            : 'text-green-600 hover:bg-green-900'
          }`}
          onClick={() => setSearchMode('STUDIO')}
          title="Search by Studio Name"
        >
          <Building2 className="w-4 h-4" /> STUDIO
        </button>
        <button 
          className={`flex-1 py-3 font-pixel text-[8px] md:text-[10px] flex flex-col items-center justify-center gap-2 transition-colors ${
            searchMode === 'CITY' 
            ? 'bg-green-700 text-black' 
            : 'text-green-600 hover:bg-green-900'
          }`}
          onClick={() => setSearchMode('CITY')}
          title="Search by City"
        >
          <Map className="w-4 h-4" /> CITY
        </button>
        <button 
          className={`flex-1 py-3 font-pixel text-[8px] md:text-[10px] flex flex-col items-center justify-center gap-2 transition-colors ${
            searchMode === 'COUNTRY' 
            ? 'bg-green-700 text-black' 
            : 'text-green-600 hover:bg-green-900'
          }`}
          onClick={() => setSearchMode('COUNTRY')}
          title="Search by Country"
        >
          <Globe className="w-4 h-4" /> COUNTRY
        </button>
      </div>

      {/* Search Input */}
      <div className="p-4 bg-black">
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={getPlaceholder()}
            className="w-full bg-black text-green-400 pl-4 pr-12 py-4 border-4 border-green-600 focus:border-green-400 focus:outline-none placeholder:text-green-900 font-terminal text-2xl uppercase shadow-[4px_4px_0px_0px_#14532d]"
            disabled={loadingState === LoadingState.LOADING}
            autoComplete="off"
          />
          <button type="submit" className="absolute right-4 top-4 text-green-600">
            {loadingState === LoadingState.LOADING ? (
                <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
                <span className="font-pixel text-xs animate-pulse">▐</span>
            )}
          </button>
        </form>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-retro">
        
        {/* Selected Game Detail View */}
        {selectedLocation ? (
          <div className="bg-black border-4 border-white p-1 relative shadow-[8px_8px_0px_0px_#333]">
            <div className="bg-blue-900/50 border-2 border-blue-500 p-4 relative overflow-hidden">
               {/* Scanline overlay for image feel */}
               <div className="absolute inset-0 panel-scanlines pointer-events-none z-10"></div>
               
               <button 
                onClick={() => onLocationSelect(null)}
                className="absolute top-2 right-2 p-1 bg-red-600 text-white border-2 border-white hover:bg-red-500 z-20"
               >
                 <X className="w-4 h-4" />
               </button>

               <h2 className="text-lg font-pixel text-yellow-400 mb-4 pr-8 leading-relaxed shadow-black drop-shadow-md">
                 {selectedLocation.gameName}
               </h2>
               
               <div className="space-y-4 font-terminal text-xl text-blue-100">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 mt-1 text-blue-400" />
                    <div>
                      <span className="text-blue-400 block text-sm">LOCATION:</span>
                      <span className="uppercase">{selectedLocation.city}, {selectedLocation.country}</span>
                      <div className="text-sm text-blue-500 font-mono mt-1">
                        COORD: {selectedLocation.coordinates.lat.toFixed(2)}, {selectedLocation.coordinates.lng.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 mt-1 text-blue-400" />
                    <div>
                       <span className="text-blue-400 block text-sm">DEV STUDIO:</span>
                       <span className="uppercase">{selectedLocation.studioName}</span>
                       {selectedLocation.year && <span className="ml-2 bg-blue-800 text-white px-2 text-sm border border-blue-400">{selectedLocation.year}</span>}
                    </div>
                  </div>
               </div>
            </div>

            <div className="p-4 bg-gray-900 border-t-4 border-white font-terminal text-lg text-green-400 leading-tight">
                &gt; DATA: {selectedLocation.description}
            </div>

            <button 
              onClick={() => onRemoveLocation(selectedLocation.id)}
              className="w-full py-3 mt-4 bg-red-700 text-white font-pixel text-[10px] border-2 border-red-500 hover:bg-red-600 shadow-[4px_4px_0px_0px_#500]"
            >
              DELETE ENTRY
            </button>
          </div>
        ) : (
          /* List of games */
          <div className="space-y-4">
             <div className="flex items-center justify-between border-b-2 border-green-900 pb-2">
                <h3 className="font-pixel text-xs text-green-500">DATABASE_ENTRIES</h3>
                <span className="font-terminal text-xl bg-green-900 text-green-100 px-2 border border-green-700">{locations.length}</span>
             </div>
             
             {locations.length === 0 ? (
               <div className="text-center py-10 text-green-800 font-terminal text-2xl">
                 <p className="animate-pulse">&gt; NO DATA FOUND &lt;</p>
                 <p className="text-lg mt-2">INSERT COIN TO START...</p>
               </div>
             ) : (
               locations.map(loc => (
                 <div 
                   key={loc.id}
                   onClick={() => onLocationSelect(loc.id)}
                   className={`p-3 border-4 cursor-pointer transition-all hover:translate-x-1 group relative
                     ${selectedLocationId === loc.id 
                       ? 'bg-blue-900 border-yellow-400 shadow-[4px_4px_0px_0px_rgba(250,204,21,0.5)]' 
                       : 'bg-gray-900 border-gray-700 hover:border-green-500 hover:bg-gray-800'
                     }`}
                 >
                   <div className="flex justify-between items-start">
                     <div>
                       <p className={`font-pixel text-[10px] leading-relaxed mb-1 ${selectedLocationId === loc.id ? 'text-yellow-300' : 'text-green-400'}`}>
                         {loc.gameName}
                       </p>
                       <p className="font-terminal text-sm text-blue-300 mb-1">
                          [{loc.studioName}]
                       </p>
                       <p className="font-terminal text-lg text-gray-500 uppercase">&gt; {loc.city}</p>
                     </div>
                     {selectedLocationId === loc.id && <span className="font-pixel text-yellow-400 text-xs animate-pulse">&lt;</span>}
                   </div>
                 </div>
               ))
             )}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t-4 border-green-700 bg-black">
        <p className="text-[10px] font-pixel text-green-700 text-center uppercase leading-loose">
          POWERED BY GEMINI 2.5<br/>
          (C) 2025 GOOGLE
        </p>
      </div>
    </div>
  );
};

export default Sidebar;