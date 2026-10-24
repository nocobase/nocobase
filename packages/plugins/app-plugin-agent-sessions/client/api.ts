/**
 * The browser side of `/api/agentSessions`: one function per endpoint, answers unwrapped from `{ data }`, and the
 * react-query hooks the pages read through. Failures throw `ApiClientError`; pages branch on its `reason`.
 */
import {
  realtimeClientToken,
  refreshRealtimeQueries,
  createRealtimeRefresh,
  type RealtimeRefresh,
  useApiClient,
  useService,
  type ApiClient,
} from '@nocobase/app-client';
import {
  replaceEqualDeep,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
  type QueryFilters,
  type UseInfiniteQueryResult,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  useCallback,
  useContext,
  useEffect,
  useRef,
  type RefObject,
} from 'react';
import { cancelChoiceDiscoveries } from './discovery-requests.js';
import {
  ApplicationCacheContext,
  agentSessionsQueryClient,
} from './query-cache.js';

import {
  AGENT_SESSIONS_TOPIC,
  type AgentSessionsChange,
  type Computer,
  type FolderListing,
  type PromptContent,
  type Reference,
  type Session,
  type SessionProject,
  type TranscriptEvent,
} from '../shared/api.js';

/** Something a message mentions with `#`. */
export type Mention = Pick<Reference, 'kind' | 'refId'>;

interface ListAnswer<T> {
  readonly data: T[];
  readonly meta: {
    readonly nextPageToken?: string;
    readonly hasMore?: boolean;
  };
}

const path = (...parts: string[]): string =>
  ['agentSessions', ...parts.map((part) => encodeURIComponent(part))].join('/');

async function data<T>(
  api: ApiClient,
  request: Parameters<ApiClient['request']>[0],
): Promise<T> {
  return (await api.request<{ data: T }>(request)).data;
}

const keys = {
  all: ['agentSessions'] as const,
  computers: ['agentSessions', 'computers'] as const,
  sessions: (archived: boolean) =>
    ['agentSessions', 'sessions', archived] as const,
  session: (sessionId: string) =>
    ['agentSessions', 'session', sessionId] as const,
  transcript: (sessionId: string) =>
    ['agentSessions', 'transcript', sessionId] as const,
  projects: ['agentSessions', 'projects'] as const,
};

export function useComputers(): UseQueryResult<Computer[]> {
  const api = useApiClient();
  return useQuery({
    queryKey: keys.computers,
    queryFn: () => data<Computer[]>(api, { path: path('computers') }),
    // Online is a matter of time as well as of polls: look again now and then.
    refetchInterval: 30_000,
  });
}

/** Check the owner's current computers on demand, without adding a background poll to the host page. */
export function useAgentSessionAvailability(): () => Promise<boolean> {
  const api = useApiClient();
  const cache =
    useContext(ApplicationCacheContext) ?? agentSessionsQueryClient();
  return useCallback(async () => {
    const computers = await cache.fetchQuery({
      queryKey: keys.computers,
      queryFn: () => data<Computer[]>(api, { path: path('computers') }),
      staleTime: 0,
    });
    return computers.some(
      (computer) =>
        computer.online && computer.agents.some((agent) => !agent.problem),
    );
  }, [api, cache]);
}

