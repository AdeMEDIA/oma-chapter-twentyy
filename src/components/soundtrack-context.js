import { createContext, useContext } from 'react';

export const SoundtrackContext = createContext(null);
export function useSoundtrack() { return useContext(SoundtrackContext); }
