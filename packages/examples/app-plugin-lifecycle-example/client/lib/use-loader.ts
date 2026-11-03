import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { errorMessage } from './api.js';

/**
 * Loads `load` now, again whenever `key` names something else, and again
 * whenever `refresh` changes, and returns a `reload` for after an action.
 * It never polls: the page reloads when told something changed. A failed
 * load keeps the last data.
 */
export function useLoader<T>(
  load: ((signal?: AbortSignal) => Promise<T>) | undefined,
  key: string,
  /** Changes when what was loaded may have changed: reloads, keeping the data meanwhile. */
  refresh: string | number = '',
  loadOnMount = true,
): {
  readonly data: T | undefined;
  readonly error: string;
  readonly reload: () => Promise<void>;
  readonly refresh: (signal?: AbortSignal) => Promise<void>;
} {
  const scope = useMemo(() => ({ key }), [key]);
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });
  const lifetimeRef = useRef({ scope, active: true, revision: 0 });
  const [loaded, setLoaded] = useState<{ scope: typeof scope; data: T }>();
  const [failure, setFailure] = useState<{
    scope: typeof scope;
    error: string;
  }>();
  useEffect(() => {
    const lifetime = { scope, active: true, revision: 0 };
    lifetimeRef.current = lifetime;
    return () => {
      lifetime.active = false;
      lifetime.revision += 1;
    };
  }, [scope]);
  const refreshData = useCallback(
    async (signal?: AbortSignal): Promise<void> => {
      const load = loadRef.current;
      const lifetime = lifetimeRef.current;
      if (!load || !lifetime.active || lifetime.scope !== scope) return;
      const revision = ++lifetime.revision;
      const current = (): boolean =>
        lifetime.active && lifetime.revision === revision && !signal?.aborted;
      try {
        signal?.throwIfAborted();
        const data = await load(signal);
        if (current()) {
          setLoaded({ scope, data });
          setFailure(undefined);
        }
      } catch (cause) {
        if (current()) {
          setFailure({ scope, error: errorMessage(cause) });
          if (
            typeof cause === 'object' &&
            cause !== null &&
            'status' in cause &&
            (cause.status === 401 || cause.status === 403)
          )
            setLoaded(undefined);
        }
        throw cause;
      }
    },
    [scope],
  );
  const reload = useCallback(
    (): Promise<void> => refreshData().catch(() => {}),
    [refreshData],
  );
  useEffect(() => {
    // Loaded from a timer, not during the effect's own run.
    const first = loadOnMount ? setTimeout(() => void reload(), 0) : undefined;
    return () => clearTimeout(first);
  }, [reload, refresh, loadOnMount]);
  return {
    data: loaded?.scope === scope ? loaded.data : undefined,
    error: failure?.scope === scope ? failure.error : '',
    refresh: refreshData,
    reload,
  };
}
