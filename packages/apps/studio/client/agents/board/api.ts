/**
 * The Agent queue view's data (`GET /api/agentBoard`). It stays live three ways: the projects plugin's change topic
 * (issues moved, assigned, commented) and the agents plugin's runner topic refetch it at once, and it polls every ten
 * seconds while the page is visible, since runs announce themselves only on their own topics and announcements reach
 * only the browsers connected to the instance that made the change.
 */
import {
  realtimeClientToken,
  useApiClient,
  useService,
} from '@nocobase/app-client';
import { RUNNERS_TOPIC } from '@nocobase/app-plugin-agents/shared/realtime';
import { PM_REALTIME_TOPIC } from '@nocobase/app-plugin-projects/shared/realtime';
import {
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useEffect } from 'react';

import type {
  AgentBoard,
  AgentBoardQuery,
} from '../../../shared/agent-board.js';

/** How often the view refetches while it is visible. */
export const AGENT_BOARD_POLL_MS = 10_000;

export const agentBoardKeys = {
  all: ['studio', 'agent-board'] as const,
  board: (query: AgentBoardQuery) =>
    ['studio', 'agent-board', JSON.stringify(query)] as const,
};

/** The query string the endpoint reads: the filters that are set. */
export function boardQuery(query: AgentBoardQuery): Record<string, string> {
  return Object.fromEntries(
    Object.entries(query).filter(
      (entry): entry is [string, string] =>
        typeof entry[1] === 'string' && entry[1] !== '',
    ),
  );
}

export function useAgentBoard(
  query: AgentBoardQuery,
): UseQueryResult<AgentBoard> {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const realtime = useService(realtimeClientToken);

  useEffect(() => {
    let timer: number | undefined;
    // Several announcements in a burst (a plan executing many rows) make one refetch.
    const refresh = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(
        () =>
          void queryClient.invalidateQueries({ queryKey: agentBoardKeys.all }),
        300,
      );
    };
    const stops = [
      realtime.subscribe<unknown>(PM_REALTIME_TOPIC, refresh),
      realtime.subscribe<unknown>(RUNNERS_TOPIC, refresh),
      realtime.onOpen(refresh),
    ];
    return () => {
      window.clearTimeout(timer);
      for (const stop of stops) stop?.();
    };
  }, [realtime, queryClient]);

  return useQuery({
    queryKey: agentBoardKeys.board(query),
    queryFn: async ({ signal }) =>
      (
        await api.request<{ readonly data: AgentBoard }>({
          path: 'agentBoard',
          query: boardQuery(query),
          signal,
        })
      ).data,
    placeholderData: (previous) => previous,
    refetchInterval: AGENT_BOARD_POLL_MS,
    refetchIntervalInBackground: false,
  });
}