export function useSessions(
  archived: boolean,
): UseInfiniteQueryResult<InfiniteData<ListAnswer<Session>>> {
  const api = useApiClient();
  return useInfiniteQuery({
    queryKey: keys.sessions(archived),
    queryFn: ({ pageParam }) =>
      api.request<ListAnswer<Session>>({
        path: path('sessions'),
        query: {
          archived: String(archived),
          pageSize: 50,
          ...(pageParam ? { pageToken: pageParam } : {}),
        },
      }),
    initialPageParam: '',
    getNextPageParam: (last) => last.meta.nextPageToken,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

/**
 * The viewer's open sessions tied to one record (`kind`, `refId`), the most recently active first: those that created
 * it or mentioned it. It reads this plugin's cache, so a page of the application calls it outside the plugin's pages.
 */
export function useLinkedSessions(
  kind: string,
  refId: string | null | undefined,
): UseQueryResult<Session[]> {
  const api = useApiClient();
  const cache = useContext(ApplicationCacheContext);
  const linked = `${kind}:${refId ?? ''}`;
  return useQuery(
    {
      queryKey: ['agentSessions', 'sessions', 'linked', linked],
      enabled: Boolean(refId),
      queryFn: () =>
        api
          .request<ListAnswer<Session>>({
            path: path('sessions'),
            query: { archived: 'false', pageSize: 20, linked },
          })
          .then((answer) => answer.data),
      staleTime: 30_000,
      refetchOnWindowFocus: true,
    },
    cache ?? agentSessionsQueryClient(),
  );
}

export function useSession(sessionId: string): UseQueryResult<Session> {
  const api = useApiClient();
  return useQuery({
    queryKey: keys.session(sessionId),
    queryFn: () => data<Session>(api, { path: path('sessions', sessionId) }),
    // Linked records may change without a session event (for example, an issue accepted elsewhere).
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

// Read progress belongs to committed GET data, never to optimistic prompt confirmations.
const transcriptReadPositions = new WeakMap<
  readonly TranscriptEvent[],
  number
>();

/**
 * The whole transcript, kept up to date: each change reads on from the last event held, which may have grown since (a
 * streamed message continues in place).
 */
export function useTranscript(
  sessionId: string,
): UseQueryResult<TranscriptEvent[]> {
  const api = useApiClient();
  const client = useQueryClient();
  return useQuery({
    queryKey: keys.transcript(sessionId),
    // Transfer progress when the result commits, even if structural sharing retains the old array identity.
    structuralSharing: (held, fetched) => {
      const shared = replaceEqualDeep(held, fetched);
      if (Array.isArray(fetched) && Array.isArray(shared))
        transcriptReadPositions.set(
          shared,
          transcriptReadPositions.get(fetched) ?? 0,
        );
      return shared;
    },
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    queryFn: async ({ signal }) => {
      const held =
        client.getQueryData<TranscriptEvent[]>(keys.transcript(sessionId)) ??
        [];
      const readFrom = transcriptReadPositions.get(held) ?? 0;
      let after = readFrom;
      const events: TranscriptEvent[] = [];
      for (;;) {
        const page = await api.request<ListAnswer<TranscriptEvent>>({
          path: path('sessions', sessionId, 'events'),
          query: { after },
          signal,
        });
        events.push(...page.data);
        after = page.data.at(-1)?.seq ?? after;
        if (!page.meta.hasMore) {
          signal.throwIfAborted();
          const merged = mergeTranscript(
            client.getQueryData<TranscriptEvent[]>(
              keys.transcript(sessionId),
            ) ?? [],
            events,
          );
          // Only the server-read prefix is safe; its final event may still grow in place.
          transcriptReadPositions.set(merged, events.at(-2)?.seq ?? readFrom);
          return merged;
        }
      }
    },
  });
}

/**
 * Tells the server how far the viewer has seen the session while its page is visible, so that they are not told of it
 * elsewhere: once `seq` grows, and at most once a second.
 */
export function useMarkSeen(
  sessionId: string,
  seq: number | undefined,
  endRef: RefObject<HTMLElement | null>,
): void {
  const api = useApiClient();
  const sentRef = useRef<{ sessionId: string; seq: number } | null>(null);
  useEffect(() => {
    const target = endRef.current;
    if (!seq || !target || typeof IntersectionObserver === 'undefined') return;
    let intersecting = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const mark = (): void => {
      clearTimeout(timer);
      const last = sentRef.current;
      if (
        !intersecting ||
        document.visibilityState !== 'visible' ||
        (last?.sessionId === sessionId && last.seq >= seq)
      )
        return;
      timer = setTimeout(() => {
        if (!intersecting || document.visibilityState !== 'visible') return;
        sentRef.current = { sessionId, seq };
        api
          .request({
            path: path('sessions', sessionId, 'seen'),
            method: 'POST',
            json: { seq },
          })
          .catch(() => {
            // Told of it elsewhere then, at worst; the next event tries again.
            sentRef.current = null;
          });
      }, 1_000);
    };
    const observer = new IntersectionObserver(([entry]) => {
      intersecting = Boolean(entry?.isIntersecting);
      mark();
    });
    observer.observe(target);
    document.addEventListener('visibilitychange', mark);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
      document.removeEventListener('visibilitychange', mark);
    };
  }, [api, sessionId, seq, endRef]);
}

const liveSubscriptions = new WeakMap<
  QueryClient,
  { refs: number; release: () => void }
>();

/** Refreshes what the viewer sees when the server says something of theirs changed, or the connection comes back. */
export function useLiveSessions(): void {
  const realtime = useService(realtimeClientToken);
  const client = useQueryClient();
  useEffect(() => {
    const existing = liveSubscriptions.get(client);
    const detach = (): void => {
      const shared = liveSubscriptions.get(client);
      if (shared && --shared.refs === 0) {
        shared.release();
        liveSubscriptions.delete(client);
      }
    };
    if (existing) {
      existing.refs += 1;
      return detach;
    }
    const slots = new Map<string, RealtimeRefresh>();
    const schedule = (
      id: string,
      filters: QueryFilters,
      interval: number,
    ): void => {
      let slot = slots.get(id);
      if (!slot) {
        slot = createRealtimeRefresh(
          (signal) => refreshRealtimeQueries(client, filters, signal),
          {
            delayMs: interval,
            onStateChange: (snapshot) => {
              if (snapshot.status === 'idle') {
                slots.get(id)?.close();
                slots.delete(id);
              }
            },
          },
        );
        slots.set(id, slot);
      }
      slot.request();
    };
    const invalidateDiscovery = (): void => {
      void cancelChoiceDiscoveries(client);
      void client.invalidateQueries({
        queryKey: ['agentSessions', 'discovery'],
      });
    };
    const refresh = (change?: AgentSessionsChange): void => {
      if (change?.kind === 'session') {
        const id = change.sessionId;
        schedule(`events:${id}`, { queryKey: keys.transcript(id) }, 250);
        schedule(`session:${id}`, { queryKey: keys.session(id) }, 1_000);
        schedule('list', { queryKey: ['agentSessions', 'sessions'] }, 2_000);
      } else if (change?.kind === 'computers') {
        invalidateDiscovery();
        schedule('computers', { queryKey: keys.computers }, 100);
        schedule('details', { queryKey: ['agentSessions', 'session'] }, 100);
      } else {
        invalidateDiscovery();
        schedule(
          'all',
          {
            predicate: (query) =>
              query.queryKey[0] === 'agentSessions' &&
              query.queryKey[1] !== 'discovery',
          },
          100,
        );
      }
    };
    const connectionKey = ['agentSessions', 'discoveryConnection'];
    client.setQueryData(connectionKey, false);
    const disconnected = (): void => {
      client.setQueryData(connectionKey, false);
      void cancelChoiceDiscoveries(client);
      void client.invalidateQueries({
        queryKey: ['agentSessions', 'discovery'],
        refetchType: 'none',
      });
    };
    const subscription = realtime.watch<AgentSessionsChange>(
      AGENT_SESSIONS_TOPIC,
      {
        onEvent: ({ payload }) => refresh(payload),
        onStateChange: (state) => {
          if (state !== 'subscribed') disconnected();
        },
        onReady: () => {
          client.setQueryData(connectionKey, true);
          for (const slot of slots.values()) slot.retry();
          refresh();
        },
      },
    );
    const release = (): void => {
      void cancelChoiceDiscoveries(client);
      for (const slot of slots.values()) slot.close();
      slots.clear();
      // No bridge generation is exposed to the browser. Do not reuse discovery across an unobserved interval.
      void client.invalidateQueries({
        queryKey: ['agentSessions', 'discovery'],
        refetchType: 'none',
      });
      subscription.close();
    };
    liveSubscriptions.set(client, { refs: 1, release });
    refresh();
    return detach;
  }, [client, realtime]);
}

/** Preserve confirmed events missing from an older GET; fetched updates may grow existing streamed events. */
export function mergeTranscript(
  held: readonly TranscriptEvent[],
  fetched: readonly TranscriptEvent[],
): TranscriptEvent[] {
  const events = new Map(held.map((event) => [event.seq, event]));
  for (const event of fetched) events.set(event.seq, event);
  const merged = [...events.values()].sort(
    (left, right) => left.seq - right.seq,
  );
  transcriptReadPositions.set(merged, transcriptReadPositions.get(held) ?? 0);
  return merged;
}

type Mutation<Input, Output = void> = UseMutationResult<Output, Error, Input>;

/** A write whose answer is the session as it is now. */
function useSessionWrite<Input>(
  sessionId: string,
  write: (api: ApiClient, input: Input) => Promise<Session | void>,
): Mutation<Input> {
  const api = useApiClient();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: Input) => {
      const session = await write(api, input);
      if (session) client.setQueryData(keys.session(sessionId), session);
    },
    onSettled: () => {
      void client.invalidateQueries({ queryKey: keys.session(sessionId) });
      void client.invalidateQueries({ queryKey: keys.transcript(sessionId) });
      void client.invalidateQueries({
        queryKey: ['agentSessions', 'sessions'],
      });
    },
  });
}

export function useCreateSession(): Mutation<
  {
    submissionId: string;
    computerId: string;
    agentId: string;
    cwd: string;
    content: PromptContent[];
    settings: Record<string, string>;
    projectId: string | null;
    mentions: Mention[];
  },
  Session
> {
  const api = useApiClient();
  const client = useQueryClient();
  return useMutation({
    mutationKey: ['agentSessions', 'createSession'],
    mutationFn: (input) =>
      data<Session>(api, {
        path: path('sessions'),
        method: 'POST',
        json: input,
        signal: AbortSignal.timeout(30_000),
      }),
    retry: false,
    onError: () => {
      void client.invalidateQueries({
        queryKey: ['agentSessions', 'sessions'],
      });
    },
    onSuccess: (session) => {
      client.setQueryData(keys.session(session.id), session);
      void client.invalidateQueries({
        queryKey: ['agentSessions', 'sessions'],
      });
    },
  });
}

export function usePrompt(
  sessionId: string,
): Mutation<
  { content: PromptContent[]; mentions: Mention[]; submissionId: string },
  TranscriptEvent
> {
  const api = useApiClient();
  const client = useQueryClient();
  return useMutation({
    mutationKey: ['agentSessions', 'prompt', sessionId],
    retry: false,
    mutationFn: (json) =>
      data<TranscriptEvent>(api, {
        path: path('sessions', sessionId, 'prompt'),
        method: 'POST',
        json,
        signal: AbortSignal.timeout(30_000),
      }),
    onSuccess: async (event) => {
      await client.cancelQueries({ queryKey: keys.transcript(sessionId) });
      client.setQueryData<TranscriptEvent[]>(
        keys.transcript(sessionId),
        (held = []) => mergeTranscript(held, [event]),
      );
      // Realtime supplies the bounded session/list refresh. Transcript recovery also polls and refetches on focus.
    },
    onError: () => {
      // A failed transport may have committed. Reconcile; never automatically resend the prompt.
      void client.invalidateQueries({ queryKey: keys.transcript(sessionId) });
      void client.invalidateQueries({ queryKey: keys.session(sessionId) });
    },
  });
}

export function useCancel(sessionId: string): Mutation<void> {
  return useSessionWrite(sessionId, async (api) => {
    await api.request({
      path: path('sessions', sessionId, 'cancel'),
      method: 'POST',
    });
  });
}

export function useWithdraw(sessionId: string): Mutation<number> {
  return useSessionWrite(sessionId, async (api, seq: number) => {
    await api.request({
      path: path('sessions', sessionId, 'withdraw'),
      method: 'POST',
      json: { seq },
    });
  });
}

export function useAnswer(
  sessionId: string,
): Mutation<{ requestId: string; optionId: string | null }> {
  return useSessionWrite(
    sessionId,
    async (api, json: { requestId: string; optionId: string | null }) => {
      await api.request({
        path: path('sessions', sessionId, 'answer'),
        method: 'POST',
        json,
      });
    },
  );
}

export function useChoose(
  sessionId: string,
): Mutation<{ choiceId: string; value: string }> {
  return useSessionWrite(
    sessionId,
    (api, json: { choiceId: string; value: string }) =>
      data<Session>(api, {
        path: path('sessions', sessionId, 'choose'),
        method: 'POST',
        json,
      }),
  );
}

export function useUpdateSession(
  sessionId: string,
): Mutation<{ title?: string | null; archived?: boolean }> {
  return useSessionWrite(
    sessionId,
    (api, json: { title?: string | null; archived?: boolean }) =>
      data<Session>(api, {
        path: path('sessions', sessionId),
        method: 'PATCH',
        json,
      }),
  );
}

export function useDecideLinks(
  sessionId: string,
): Mutation<{ kind: string; start: string[]; skip: string[] }> {
  return useSessionWrite(
    sessionId,
    (api, json: { kind: string; start: string[]; skip: string[] }) =>
      data<Session>(api, {
        path: path('sessions', sessionId, 'links', 'decide'),
        method: 'POST',
        json,
      }),
  );
}

export function useRemoveComputer(): Mutation<string> {
  const api = useApiClient();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (computerId: string) => {
      await api.request({
        path: path('computers', computerId),
        method: 'DELETE',
      });
    },
    onSettled: () => void client.invalidateQueries({ queryKey: keys.all }),
  });
}

