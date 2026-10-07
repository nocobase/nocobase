/**
 * The one contract between the inbox and what an application adds to the in-app items: an `InboxSource`. The items
 * themselves (text, read state, deletion) are always `@nocobase/app-plugin-notification-in-app`'s; a source may say
 * who sent each item and whether a decision it asks for still waits (`notices`), list every waiting item in full
 * (`waiting`), and count what waits per category (`pending`). `defaultInboxSource` adds nothing, so every item reads
 * as a notification.
 *
 * The inbox owns the queries, under the plugin's `inboxKeys.all`, so invalidating that key refreshes the items, the
 * count and everything a source answered.
 */
import { useApiClient, type ApiClient } from '@nocobase/app-client';
import { inboxKeys } from '@nocobase/app-plugin-notification-in-app/client/inbox';
import {
  keepPreviousData,
  useQuery,
  type QueryKey,
  type UseQueryResult,
} from '@tanstack/react-query';

import type { InboxEntry, InboxNotice } from './model.js';

/** What a source's calls receive: the application's API client and the query's abort signal. */
export interface InboxSourceRequest {
  readonly api: ApiClient;
  readonly signal?: AbortSignal;
}

export interface InboxSource {
  /** Keeps its queries apart from another source's. */
  readonly id: string;
  /** What it knows about these in-app items, by `notificationId`; items it knows nothing about are left out. */
  readonly notices?: (
    notificationIds: readonly string[],
    request: InboxSourceRequest,
  ) => Promise<readonly InboxNotice[]>;
  /**
   * The items still waiting on the viewer, newest first and in full, with their in-app items; about one subject only
   * (`issue:<id>`) when given. The inbox lists them before the pages.
   */
  readonly waiting?: (
    subject: string | undefined,
    request: InboxSourceRequest,
  ) => Promise<readonly InboxEntry[]>;
  /** How many items wait on the viewer, by category id, such as `{ decision: 3 }`. */
  readonly pending?: (
    request: InboxSourceRequest,
  ) => Promise<Readonly<Record<string, number>>>;
  /** Realtime topics whose events refresh the inbox, besides the in-app plugin's own. */
  readonly refreshTopics?: readonly string[];
}

/** The in-app items alone: nothing waits, and every item reads as a notification. */
export const defaultInboxSource: InboxSource = { id: 'notifications' };

export interface InboxSourceKeys {
  readonly all: QueryKey;
  notices(notificationIds: readonly string[]): QueryKey;
  waiting(subject?: string): QueryKey;
  readonly pending: QueryKey;
}

/** A source's query keys, under the plugin's `inboxKeys.all`. */
export function inboxSourceKeys(source: InboxSource): InboxSourceKeys {
  const all = [...inboxKeys.all, 'source', source.id] as const;
  return {
    all,
    notices: (ids) => [...all, 'notices', ids.join(',')],
    waiting: (subject) => [...all, 'waiting', subject ?? null],
    pending: [...all, 'pending'],
  };
}

/** What `source` knows about the items of these notifications. */
export function useInboxNotices(
  source: InboxSource,
  notificationIds: readonly string[],
): UseQueryResult<readonly InboxNotice[]> {
  const api = useApiClient();
  return useQuery({
    queryKey: inboxSourceKeys(source).notices(notificationIds),
    queryFn: ({ signal }) =>
      source.notices?.(notificationIds, { api, signal }) ?? Promise.resolve([]),
    enabled: notificationIds.length > 0,
    placeholderData: keepPreviousData,
  });
}

/** The items `source` lists as waiting on the viewer, about `subject` when given. */
export function useInboxWaiting(
  source: InboxSource,
  subject?: string,
): UseQueryResult<readonly InboxEntry[]> {
  const api = useApiClient();
  return useQuery({
    queryKey: inboxSourceKeys(source).waiting(subject),
    queryFn: ({ signal }) =>
      source.waiting?.(subject, { api, signal }) ?? Promise.resolve([]),
    // The whole inbox keeps its list while refetching; one subject's list never shows another's.
    ...(subject === undefined
      ? { placeholderData: keepPreviousData }
      : { retry: false }),
  });
}

/** How many items wait on the viewer per category, as `source` counts them. */
export function useInboxPending(
  source: InboxSource,
): UseQueryResult<Readonly<Record<string, number>>> {
  const api = useApiClient();
  return useQuery({
    queryKey: inboxSourceKeys(source).pending,
    queryFn: ({ signal }) =>
      source.pending?.({ api, signal }) ?? Promise.resolve({}),
    retry: false,
    staleTime: 30_000,
  });
}
