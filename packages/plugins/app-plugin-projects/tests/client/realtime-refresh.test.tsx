/**
 * The projects query cache's refresh from announcements (`client/providers/query-provider.tsx`): lists on every issue
 * announcement, an issue's own reads only for the issues named, and projects, which count their issues by status, only
 * for an announcement that names none.
 */
import type { RealtimeListener } from '@nocobase/app-client';
import { useQuery } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { pmKeys } from '../../client/api/keys.js';
import { PM_REALTIME_TOPIC } from '../../shared/realtime.js';

const listeners = new Map<string, RealtimeListener<unknown>>();
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useService: () => ({
    onOpen: () => () => {},
    subscribe: (topic: string, listener: RealtimeListener<unknown>) => {
      listeners.set(topic, listener);
      return () => listeners.delete(topic);
    },
  }),
}));
const { PmQueryProvider } =
  await import('../../client/providers/query-provider.js');

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

const announce = (payload: unknown) =>
  listeners.get(PM_REALTIME_TOPIC)?.({
    type: 'event',
    topic: PM_REALTIME_TOPIC,
    payload,
    publishedAt: '2026-10-15T08:00:00Z',
  });

it('refreshes projects only for an announcement naming no issues', async () => {
  const view = render(
    <PmQueryProvider>
      <Reader name='projects' queryKey={pmKeys.projects} />
      <Reader name='list' queryKey={pmKeys.issuePages({})} />
      <Reader name='a' queryKey={pmKeys.issue('a')} />
      <Reader name='b' queryKey={pmKeys.issue('b')} />
    </PmQueryProvider>,
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
  view.unmount();
});
