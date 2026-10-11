import { readAppClientRuntimeConfig } from '@nocobase/app-client/runtime';

// Shared preference helpers for normal client startup and the React provider.
export function themeStorageKeys(base: string): {
  mode: string;
  preset: string;
} {
  const path = base.replace(/^\/+|\/+$/g, '');
  const scope = path ? encodeURIComponent(path) : '%2F';
  return {
    mode: `nocobase:${scope}:theme:color-scheme`,
    preset: `nocobase:${scope}:theme:preset`,
  };
}

export function readThemePreference(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function initializeTheme(
  base: string,
  presets: readonly string[],
): void {
  const defaults = readThemeDefaults(presets);
  const keys = themeStorageKeys(base);
  const savedMode = readThemePreference(keys.mode);
  const mode =
    savedMode && ['light', 'dark', 'system'].includes(savedMode)
      ? savedMode
      : defaults.mode;
  const savedPreset = readThemePreference(keys.preset);
  const preset =
    savedPreset && presets.includes(savedPreset)
      ? savedPreset
      : defaults.preset;
  const resolved =
    mode === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : mode;
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(resolved);
  document.documentElement.dataset.theme = preset;
  document.documentElement.style.colorScheme = resolved;
  // next-themes reads storage itself; normalize invalid modes before it mounts.
  if (savedMode && !['light', 'dark', 'system'].includes(savedMode)) {
    try {
      localStorage.removeItem(keys.mode);
    } catch {
      /* Storage can be unavailable. */
    }
  }
}

// Read the same server-injected config at startup and Provider mount without
// coupling the shared client runtime to application-owned theme presets.
export function readThemeDefaults(presets: readonly string[]): {
  mode: string;
  preset: string;
} {
  const config = readAppClientRuntimeConfig() as { app?: unknown };
  const app = config.app;
  const values =
    typeof app === 'object' && app !== null
      ? (app as Record<string, unknown>)
      : {};
  const mode = values.defaultColorScheme;
  const preset = values.defaultTheme;
  return {
    mode:
      mode === 'light' || mode === 'dark' || mode === 'system'
        ? mode
        : 'system',
    preset:
      typeof preset === 'string' && presets.includes(preset)
        ? preset
        : presets[0],
  };
}
