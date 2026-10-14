import { useApiClient } from '@nocobase/app-client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

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
  readonly choose: (id: string, value: string) => void;
}

export function useChoiceDiscovery(
  key: string,
  target: {
    readonly computerId: string;
    readonly agentId: string;
    readonly cwd: string;
    readonly enabled: boolean;
  },
): ChoiceDiscovery {
  const api = useApiClient();
  const client = useQueryClient();
  const [selection, setSelection] = useState({ key, settings: EMPTY });
  const [previous, setPrevious] = useState<{
    key: string;
    result: DiscoveredChoices;
  }>();
  const settings = selection.key === key ? selection.settings : EMPTY;
  if (selection.key !== key) {
    setSelection({ key, settings: EMPTY });
    setPrevious(undefined);
  }
  const { computerId, agentId, cwd, enabled } = target;
  const query = useQuery({
    queryKey: [...discoveryKey, key, settings],
    enabled,
    staleTime: DISCOVERY_CACHE_MS,
    retry: false,
    refetchOnWindowFocus: true,
    queryFn: async ({ signal }) => {
      const controller = new AbortController();
      const abort = (): void => controller.abort();
      signal.addEventListener('abort', abort, { once: true });
      if (signal.aborted) abort();
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        // The explicit race also bounds a transport that fails to settle on abort.
        return await Promise.race([
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
        signal.removeEventListener('abort', abort);
      }
    },
  });
  if (query.data && previous?.result !== query.data)
    setPrevious({ key, result: query.data });

  useEffect(() => {
    if (!enabled) {
      void client.cancelQueries({ queryKey: discoveryKey });
      void client.invalidateQueries({
        queryKey: discoveryKey,
        refetchType: 'none',
      });
    }
  }, [client, enabled]);
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
    enabled && !query.isFetching && !query.isStale && !query.isError;
  const displayed =
    enabled && previous?.key === key ? previous.result : undefined;
  return {
    loading: enabled && (query.isPending || query.isFetching),
    result: fresh ? query.data : undefined,
    displayed,
    settings,
    error: enabled && query.isError ? query.error : undefined,
    isCurrent: () => {
      const state = client.getQueryState<DiscoveredChoices>([
        ...discoveryKey,
        key,
        settings,
      ]);
      return Boolean(
        enabled &&
        state?.data &&
        state.data === query.data &&
        state.status === 'success' &&
        !state.isInvalidated &&
        state.fetchStatus === 'idle' &&
        Date.now() - state.dataUpdatedAt < DISCOVERY_CACHE_MS,
      );
    },
    retry: () => {
      void query.refetch();
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
      setSelection({ key, settings: { ...kept, [id]: value } });
    },
  };
}
