import { createContext, useContext } from 'react';
import type { ThemePresetId } from './theme-presets';

export const PresetContext = createContext<{
  preset: ThemePresetId;
  setPreset: (value: ThemePresetId) => void;
} | null>(null);
export function useThemePreset() {
  const value = useContext(PresetContext);
  if (!value) throw new Error('ThemeSettings requires AppThemeProvider');
  return value;
}
