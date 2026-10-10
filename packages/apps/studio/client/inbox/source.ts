/**
 * Studio's inbox source: what Studio adds to the in-app notification plugin's items (`/api/inbox`), the one contract
 * between the inbox block (`@/extensions/nocobase-inbox`) and Studio's notices. The items themselves (text, read state,
 * deletion) stay the plugin's; Studio says who sent each, whether a decision it asks for still waits, and how many do.
 */
import {
  useInboxPending,
  useInboxWaiting,
  type InboxSource,
} from '@/extensions/nocobase-inbox/source';
import type { InboxEntry } from '@/extensions/nocobase-inbox/model';
import type { UseQueryResult } from '@tanstack/react-query';

import {
  STUDIO_INBOX_TOPIC,
  type InboxNotice,
  type InboxPending,
  type InboxWaiting,
} from '../../shared/inbox.js';

export const studioInboxSource: InboxSource = {
  id: 'studio',
  // What Studio knows about these items; items it knows nothing about are left out.
  async notices(notificationIds, { api, signal }) {
    if (notificationIds.length === 0) return [];
    const body = await api.request<{ readonly data: InboxNotice[] }>({
      path: 'inbox/notices',
      query: { ids: notificationIds.join(',') },
      signal,
    });
    return body.data;
  },
  // The decisions still waiting on the viewer, newest first, with their items; about `subject` (`issue:<id>`) only.
  async waiting(subject, { api, signal }) {
    const body = await api.request<{ readonly data: InboxWaiting[] }>({
      path: 'inbox/waiting',
      ...(subject ? { query: { subject } } : {}),
      signal,
    });
    // The server reads the in-app plugin's items as its API lists them.
    return body.data.map(({ item, notice }) => ({ item, notice }));
  },
  async pending({ api, signal }) {
    const body = await api.request<{ readonly data: InboxPending }>({
      path: 'inbox/pending',
      signal,
    });
    return { decision: body.data.decision, info: body.data.info };
  },
  // A decision resolved: Studio's own topic, besides the plugin's.
  refreshTopics: [STUDIO_INBOX_TOPIC],
};

/** The decisions still waiting on the viewer (`decision`), as `/api/inbox/pending` counts them. */
export function usePendingDecisions(): UseQueryResult<
  Readonly<Record<string, number>>
> {
  return useInboxPending(studioInboxSource);
}

/** The decisions waiting on the viewer about one subject (`issue:<id>`). */
export function useWaitingAbout(
  subject: string,
): UseQueryResult<readonly InboxEntry[]> {
  return useInboxWaiting(studioInboxSource, subject);
}
