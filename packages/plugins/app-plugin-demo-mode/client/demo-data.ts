import { useApiClient } from '@nocobase/app-client';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { DemoDataStatus } from '../server/data/types.js';

export type {
  DemoAccountSummary,
  DemoDataOperation,
  DemoDataState,
  DemoDataStatus,
} from '../server/data/types.js';

export interface DemoDataControls {
  /** Null until the first answer; stays at the last answer while a later request fails. */
  readonly status: DemoDataStatus | null;
  readonly loading: boolean;
  /** The last request's failure, cleared by the next success. */
  readonly error: unknown;
  /** Whether an import, clear or reset this page sent is still being answered. */
  readonly pending: boolean;
  refresh(): Promise<void>;
  importData(language?: string): Promise<void>;
  clear(): Promise<void>;
  reset(language?: string): Promise<void>;
}

/**
 * The demo data endpoints for an application's own demo page: the status, polled every second while an import runs,
 * and the actions. Each action resolves with the new status in `status` and rejects with the API error, so the page
 * can show it.
 */
export function useDemoData(
  options: { readonly enabled?: boolean } = {},
): DemoDataControls {
  const api = useApiClient();
  const enabled = options.enabled !== false;
  const [status, setStatus] = useState<DemoDataStatus | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);
  const aliveRef = useRef(true);
  const requestRef = useRef({ sequence: 0 });

  useEffect(() => {
    const requests = requestRef.current;
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      requests.sequence++;
    };
  }, []);

  const request = useCallback(
    async (path: string, method: 'GET' | 'POST' = 'GET', body?: object) => {
      const requestId = ++requestRef.current.sequence;
      const payload = await api.request<{ data: DemoDataStatus }>({
        path: `/demoMode/data${path}`,
        method,
        ...(body ? { json: body } : {}),
      });
      if (aliveRef.current && requestRef.current.sequence === requestId) {
        setStatus(payload.data);
        setError(null);
        setLoading(false);
      }
    },
    [api],
  );

  const refresh = useCallback(async () => {
    const requestId = requestRef.current.sequence + 1;
    setLoading(true);
    try {
      await request('');
    } catch (cause) {
      if (aliveRef.current && requestRef.current.sequence === requestId) {
        setError(cause);
        const statusCode = (cause as { status?: number } | null)?.status;
        if ([401, 403, 404].includes(statusCode ?? 0)) setStatus(null);
      }
    } finally {
      if (aliveRef.current && requestRef.current.sequence === requestId)
        setLoading(false);
    }
  }, [request]);

  const act = useCallback(
    async (path: string, body?: object) => {
      setPending(true);
      try {
        await request(path, 'POST', body ?? {});
      } catch (cause) {
        if (aliveRef.current) setError(cause);
        // The status may have moved on, as when another administrator started an import.
        await refresh();
        throw cause;
      } finally {
        if (aliveRef.current) setPending(false);
      }
    },
    [request, refresh],
  );

  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(timer);
  }, [enabled, refresh]);

  const running = Boolean(status?.importing);
  useEffect(() => {
    if (!enabled || !running) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      await refresh();
      if (!stopped) timer = setTimeout(() => void poll(), 1000);
    };
    timer = setTimeout(() => void poll(), 1000);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [enabled, running, refresh]);

  return {
    status,
    loading,
    error,
    pending,
    refresh,
    importData: (language) => act('/import', language ? { language } : {}),
    clear: () => act('/clear'),
    reset: (language) => act('/reset', language ? { language } : {}),
  };
}
