export const themePresets = [
  { id: 'compact', labelKey: 'appearance.themes.compact' },
  { id: 'default', labelKey: 'appearance.themes.default' },
] as const;

export type ThemePresetId = (typeof themePresets)[number]['id'];
export const defaultThemePreset: ThemePresetId = 'compact';
