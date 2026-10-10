import { useCallback, useEffect, useState } from 'react';

import { errorMessage } from './api.js';

/**
 * Loads `load` now, again whenever `key` names something else, and again
 * whenever `refresh` changes, and returns a `reload` for after an action.
 * It never polls: the page reloads when told something changed. A failed
 * load keeps the last data.
 */
export function useLoader<T>(
  load: (() => Promise<T>) | undefined,
  key: string,
  /** Changes when what was loaded may have changed: reloads, keeping the data meanwhile. */
  refresh: string | number = '',
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
    // Loaded from a timer, not during the effect's own run.
    const first = setTimeout(() => void reload(), 0);
    return () => clearTimeout(first);
  }, [reload, refresh]);
  return {
    data: loaded?.key === key ? loaded.data : undefined,
    error,
    reload,
  };
}
