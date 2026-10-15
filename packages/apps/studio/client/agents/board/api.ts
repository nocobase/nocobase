/**
 * The Agent queue view's data (`GET /api/agentBoard`). It stays live three ways: the projects plugin's change topic
 * (issues moved, assigned, commented) and the agents plugin's runner topic read it again, a burst of them once
 * (`coalesce.ts`: one read in flight, none while the page is hidden), and it polls every `AGENT_BOARD_POLL_MS` while
 * the page is visible, since runs announce themselves only on their own topics and announcements reach only the
 * browsers connected to the instance that made the change. A queued row says why it waits in short; the exact reason
 * is its own read, made when the row is unfolded (`useAgentBoardWait`).
 */
import {
  realtimeClientToken,
  useApiClient,
  useService,
  type RealtimeClient,
} from '@nocobase/app-client';
import { RUNNERS_TOPIC } from '@nocobase/app-plugin-agents/shared/realtime';
import { PM_REALTIME_TOPIC } from '@nocobase/app-plugin-projects/shared/realtime';
import {
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useEffect } from 'react';

import type { RunWait } from '@nocobase/app-plugin-agents/shared/runs';

import type {
  AgentBoard,
  AgentBoardQuery,
} from '../../../shared/agent-board.js';
import { coalescedRefresh, type CoalescedRefresh } from './coalesce.js';

/** How often the view refetches while it is visible, as a fallback to the announcements. */
export const AGENT_BOARD_POLL_MS = 45_000;
/** How long a burst of announcements is gathered before the view is read again. */
export const AGENT_BOARD_COALESCE_MS = 1_500;

export const agentBoardKeys = {
  all: ['studio', 'agent-board'] as const,
  board: (query: AgentBoardQuery) =>
    ['studio', 'agent-board', JSON.stringify(query)] as const,
  /** Under the board's, so what reads the board again reads an unfolded row's reason too. */
  wait: (issueId: string, agentId: string) =>
    ['studio', 'agent-board', 'wait', issueId, agentId] as const,
};

/** Reads the board again on the projects plugin's and the runners' announcements, a burst once. */
export function subscribeAgentBoardRefresh(
  realtime: Pick<RealtimeClient, 'subscribe' | 'onOpen'>,
  refresh: CoalescedRefresh,
): () => void {
  const stops = [
    realtime.subscribe<unknown>(PM_REALTIME_TOPIC, refresh.request),
    realtime.subscribe<unknown>(RUNNERS_TOPIC, refresh.request),
    realtime.onOpen(refresh.request),
  ];
  return () => {
    refresh.stop();
    for (const stop of stops) stop?.();
  };
}

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

  useEffect(
    () =>
      subscribeAgentBoardRefresh(
        realtime,
        coalescedRefresh(
          queryClient,
          agentBoardKeys.all,
          AGENT_BOARD_COALESCE_MS,
        ),
      ),
    [realtime, queryClient],
  );

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

/** Exactly why an agent's queued run on an issue waits (`GET /api/agentBoard/issues/:issueId/agents/:agentId/wait`). */
export function useAgentBoardWait(
  issueId: string,
  agentId: string,
): UseQueryResult<RunWait> {
  const api = useApiClient();
  return useQuery({
    queryKey: agentBoardKeys.wait(issueId, agentId),
    queryFn: async ({ signal }) =>
      (
        await api.request<{ readonly data: RunWait }>({
          path: `agentBoard/issues/${encodeURIComponent(issueId)}/agents/${encodeURIComponent(agentId)}/wait`,
          signal,
        })
      ).data,
    // Folding and unfolding again keeps a fresh answer; the board's own refreshes read it again.
    staleTime: 10_000,
    retry: false,
  });
}
