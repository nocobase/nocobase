import { useCallback, useEffect, useState } from 'react';

import { errorMessage } from './api.js';

/** How often an open page refreshes; effects and sweeps finish in the background. */
const REFRESH_MS = 4000;

/**
 * Loads `load` now and every few seconds while `key` stays the same, and
 * returns a `reload` for after an action. A failed load keeps the last data.
 */
export function useLoader<T>(
  load: (() => Promise<T>) | undefined,
  key: string,
): {
  readonly data: T | undefined;
  readonly error: string;
  readonly reload: () => Promise<void>;
} {
  // Data is kept with the key it was loaded for, so switching records never
  // shows the previous record's data.
  const [loaded, setLoaded] = useState<{ key: string; data: T } | undefined>();
  const [error, setError] = useState('');
  const reload = useCallback(async (): Promise<void> => {
    if (!load) return;
    try {
      const data = await load();
      setLoaded({ key, data });
      setError('');
    } catch (cause) {
      setError(errorMessage(cause));
    }
    // `key` stands for everything `load` closes over.
    // eslint-disable-next-line react-hooks/exhaustive-deps, @eslint-react/exhaustive-deps
  }, [key]);
  useEffect(() => {
    // The first load also waits a tick, so every refresh comes from a timer.
    const first = setTimeout(() => void reload(), 0);
    const timer = setInterval(() => void reload(), REFRESH_MS);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [reload]);
  return {
    data: loaded?.key === key ? loaded.data : undefined,
    error,
    reload,
  };
}
