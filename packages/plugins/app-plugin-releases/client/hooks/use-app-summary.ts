import { ApiClientError } from '@nocobase/app-client';
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from 'react';

import type { AppSummary } from '../../shared/releases.js';
import { appRefreshDelay } from '../lib/app-operations.js';

interface SummaryState {
  readonly appId: string;
  readonly data?: AppSummary;
  readonly error?: unknown;
  readonly loading: boolean;
}

interface AppSummaryLoader {
  readonly data: AppSummary | undefined;
  readonly error: unknown;
  readonly loading: boolean;
  readonly reload: () => Promise<void>;
}

/** One request at a time, including manual refreshes and refreshes after mutations. */
export function useAppSummary(
  appId: string,
  load: () => Promise<AppSummary>,
  onDeploymentChanged: () => void,
): AppSummaryLoader {
  const [state, setState] = useState<SummaryState>({ appId, loading: true });
  const reloadRef = useRef<() => Promise<void>>(async () => undefined);
  const fetchLatest = useEffectEvent(load);
  const deploymentChanged = useEffectEvent(onDeploymentChanged);

  useEffect(() => {
    let active = true;
    let latest: AppSummary | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let inFlight: Promise<void> | undefined;
    let revision = 0;
    let queued = false;
    let failures = 0;
    let denied = false;

    const clearTimer = (): void => {
      clearTimeout(timer);
      timer = undefined;
    };
    const schedule = (): void => {
      clearTimer();
      if (!active || denied || document.hidden) return;
      const delay = failures
        ? Math.min(5000 * 2 ** (failures - 1), 30_000)
        : appRefreshDelay(latest);
      timer = setTimeout(() => void refresh(), delay);
    };
    const drain = async (): Promise<void> => {
      do {
        queued = false;
        const requestRevision = revision;
        setState((previous) => ({
          appId,
          data: latest,
          error: previous.appId === appId ? previous.error : undefined,
          loading: true,
        }));
        try {
          const next = await fetchLatest();
          if (!active || requestRevision !== revision) continue;
          const changed =
            latest &&
            ((latest.hasPendingDeployment && !next.hasPendingDeployment) ||
              latest.app.currentDeploymentId !== next.app.currentDeploymentId);
          latest = next;
          failures = 0;
          denied = false;
          setState({ appId, data: next, loading: false });
          if (changed) deploymentChanged();
        } catch (reason) {
          if (!active || requestRevision !== revision) continue;
          failures += 1;
          denied =
            reason instanceof ApiClientError &&
            (reason.status === 401 || reason.status === 403);
          setState({
            appId,
            data: latest,
            error: reason ?? new Error('Request failed.'),
            loading: false,
          });
        }
      } while (active && queued);
    };
    const refresh = (): Promise<void> => {
      if (!active) return Promise.resolve();
      clearTimer();
      revision += 1;
      queued = true;
      if (!inFlight) {
        inFlight = drain().finally(() => {
          inFlight = undefined;
          schedule();
        });
      }
      return inFlight;
    };
    const visibilityChanged = (): void => {
      clearTimer();
      if (!document.hidden && !denied) void refresh();
    };
    reloadRef.current = refresh;
    document.addEventListener('visibilitychange', visibilityChanged);
    void refresh();
    return () => {
      active = false;
      clearTimer();
      document.removeEventListener('visibilitychange', visibilityChanged);
    };
  }, [appId]);

  const reload = useCallback(() => reloadRef.current(), []);
  return {
    data: state.appId === appId ? state.data : undefined,
    error: state.appId === appId ? state.error : undefined,
    loading: state.appId !== appId || state.loading,
    reload,
  };
}
