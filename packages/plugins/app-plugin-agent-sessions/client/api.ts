/**
 * The browser side of `/api/agentSessions`: one function per endpoint, answers unwrapped from `{ data }`, and the
 * react-query hooks the pages read through. Failures throw `ApiClientError`; pages branch on its `reason`.
 */
import {
  realtimeClientToken,
  useApiClient,
  useService,
  type ApiClient,
} from '@nocobase/app-client';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type UseInfiniteQueryResult,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

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
  });
}

export function useSession(sessionId: string): UseQueryResult<Session> {
  const api = useApiClient();
  return useQuery({
    queryKey: keys.session(sessionId),
    queryFn: () => data<Session>(api, { path: path('sessions', sessionId) }),
  });
}

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
    queryFn: async () => {
      const held =
        client.getQueryData<TranscriptEvent[]>(keys.transcript(sessionId)) ??
        [];
      const kept = held.slice(0, -1);
      let after = kept.at(-1)?.seq ?? 0;
      const events = [...kept];
      for (;;) {
        const page = await api.request<ListAnswer<TranscriptEvent>>({
          path: path('sessions', sessionId, 'events'),
          query: { after },
        });
        events.push(...page.data);
        after = page.data.at(-1)?.seq ?? after;
        if (!page.meta.hasMore) return events;
      }
    },
  });
}

/**
 * Tells the server how far the viewer has seen the session while its page is visible, so that they are not told of it
 * elsewhere: once `seq` grows, and at most once a second.
 */
export function useMarkSeen(sessionId: string, seq: number | undefined): void {
  const api = useApiClient();
  const sentRef = useRef<{ sessionId: string; seq: number } | null>(null);
  useEffect(() => {
    if (!seq) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const mark = (): void => {
      const last = sentRef.current;
      if (
        document.visibilityState !== 'visible' ||
        (last?.sessionId === sessionId && last.seq >= seq)
      )
        return;
      clearTimeout(timer);
      timer = setTimeout(() => {
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
    mark();
    document.addEventListener('visibilitychange', mark);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', mark);
    };
  }, [api, sessionId, seq]);
}

/** Refreshes what the viewer sees when the server says something of theirs changed, or the connection comes back. */
export function useLiveSessions(): void {
  const realtime = useService(realtimeClientToken);
  const client = useQueryClient();
  useEffect(() => {
    // A streaming answer changes its session several times a second; the list follows at a calmer pace.
    let listTimer: ReturnType<typeof setTimeout> | undefined;
    const refreshList = (): void => {
      listTimer ??= setTimeout(() => {
        listTimer = undefined;
        void client.invalidateQueries({
          queryKey: ['agentSessions', 'sessions'],
        });
      }, 2_000);
    };
    const refresh = (change?: AgentSessionsChange): void => {
      if (change?.kind === 'session') {
        void client.invalidateQueries({
          queryKey: keys.session(change.sessionId),
        });
        void client.invalidateQueries({
          queryKey: keys.transcript(change.sessionId),
        });
        refreshList();
      } else {
        void client.invalidateQueries({ queryKey: keys.all });
      }
    };
    const unsubscribe = realtime.subscribe<AgentSessionsChange>(
      AGENT_SESSIONS_TOPIC,
      ({ payload }) => refresh(payload),
    );
    const unsubscribeOpen = realtime.onOpen(() => refresh());
    return () => {
      clearTimeout(listTimer);
      unsubscribe();
      unsubscribeOpen();
    };
  }, [client, realtime]);
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
    mutationFn: (input) =>
      data<Session>(api, {
        path: path('sessions'),
        method: 'POST',
        json: input,
      }),
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
): Mutation<{ content: PromptContent[]; mentions: Mention[] }> {
  return useSessionWrite(
    sessionId,
    async (api, json: { content: PromptContent[]; mentions: Mention[] }) => {
      await api.request({
        path: path('sessions', sessionId, 'prompt'),
        method: 'POST',
        json,
      });
    },
  );
}

export function useCancel(sessionId: string): Mutation<void> {
  return useSessionWrite(sessionId, async (api) => {
    await api.request({
      path: path('sessions', sessionId, 'cancel'),
      method: 'POST',
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
