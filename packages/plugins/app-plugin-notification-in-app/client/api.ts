import type { NotificationTarget } from '@nocobase/app-plugin-notification/client';
import type { ApiClient } from '@nocobase/app-client';

export type InboxMutationAction = 'read' | 'unread' | 'delete';

export interface InboxItem {
  readonly id: string;
  readonly deliveryId: string;
  readonly notificationId: string;
  readonly title: string;
  readonly body: string;
  readonly target?: NotificationTarget;
  readonly readAt?: string;
  readonly createdAt: string;
}

export interface InboxFilters {
  readonly unreadOnly?: boolean;
  readonly pageSize?: number;
  /** The `nextPageToken` of the previous page, passed back unchanged. */
  readonly pageToken?: string;
}

export interface InboxListResponse {
  readonly data: readonly InboxItem[];
  /** Present while more messages follow; pass it back as `pageToken`. */
  readonly nextPageToken?: string;
}

const MESSAGES_PATH = 'notificationInApp/messages';

export async function fetchInbox(
  client: ApiClient,
  filters: InboxFilters,
  signal?: AbortSignal,
): Promise<InboxListResponse> {
  const query = new URLSearchParams({
    pageSize: String(filters.pageSize ?? 25),
  });
  if (filters.unreadOnly) query.set('unreadOnly', 'true');
  if (filters.pageToken) query.set('pageToken', filters.pageToken);
  const value = await client.request<unknown>({
    path: `${MESSAGES_PATH}?${query}`,
    signal,
  });
  if (isRecord(value) && Array.isArray(value.data)) {
    const meta = isRecord(value.meta) ? value.meta : {};
    return {
      data: value.data as readonly InboxItem[],
      ...(typeof meta.nextPageToken === 'string'
        ? { nextPageToken: meta.nextPageToken }
        : {}),
    };
  }
  throw new Error('Inbox returned an invalid response.');
}

export async function fetchUnreadCount(
  client: ApiClient,
  signal?: AbortSignal,
): Promise<number> {
  const response = await client.request<{
    readonly data: { readonly count: number };
  }>({
    path: `${MESSAGES_PATH}/unreadCount`,
    signal,
  });
  return response.data.count;
}

/** Marks one message read or unread, returning it, or deletes it, returning nothing. */
export async function mutateInboxItem(
  client: ApiClient,
  id: string,
  action: 'read' | 'unread',
): Promise<InboxItem>;
export async function mutateInboxItem(
  client: ApiClient,
  id: string,
  action: 'delete',
): Promise<undefined>;
export async function mutateInboxItem(
  client: ApiClient,
  id: string,
  action: InboxMutationAction,
): Promise<InboxItem | undefined>;
export async function mutateInboxItem(
  client: ApiClient,
  id: string,
  action: InboxMutationAction,
): Promise<InboxItem | undefined> {
  const path = `${MESSAGES_PATH}/${encodeURIComponent(id)}`;
  if (action === 'delete') {
    await mutation<undefined>(client, path, 'DELETE');
    return undefined;
  }
  const response = await mutation<{ readonly data: InboxItem }>(
    client,
    `${path}/${action === 'read' ? 'markRead' : 'markUnread'}`,
    'POST',
  );
  return response.data;
}

export async function markInboxRead(client: ApiClient): Promise<number> {
  const response = await mutation<{
    readonly data: { readonly updated: number };
  }>(client, `${MESSAGES_PATH}/markAllRead`, 'POST');
  return response.data.updated;
}

async function mutation<T>(
  client: ApiClient,
  path: string,
  method: 'POST' | 'DELETE',
): Promise<T> {
  // Cross-site writes are rejected by the authentication plugin's origin check, so no CSRF token is sent.
  return client.request<T>({ path, method });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}
