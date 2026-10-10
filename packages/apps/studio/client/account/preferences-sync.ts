/**
 * Keeps the person's language and theme on the server (`@nocobase/app-plugin-users` preferences), so they follow the
 * person to every browser. The language runtime and next-themes keep their own copies in `localStorage`, which stay
 * as the local cache: the first frame paints with them, and the server's values replace them once they arrive.
 *
 * - When the server has a value, it wins: the browser switches to it.
 * - When it has none, a choice this browser stored before preferences existed is written to it once.
 * - After that, every change made anywhere (the account menu, the appearance popover, the preferences page) is written.
 *
 * Called by the layout every signed-in page renders in (`layouts/app-layout.tsx`).
 */
import { resolveAppBase, readStoredLocale } from '@nocobase/app-client';
import { useAppLocale } from '@nocobase/app-plugin-i18n/client';
import {
  useUserPreferenceStore,
  type UserPreferenceStore,
} from '@nocobase/app-plugin-users/client/preferences';
import { useTheme } from 'next-themes';
import { useEffect, useRef, useSyncExternalStore } from 'react';

import { useThemePreset } from '../theme/theme-context.js';
import {
  readThemePreference,
  themeStorageKeys,
} from '../theme/theme-preferences.js';
import { themePresets, type ThemePresetId } from '../theme/theme-presets.js';

/** The preference keys Studio keeps for the person. */
export const PREFERENCE_KEYS = {
  locale: 'locale',
  themeMode: 'theme.mode',
  themePreset: 'theme.preset',
} as const;

export const THEME_MODES = ['light', 'dark', 'system'] as const;

export const isThemeMode = (value: unknown): value is string =>
  typeof value === 'string' &&
  (THEME_MODES as readonly string[]).includes(value);

export const isThemePreset = (value: unknown): value is ThemePresetId =>
  typeof value === 'string' &&
  themePresets.some((preset) => preset.id === value);

function useMirror(
  store: UserPreferenceStore | null,
  key: string,
  local: string | undefined,
  options: {
    readonly valid: (value: unknown) => value is string;
    readonly apply: (value: string) => void;
    /** Whether this browser holds a choice of its own, rather than a default. */
    readonly chosenHere: () => boolean;
  },
): void {
  const subscribe = (listener: () => void) =>
    store?.subscribe(listener) ?? (() => undefined);
  useSyncExternalStore(
    subscribe,
    () => store?.snapshot() ?? 0,
    () => 0,
  );
  const loaded = store?.loaded ?? false;
  // The person whose server value has been reconciled with this browser; another sign-in starts again.
  const reconciledRef = useRef<string | null>(null);
  // `apply`, `valid` and `chosenHere` are read when the value or the person changes, not on every render: rerunning
  // on every render would write the old value back while a server value is still being applied.
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });
  useEffect(() => {
    if (!store || !loaded || local === undefined) return;
    const { valid, apply, chosenHere } = optionsRef.current;
    const server = store.get(key);
    if (reconciledRef.current !== store.userId) {
      reconciledRef.current = store.userId;
      if (valid(server)) {
        if (server !== local) apply(server);
      } else if (chosenHere() && valid(local)) void store.set(key, local);
      return;
    }
    if (valid(local) && local !== server) void store.set(key, local);
  }, [store, loaded, local, key]);
}

export function useUserPreferencesSync(): void {
  const store = useUserPreferenceStore();
  const { locale, locales, setLocale } = useAppLocale();
  const { theme, setTheme } = useTheme();
  const { preset, setPreset } = useThemePreset();
  const keys = themeStorageKeys(resolveAppBase());

  useMirror(store, PREFERENCE_KEYS.locale, locale || undefined, {
    valid: (value): value is string =>
      typeof value === 'string' &&
      locales.some((definition) => definition.locale === value),
    apply: (value) => void setLocale(value).catch(() => undefined),
    chosenHere: () => readStoredLocale() !== undefined,
  });
  useMirror(store, PREFERENCE_KEYS.themeMode, theme, {
    valid: isThemeMode,
    apply: setTheme,
    chosenHere: () => readThemePreference(keys.mode) !== null,
  });
  useMirror(store, PREFERENCE_KEYS.themePreset, preset, {
    valid: isThemePreset,
    apply: (value) => setPreset(value as ThemePresetId),
    chosenHere: () => readThemePreference(keys.preset) !== null,
  });
}