/** The projects a session may work for; empty when the application has none. */
export function useProjects(): UseQueryResult<SessionProject[]> {
  const api = useApiClient();
  return useQuery({
    queryKey: keys.projects,
    queryFn: () => data<SessionProject[]>(api, { path: path('projects') }),
    staleTime: 60_000,
  });
}

/** What a message can mention with `#` matching `query`; nothing is asked while `query` is undefined. */
export function useMentions(
  query: string | undefined,
  projectId: string | null,
): UseQueryResult<Reference[]> {
  const api = useApiClient();
  return useQuery({
    queryKey: ['agentSessions', 'mentions', query, projectId],
    queryFn: () =>
      data<Reference[]>(api, {
        path: path('mentions'),
        query: { q: query ?? '', ...(projectId ? { projectId } : {}) },
      }),
    enabled: query !== undefined,
    placeholderData: (previous) => previous,
    staleTime: 10_000,
  });
}

/** The folders in `dir` on the computer, as its bridge lists them; its owner's home directory without `dir`. */
export function useFolders(
  computerId: string,
  dir: string | undefined,
): UseQueryResult<FolderListing> {
  const api = useApiClient();
  return useQuery({
    queryKey: ['agentSessions', 'folders', computerId, dir],
    queryFn: () =>
      data<FolderListing>(api, {
        path: path('computers', computerId, 'folders'),
        ...(dir ? { query: { path: dir } } : {}),
      }),
    retry: false,
    staleTime: 10_000,
  });
}

/** Sets the folders sessions on the computer may work in; null for all its bridge allows. */
export function useUpdateFolders(
  computerId: string,
): Mutation<string[] | null, Computer> {
  const api = useApiClient();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (folders) =>
      data<Computer>(api, {
        path: path('computers', computerId),
        method: 'PATCH',
        json: { folders },
      }),
    onSettled: () =>
      void client.invalidateQueries({ queryKey: keys.computers }),
  });
}
