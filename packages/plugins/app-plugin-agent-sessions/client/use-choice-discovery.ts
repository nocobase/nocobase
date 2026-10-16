import {
  useApiClient,
  useService,
  realtimeClientToken,
} from '@nocobase/app-client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { useSessionMemory, sessionMemoryKey } from './use-session-memory.js';

import {
  cancelChoiceDiscoveries,
  trackChoiceDiscovery,
} from './discovery-requests.js';

import { type DiscoveredChoices } from '../shared/api.js';

const EMPTY: Readonly<Record<string, string>> = {};
export const DISCOVERY_CACHE_MS: number = 5 * 60_000;
export const DISCOVERY_WAIT_MS: number = 30_000;
export const discoveryKey: readonly ['agentSessions', 'discovery'] = [
  'agentSessions',
  'discovery',
];

export interface ChoiceDiscovery {
  readonly loading: boolean;
  /** Only a fresh answer for the final selection can be used to send. */
  readonly result: DiscoveredChoices | undefined;
  /** Previous choices in this target, for display while dependent settings load. */
  readonly displayed: DiscoveredChoices | undefined;
  readonly settings: Readonly<Record<string, string>>;
  readonly error: Error | undefined;
  readonly isCurrent: () => boolean;
  readonly retry: () => void;
  readonly reset: () => void;
  readonly choose: (id: string, value: string) => void;
}

export function useChoiceDiscovery(
  key: string,
  target: {
    readonly computerId: string;
    readonly agentId: string;
    readonly cwd: string;
    readonly enabled: boolean;
    /** Wait for new-session intent without invalidating cache or cancelling shared work. */
    readonly deferred?: boolean;
  },
): ChoiceDiscovery {
  const api = useApiClient();
  const realtime = useService(realtimeClientToken);
  const connection = useQuery<boolean>({
    queryKey: ['agentSessions', 'discoveryConnection'],
    queryFn: () => realtime.connected,
    enabled: false,
  });
  const connected = connection.data !== false && realtime.connected;
  const client = useQueryClient();
  const [settings, setSettings] = useSessionMemory<
    Readonly<Record<string, string>>
  >(`settings:${key}`, EMPTY);
  const [previous, setPrevious] = useState<{
    key: string;
    result: DiscoveredChoices;
  }>();
  const { computerId, agentId, cwd, enabled, deferred = false } = target;
  const query = useQuery({
    queryKey: [...discoveryKey, key, settings],
    enabled: enabled && connected && !deferred,
    staleTime: DISCOVERY_CACHE_MS,
    retry: false,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { controller, release } = trackChoiceDiscovery(client, [
        ...discoveryKey,
        key,
        settings,
      ]);
      let stopCancellation = () => {};
      const cancellation = new Promise<never>((_, reject) => {
        const cancelled = () =>
          reject(new Error('Agent settings discovery was cancelled.'));
        controller.signal.addEventListener('abort', cancelled, { once: true });
        stopCancellation = () =>
          controller.signal.removeEventListener('abort', cancelled);
      });
      // Navigation must not cancel shared discovery; the explicit timeout bounds its lifetime.
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        // The explicit race also bounds a transport that fails to settle on abort.
        return await Promise.race([
          cancellation,
          api
            .request<{ data: DiscoveredChoices }>({
              path: `agentSessions/computers/${encodeURIComponent(computerId)}/discoverChoices`,
              method: 'POST',
              json: { agentId, cwd, settings },
              signal: controller.signal,
            })
            .then(({ data }) => data),
          new Promise<never>((_, reject) => {
            timer = setTimeout(() => {
              reject(
                new Error(
                  'Agent settings discovery timed out. Retry settings.',
                ),
              );
              controller.abort();
            }, DISCOVERY_WAIT_MS);
          }),
        ]);
      } finally {
        clearTimeout(timer);
        stopCancellation();
        release();
      }
    },
  });
  if (query.data && (previous?.key !== key || previous.result !== query.data))
    setPrevious({ key, result: query.data });

  useEffect(() => {
    if (!enabled) {
      void cancelChoiceDiscoveries(client, [...discoveryKey, key]);
      void client.invalidateQueries({
        queryKey: [...discoveryKey, key],
        refetchType: 'none',
      });
    }
  }, [client, enabled, key]);
  useEffect(() => {
    if (!enabled || !query.dataUpdatedAt || query.isError) return;
    const timer = setTimeout(
      () => {
        void client.invalidateQueries({
          queryKey: [...discoveryKey, key, settings],
          exact: true,
        });
      },
      Math.max(1, query.dataUpdatedAt + DISCOVERY_CACHE_MS - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [client, enabled, key, settings, query.dataUpdatedAt, query.isError]);

  const fresh =
    !deferred &&
    enabled &&
    connected &&
    !query.isFetching &&
    !query.isStale &&
    !query.isError;
  const displayed =
    enabled && previous?.key === key ? previous.result : undefined;
  return {
    loading:
      enabled && connected && (deferred || query.isPending || query.isFetching),
    result: fresh ? query.data : undefined,
    displayed,
    settings,
    error:
      enabled && !connected
        ? new Error(
            'The live connection is unavailable. Reconnect to refresh agent settings.',
          )
        : enabled && query.isError
          ? query.error
          : undefined,
    isCurrent: () => {
      const state = client.getQueryState<DiscoveredChoices>([
        ...discoveryKey,
        key,
        settings,
      ]);
      return Boolean(
        !deferred &&
        enabled &&
        realtime.connected &&
        // Cache writes precede React Query's batched render notifications.
        client.getQueryData(sessionMemoryKey(`settings:${key}`)) === settings &&
        client.getQueryData(['agentSessions', 'discoveryConnection']) !==
          false &&
        state?.data &&
        state.data === query.data &&
        state.status === 'success' &&
        !state.isInvalidated &&
        state.fetchStatus === 'idle' &&
        Date.now() - state.dataUpdatedAt < DISCOVERY_CACHE_MS,
      );
    },
    retry: () => {
      if (!connected) {
        realtime.reconnect();
        return;
      }
      void query.refetch();
    },
    reset: () => {
      void cancelChoiceDiscoveries(client, [...discoveryKey, key]);
      void client.invalidateQueries({
        queryKey: [...discoveryKey, key],
        refetchType: 'none',
      });
      setSettings(EMPTY);
    },
    choose: (id, value) => {
      const model =
        displayed?.choices.find((choice) => choice.id === id)?.category ===
        'model';
      const kept = model
        ? Object.fromEntries(
            Object.entries(settings).filter(([choiceId]) =>
              displayed?.choices.some(
                (choice) =>
                  choice.id === choiceId && choice.category === 'mode',
              ),
            ),
          )
        : settings;
      setSettings({ ...kept, [id]: value });
    },
  };
}
