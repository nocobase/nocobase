/**
 * The projects query cache's refresh from announcements (`client/providers/query-provider.tsx`): lists on every issue
 * announcement, an issue's own reads only for the issues named, and projects, which count their issues by status, only
 * for an announcement that names none.
 */
import {
  realtimeClientToken,
  type RealtimeWatchOptions,
} from '@nocobase/app-client';
import { renderWithApp } from '@nocobase/app-testing/client';
import { useQuery } from '@tanstack/react-query';
import { act, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { expect, it, vi } from 'vitest';

import { pmKeys } from '../../client/api/keys.js';
import { PmQueryProvider } from '../../client/providers/query-provider.js';
import { PM_REALTIME_TOPIC } from '../../shared/realtime.js';

const subscriptions = new Map<string, RealtimeWatchOptions<unknown>>();

function renderQueries(ui: ReactElement) {
  return renderWithApp(<PmQueryProvider>{ui}</PmQueryProvider>, {
    services: (app) => {
      vi.spyOn(
        app.container.resolve(realtimeClientToken),
        'watch',
      ).mockImplementation((topic, options = {}) => {
        subscriptions.set(topic, options as RealtimeWatchOptions<unknown>);
        return {
          state: 'subscribed',
          error: undefined,
          retry: () => {},
          close: () => {
            subscriptions.delete(topic);
          },
        };
      });
    },
  });
}

const reads = { projects: 0, list: 0, a: 0, b: 0 };

function Reader({
  name,
  queryKey,
}: {
  readonly name: keyof typeof reads;
  readonly queryKey: readonly unknown[];
}) {
  useQuery({
    queryKey,
    queryFn: () => {
      reads[name] += 1;
      return reads[name];
    },
  });
  return null;
}

function SnapshotReader({
  readLabels,
  readIssues,
}: {
  readonly readLabels: () => Promise<string>;
  readonly readIssues: () => string;
}) {
  const labels = useQuery({
    queryKey: pmKeys.labels,
    retry: false,
    queryFn: readLabels,
  });
  const issues = useQuery({
    queryKey: pmKeys.issuePages({}),
    queryFn: readIssues,
  });
  return (
    <div>
      {labels.data} / {issues.data}
    </div>
  );
}

const announce = (payload: unknown) =>
  subscriptions.get(PM_REALTIME_TOPIC)?.onEvent?.({
    type: 'event',
    topic: PM_REALTIME_TOPIC,
    payload,
    publishedAt: '2026-10-15T08:00:00Z',
  });

it('refreshes lists and project counts for named changes while preserving unrelated details', async () => {
  const view = await renderQueries(
    <>
      <Reader name='projects' queryKey={pmKeys.projects} />
      <Reader name='list' queryKey={pmKeys.issuePages({})} />
      <Reader name='a' queryKey={pmKeys.issue('a')} />
      <Reader name='b' queryKey={pmKeys.issue('b')} />
    </>,
  );
  await waitFor(() =>
    expect(reads).toEqual({ projects: 1, list: 1, a: 1, b: 1 }),
  );

  announce({ kind: 'pm.changed', domain: 'issues', issueIds: ['a'] });
  await waitFor(() => expect(reads).toMatchObject({ list: 2, a: 2 }));
  expect(reads).toMatchObject({ projects: 1, b: 1 });

  announce({ kind: 'pm.changed', domain: 'issues' });
  await waitFor(() =>
    expect(reads).toEqual({ projects: 2, list: 3, a: 3, b: 2 }),
  );
  announce({
    kind: 'pm.changed',
    domain: 'issues',
    issueIds: ['a'],
    listsChanged: true,
  });
  await waitFor(() =>
    expect(reads).toEqual({ projects: 3, list: 4, a: 4, b: 2 }),
  );
  await view.unmount();
});

it.each(['parent', 'subtasks', 'blockedBy', 'blocks', 'relatedTo', 'blockers'])(
  'refreshes details embedding a changed %s without expanding to unrelated reads',
  async (field) => {
    const reference =
      field === 'parent'
        ? { id: 'a' }
        : field === 'subtasks'
          ? [{ id: 'a' }]
          : [{ issueId: 'a' }, { issueId: 'still-blocking' }];
    const direct = vi.fn(async () => ({ id: 'a' }));
    const embedded = vi.fn(async () => ({ id: 'd', [field]: reference }));
    const unrelated = vi.fn(async () => ({ id: 'b', parent: { id: 'd' } }));
    const history = vi.fn(async () => []);
    function DetailReader({
      queryKey,
      read,
    }: {
      readonly queryKey: readonly unknown[];
      readonly read: () => Promise<unknown>;
    }) {
      useQuery({ queryKey, queryFn: read, staleTime: Infinity });
      return null;
    }
    const view = await renderQueries(
      <>
        <DetailReader queryKey={pmKeys.issue('PM-A')} read={direct} />
        <DetailReader queryKey={pmKeys.issue('PM-D')} read={embedded} />
        <DetailReader queryKey={pmKeys.issue('b')} read={unrelated} />
        <DetailReader
          queryKey={[...pmKeys.issue('PM-D'), 'threads']}
          read={history}
        />
      </>,
    );
    try {
      await waitFor(() => {
        for (const read of [direct, embedded, unrelated, history])
          expect(read).toHaveBeenCalledOnce();
      });
      announce({
        kind: 'pm.changed',
        domain: 'issues',
        issueIds: ['a'],
        listsChanged: true,
      });
      await waitFor(() => {
        expect(direct).toHaveBeenCalledTimes(2);
        expect(embedded).toHaveBeenCalledTimes(2);
      });
      expect(unrelated).toHaveBeenCalledOnce();
      expect(history).toHaveBeenCalledOnce();
    } finally {
      await view.unmount();
    }
  },
);

it.each(['labels', 'ready'] as const)(
  'recovers a failed %s refresh when another domain changes during the read',
  async (trigger) => {
    let labelReads = 0;
    let issueReads = 0;
    const pendingLabels = Promise.withResolvers<string>();
    const view = await renderQueries(
      <SnapshotReader
        readLabels={() => {
          labelReads += 1;
          return labelReads === 2
            ? pendingLabels.promise
            : Promise.resolve(labelReads === 1 ? 'Old labels' : 'New labels');
        }}
        readIssues={() => `Issues ${++issueReads}`}
      />,
    );
    await screen.findByText('Old labels / Issues 1');
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.useFakeTimers();
    try {
      act(() => {
        if (trigger === 'ready')
          subscriptions.get(PM_REALTIME_TOPIC)?.onReady?.();
        else announce({ kind: 'pm.changed', domain: 'labels' });
      });
      await act(async () => vi.advanceTimersByTimeAsync(100));
      expect(labelReads).toBe(2);
      act(() =>
        announce({ kind: 'pm.changed', domain: 'issues', issueIds: ['a'] }),
      );
      await act(async () => {
        pendingLabels.reject(new Error('Temporary labels failure'));
      });
      await act(async () => vi.advanceTimersByTimeAsync(30_000));
      expect(
        screen.getByText(`New labels / Issues ${trigger === 'ready' ? 3 : 2}`),
      ).toBeVisible();
      expect(labelReads).toBe(3);
    } finally {
      await view.unmount();
      vi.useRealTimers();
      log.mockRestore();
    }
  },
);
