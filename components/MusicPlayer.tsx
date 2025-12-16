import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

const MusicPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const timerIDRef = useRef<number | null>(null);
  const melodyIndexRef = useRef<number>(0);

  // Retro 8-bit arpeggio sequence (Cm7 / Fm7 / G7 loop)
  const NOTES = [
    // Cm7
    261.63, 311.13, 392.00, 466.16, // C4, Eb4, G4, Bb4
    261.63, 311.13, 392.00, 466.16,
    // Fm7
    349.23, 415.30, 523.25, 622.25, // F4, Ab4, C5, Eb5
    349.23, 415.30, 523.25, 622.25,
    // G7
    392.00, 493.88, 587.33, 698.46, // G4, B4, D5, F5
    392.00, 493.88, 587.33, 698.46,
    // C resolution
    523.25, 392.00, 311.13, 261.63, // C5, G4, Eb4, C4
    261.63, 196.00, 155.56, 130.81  // C4, G3, Eb3, C3
  ];

  const NOTE_LENGTH = 0.12; // Fast 16th notes

  const scheduleNote = (freq: number, time: number) => {
    if (!audioContextRef.current) return;
    const osc = audioContextRef.current.createOscillator();
    const gain = audioContextRef.current.createGain();

    // Square wave is iconic for 8-bit consoles
    osc.type = 'square';
    osc.frequency.value = freq;

    osc.connect(gain);
    gain.connect(audioContextRef.current.destination);

    // Short pluck envelope
    gain.gain.setValueAtTime(0.03, time); // Low volume to keep it as background
    gain.gain.exponentialRampToValueAtTime(0.001, time + NOTE_LENGTH - 0.02);

    osc.start(time);
    osc.stop(time + NOTE_LENGTH);
  };

  const scheduler = () => {
     if (!audioContextRef.current) return;

     // Lookahead 0.1s
     while (nextNoteTimeRef.current < audioContextRef.current.currentTime + 0.1) {
         const note = NOTES[melodyIndexRef.current % NOTES.length];
         
         // Melody
         scheduleNote(note, nextNoteTimeRef.current);
         
         // Bass line (every 4 notes, octave down)
         if (melodyIndexRef.current % 4 === 0) {
            scheduleNote(note / 2, nextNoteTimeRef.current);
         }

         nextNoteTimeRef.current += NOTE_LENGTH;
         melodyIndexRef.current++;
     }
     timerIDRef.current = window.setTimeout(scheduler, 25);
  };

  const toggleMusic = () => {
      if (isPlaying) {
          setIsPlaying(false);
          if (audioContextRef.current) {
              audioContextRef.current.close();
              audioContextRef.current = null;
          }
          if (timerIDRef.current) {
              clearTimeout(timerIDRef.current);
              timerIDRef.current = null;
          }
      } else {
          setIsPlaying(true);
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          audioContextRef.current = new AudioContext();
          nextNoteTimeRef.current = audioContextRef.current.currentTime + 0.1;
          melodyIndexRef.current = 0;
          scheduler();
      }
  };

  useEffect(() => {
      return () => {
          if (timerIDRef.current) clearTimeout(timerIDRef.current);
          if (audioContextRef.current) audioContextRef.current.close();
      };
  }, []);

  return (
    <button 
      onClick={toggleMusic}
      className={`
        absolute top-4 right-16 z-30 
        bg-black border-2 p-2 
        shadow-[4px_4px_0px_0px_#000] 
        hover:bg-green-900 active:translate-y-1 active:shadow-none 
        transition-all flex items-center justify-center gap-2
        ${isPlaying ? 'text-green-400 border-green-400' : 'text-green-700 border-green-700'}
      `}
      title={isPlaying ? "Mute Audio" : "Enable 8-bit Audio"}
    >
      {isPlaying ? <Volume2 className="w-6 h-6 animate-pulse" /> : <VolumeX className="w-6 h-6" />}
      <span className="font-pixel text-[8px] hidden md:inline">AUDIO</span>
    </button>
  );
};

export default MusicPlayer;