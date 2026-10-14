import {
  realtimeClientToken,
  useApiClient,
  useService,
} from '@nocobase/app-client';
import { useEffect, useState } from 'react';

import {
  AGENT_SESSIONS_TOPIC,
  type AgentSessionsChange,
  type DiscoveredChoices,
} from '../shared/api.js';

const EMPTY: Readonly<Record<string, string>> = {};

export interface ChoiceDiscovery {
  readonly loading: boolean;
  readonly result: DiscoveredChoices | undefined;
  readonly error: Error | undefined;
  readonly retry: () => void;
  readonly choose: (id: string, value: string) => void;
}

/** Each effect is a request generation, including A → B → A and retries of the same selection. */
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
  const realtime = useService(realtimeClientToken);
  const [selection, setSelection] = useState<{
    key: string;
    settings: Readonly<Record<string, string>>;
  }>({ key: '', settings: EMPTY });
  const [attempt, setAttempt] = useState(0);
  const settings = selection.key === key ? selection.settings : EMPTY;
  const [answer, setAnswer] = useState<{
    key: string;
    settings: Readonly<Record<string, string>>;
    attempt: number;
    result?: DiscoveredChoices;
    error?: Error;
  }>();
  const { computerId, agentId, cwd, enabled } = target;
  if (selection.key !== key) {
    setSelection({ key, settings: EMPTY });
    setAnswer(undefined);
  }
  useEffect(() => {
    const invalidate = (): void => {
      setSelection((current) => ({ key: current.key, settings: EMPTY }));
      setAttempt((current) => current + 1);
    };
    const unsubscribe = realtime.subscribe<AgentSessionsChange>(
      AGENT_SESSIONS_TOPIC,
      ({ payload }) => {
        if (payload.kind === 'computers') invalidate();
      },
    );
    const unsubscribeOpen = realtime.onOpen(invalidate);
    return () => {
      unsubscribe();
      unsubscribeOpen();
    };
  }, [realtime]);
  useEffect(() => {
    if (!enabled) return;
    let current = true;
    api
      .request<{ data: DiscoveredChoices }>({
        path: `agentSessions/computers/${encodeURIComponent(computerId)}/discoverChoices`,
        method: 'POST',
        json: { agentId, cwd, settings },
      })
      .then(
        ({ data: result }) => {
          if (current) setAnswer({ key, settings, attempt, result });
        },
        (error: unknown) => {
          if (current)
            setAnswer({
              key,
              settings,
              attempt,
              error: error instanceof Error ? error : new Error(String(error)),
            });
        },
      );
    return () => {
      current = false;
    };
  }, [api, key, computerId, agentId, cwd, enabled, settings, attempt]);
  const fresh =
    selection.key === key &&
    answer?.key === key &&
    answer.settings === settings &&
    answer.attempt === attempt;
  const result = fresh && enabled ? answer.result : undefined;
  return {
    loading: enabled && !fresh,
    result,
    error: fresh && enabled ? answer.error : undefined,
    retry: () => {
      setSelection({ key, settings: EMPTY });
      setAttempt((value) => value + 1);
    },
    choose: (id, value) => {
      // A different model can replace dependent choices; rediscover their defaults instead of carrying stale values.
      const model =
        result?.choices.find((choice) => choice.id === id)?.category ===
        'model';
      const kept = model
        ? Object.fromEntries(
            Object.entries(settings).filter(([choiceId]) =>
              result?.choices.some(
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
