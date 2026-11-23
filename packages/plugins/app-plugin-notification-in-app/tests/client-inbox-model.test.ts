import { describe, expect, it } from 'vitest';

import type { InboxItem } from '../client/api.js';
import {
  entriesOf,
  groupEntries,
  mergeWaiting,
  shownEntries,
  type InboxCategory,
  type InboxEntry,
  type InboxNotice,
} from '../client/inbox-page/model.js';

const label = () => 'label';

const CATEGORIES: readonly InboxCategory[] = [
  {
    type: 'entries',
    id: 'decisions',
    label,
    title: label,
    empty: label,
    match: (entry) => entry.notice?.kind === 'decision',
    waits: true,
  },
  {
    type: 'entries',
    id: 'notifications',
    label,
    title: label,
    empty: label,
    match: () => true,
  },
];

function item(id: string, readAt?: string): InboxItem {
  return {
    id,
    deliveryId: `delivery-${id}`,
    notificationId: `notification-${id}`,
    title: id,
    body: '',
    category: 'approvals',
    ...(readAt ? { readAt } : {}),
    createdAt: '2026-11-22T00:00:00.000Z',
  };
}

function waitingApproval(readAt?: string): InboxEntry {
  const notice: InboxNotice = {
    notificationId: 'notification-approval',
    source: 'approvals',
    kind: 'decision',
    type: 'approval_requested',
    subject: null,
    decisionKey: 'approval-1',
    data: null,
    count: 1,
    resolvedAt: null,
    outcome: null,
  };
  return { item: item('approval', readAt), notice };
}

describe('inbox list model', () => {
  it('leaves a read waiting approval out of Unread but keeps it in To do and All', () => {
    // The server already narrowed the unread page; the waiting source lists the approval whatever its read state.
    const read = waitingApproval('2026-11-22T01:00:00.000Z');
    const unreadPage = entriesOf([item('fresh')], []);
    const groups = groupEntries(mergeWaiting([read], unreadPage), CATEGORIES);

    expect(
      shownEntries({ view: 'unread', kind: 'all' }, groups, CATEGORIES).map(
        (entry) => entry.item.id,
      ),
    ).toEqual(['fresh']);
    expect(
      shownEntries({ view: 'todo', kind: 'all' }, groups, CATEGORIES).map(
        (entry) => entry.item.id,
      ),
    ).toEqual(['approval']);
    expect(
      shownEntries({ view: 'all', kind: 'all' }, groups, CATEGORIES).map(
        (entry) => entry.item.id,
      ),
    ).toEqual(['approval', 'fresh']);
  });

  it('still lists an unread waiting approval in Unread', () => {
    const groups = groupEntries(
      mergeWaiting([waitingApproval()], []),
      CATEGORIES,
    );
    expect(
      shownEntries(
        { view: 'unread', kind: 'all', category: 'approvals' },
        groups,
        CATEGORIES,
      ).map((entry) => entry.item.id),
    ).toEqual(['approval']);
  });
});
