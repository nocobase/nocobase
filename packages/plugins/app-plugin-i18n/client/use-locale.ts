import {
  useOptionalI18nRuntime,
  useLocale as useRuntimeLocale,
  type Locale,
  type LocaleDefinition,
} from '@nocobase/i18n/client';
import {
  AppLocalePreferenceContext,
  useApiClient,
  writeStoredLocale,
  type ApiClient,
} from '@nocobase/app-client';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';

import type { ServerLocaleResult } from '../locale-result.js';

/** Path under the application's API root, which is where the server is told which language to answer in. */
const LOCALE_PATH = 'i18n/locale';

export interface UseAppLocaleResult {
  readonly locale: Locale;
  readonly locales: readonly LocaleDefinition[];
  readonly setLocale: (locale: Locale) => Promise<ServerLocaleResult>;
  readonly switching: boolean;
  readonly error: Error | undefined;
}

/**
 * Tells the server which language to answer in.
 *
 * Uses the caller's application client so its API configuration and request hooks apply.
 */
export async function notifyServerLocale(
  api: ApiClient,
  locale: Locale,
): Promise<ServerLocaleResult> {
  const response = await api.request<{ readonly data: ServerLocaleResult }>({
    path: LOCALE_PATH,
    method: 'PUT',
    json: { locale },
  });
  return response.data;
}

/**
 * The current language and a way to change it.
 *
 * Loads and switches the interface before persisting the choice and notifying the server. A server fallback is a
 * successful result the control can explain; transport failures reject without undoing the browser's language.
 */
export function useAppLocale(): UseAppLocaleResult {
  const api = useApiClient();
  const runtime = useOptionalI18nRuntime();
  const { locale, locales, setLocale, switching, error } = useRuntimeLocale();
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<Error>();

  const preference = useContext(AppLocalePreferenceContext);
  const coordinator = getCoordinator(api);
  const attempts = useRef(0);

  const changeLocale = useCallback(
    async (next: Locale): Promise<ServerLocaleResult> => {
      setSyncing(true);
      setSyncError(undefined);
      ++coordinator.revision;
      const attempt = ++attempts.current;
      try {
        if (preference) return await preference.set(next);
        return await enqueue(coordinator, async () => {
          await setLocale(next);
          const selected = runtime?.getLocale() ?? next;
          writeStoredLocale(selected);

          return notifyServerLocale(api, selected);
        });
      } catch (cause) {
        if (attempt === attempts.current)
          setSyncError(
            cause instanceof Error ? cause : new Error(String(cause)),
          );
        throw cause;
      } finally {
        if (attempt === attempts.current) setSyncing(false);
      }
    },
    [api, runtime, setLocale, preference, coordinator],
  );

  return {
    locale,
    locales,
    setLocale: changeLocale,
    switching: switching || syncing,
    error: syncError ?? error,
  };
}

/**
 * Tells the server which language this browser is using, once, at startup.
 *
 * Storage and the server's session drift apart routinely — a different browser, an expired session, a switch made in
 * another tab — and this is what brings them back together.
 */
export function useSyncServerLocale(): void {
  const api = useApiClient();
  const runtime = useOptionalI18nRuntime();
  const preference = useContext(AppLocalePreferenceContext);
  const coordinator = getCoordinator(api);
  const integrated = preference !== undefined;

  useEffect(() => {
    if (!runtime || integrated) return;
    let cancelled = false;
    const revision = coordinator.revision;
    const synchronization = enqueue(coordinator, async () => {
      if (cancelled || revision !== coordinator.revision) return;
      await notifyServerLocale(api, runtime.getLocale());
    });
    synchronization.catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [api, runtime, coordinator, integrated]);
}

interface LocaleCoordinator {
  revision: number;
  queue: Promise<unknown>;
}
const coordinators = new WeakMap<ApiClient, LocaleCoordinator>();
function getCoordinator(api: ApiClient): LocaleCoordinator {
  let state = coordinators.get(api);
  if (!state) {
    state = { revision: 0, queue: Promise.resolve() };
    coordinators.set(api, state);
  }
  return state;
}
function enqueue<T>(
  state: LocaleCoordinator,
  operation: () => Promise<T>,
): Promise<T> {
  const result = state.queue.then(operation);
  state.queue = result.catch(() => undefined);
  return result;
}
