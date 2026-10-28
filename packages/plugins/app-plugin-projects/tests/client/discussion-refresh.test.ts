import { afterEach, expect, it, vi } from 'vitest';
import { QueryObserver } from '@tanstack/react-query';
import { PmQueryClient } from '../../client/api/invalidate-queries.js';
import type { IssueDetail } from '../../shared/issues.js';

const client = new PmQueryClient({
  defaultOptions: { queries: { retry: false, staleTime: Infinity } },
});
afterEach(() => client.clear());
const key = ['pm', 'issue', 'PM-1'];
const original = {
  id: 'i1',
  revision: 7,
  threads: [],
  activities: [],
  needsYou: 'Preserved',
  progress: { state: 'running' },
} as unknown as IssueDetail;
const thread = {
  root: { id: 'c1', content: 'New report' },
  replies: [],
} as unknown as IssueDetail['threads'][number];
const api = () => ({
  threads: vi.fn(async () => ({ data: [thread], nextCursor: 'tc' })),
  activities: vi.fn(async () => ({ data: [], nextCursor: 'ac' })),
});
async function observe() {
  const read = vi.fn(async () => original);
  await client.fetchQuery({ queryKey: key, queryFn: read });
  const observer = new QueryObserver(client, { queryKey: key, queryFn: read });
  const stop = observer.subscribe(() => {});
  return { read, stop };
}

it('merges only discussion pages under an identifier without reloading the detail or changing its recovery reader', async () => {
  const { read, stop } = await observe();
  const reader = api();
  const markers: boolean[] = [];
  const off = client.getQueryCache().subscribe((event) => {
    if (
      event.type === 'updated' &&
      event.action.type === 'success' &&
      event.action.manual
    )
      markers.push(client.isDiscussionUpdate);
  });
  await client.refreshDiscussions(reader, new Set(['i1']));
  expect(client.getQueryData(key)).toEqual({
    ...original,
    threads: [thread],
    threadsNextCursor: 'tc',
    activitiesNextCursor: 'ac',
  });
  expect(read).toHaveBeenCalledTimes(1);
  expect(reader.threads).toHaveBeenCalledWith('i1');
  expect(markers).toEqual([true]);
  expect(client.isDiscussionUpdate).toBe(false);
  await client.invalidateQueries({ queryKey: key, exact: true });
  expect(read).toHaveBeenCalledTimes(2);
  off();
  stop();
});

it('follows a concurrent local write instead of overwriting it with a stale partial read', async () => {
  const { stop } = await observe();
  const pending =
    Promise.withResolvers<
      Awaited<ReturnType<ReturnType<typeof api>['threads']>>
    >();
  const reader = api();
  reader.threads.mockImplementationOnce(() => pending.promise);
  const work = client.refreshDiscussions(reader, new Set(['i1']));
  await vi.waitFor(() => expect(reader.threads).toHaveBeenCalledTimes(1));
  client.setQueryData(key, { ...original, revision: 8 });
  pending.resolve({ data: [], nextCursor: null });
  await work;
  expect(reader.threads).toHaveBeenCalledTimes(2);
  expect(client.getQueryData(key)).toMatchObject({
    revision: 8,
    threads: [thread],
  });
  stop();
});

it('uses ordinary snapshot recovery after a refused partial read', async () => {
  const { read, stop } = await observe();
  const reader = api();
  reader.threads.mockRejectedValueOnce(new Error('Forbidden'));
  await client.refreshDiscussions(reader, new Set(['i1']));
  expect(read).toHaveBeenCalledTimes(2);
  expect(client.isDiscussionUpdate).toBe(false);
  stop();
});
