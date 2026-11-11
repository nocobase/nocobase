import { PresetContext } from './theme-context';
import { resolveAppBase } from '@nocobase/app-client';
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes';
import { useEffect, useState, type ReactElement } from 'react';
import {
  readThemeDefaults,
  readThemePreference,
  themeStorageKeys,
} from './theme-preferences';
import { themePresets, type ThemePresetId } from './theme-presets';

const validPreset = (
  value: string | null,
  fallback: ThemePresetId,
): ThemePresetId =>
  themePresets.find((item) => item.id === value)?.id ?? fallback;

function ModeStorageSync({
  storageKey,
  defaultTheme,
}: {
  storageKey: string;
  defaultTheme: string;
}): null {
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (
        event.key === null ||
        (event.key === storageKey &&
          event.newValue !== defaultTheme &&
          !['light', 'dark', 'system'].includes(event.newValue ?? ''))
      ) {
        // Consume invalid mode events before next-themes can persist its fallback.
        // Re-dispatch a valid value for its state-only synchronization path.
        // Let clear events through so the preset listener also resets.
        if (event.key === storageKey) event.stopImmediatePropagation();
        queueMicrotask(() => {
          window.dispatchEvent(
            new StorageEvent('storage', {
              key: storageKey,
              newValue: defaultTheme,
            }),
          );
        });
      }
    };
    window.addEventListener('storage', sync, true);
    return () => window.removeEventListener('storage', sync, true);
  }, [defaultTheme, storageKey]);
  return null;
}

export function AppThemeProvider({
  children,
  attribute = 'class',
  defaultTheme,
  enableSystem = true,
  storageKey = themeStorageKeys(resolveAppBase()).mode,
  ...props
}: ThemeProviderProps): ReactElement {
  const [defaults] = useState(() =>
    readThemeDefaults(themePresets.map(({ id }) => id)),
  );
  const mode = defaultTheme ?? defaults.mode;
  const fallbackPreset = defaults.preset as ThemePresetId;
  const presetKey = themeStorageKeys(resolveAppBase()).preset;
  const [preset, setPreset] = useState(() =>
    validPreset(readThemePreference(presetKey), fallbackPreset),
  );
  const selectPreset = (value: ThemePresetId) => {
    setPreset(value);
    try {
      localStorage.setItem(presetKey, value);
    } catch {
      /* Keep the in-memory selection. */
    }
  };
  useEffect(() => {
    document.documentElement.dataset.theme = preset;
  }, [preset]);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === presetKey || event.key === null)
        setPreset(validPreset(event.newValue, fallbackPreset));
    };
    window.addEventListener('storage', sync, true);
    return () => window.removeEventListener('storage', sync, true);
  }, [presetKey, fallbackPreset]);
  return (
    <NextThemesProvider
      {...props}
      attribute={attribute}
      defaultTheme={mode}
      enableSystem={enableSystem}
      storageKey={storageKey}
    >
      <ModeStorageSync storageKey={storageKey} defaultTheme={mode} />
      <PresetContext.Provider value={{ preset, setPreset: selectPreset }}>
        {children}
      </PresetContext.Provider>
    </NextThemesProvider>
  );
}
