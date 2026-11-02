import { afterEach, expect, it, vi } from 'vitest';
import { createHarness, type Harness } from './harness.js';
import {
  historicalPageContext,
  latestPageContext,
} from '../server/core/conversations/page-context.js';
let h: Harness;
afterEach(async () => h?.close());
it('batches kinds, deduplicates and budgets after current refs, and strips resolver extras', async () => {
  h = await createHarness();
  const kinds = h.services.conversations.contextKinds;
  const resolve = vi.fn(
    async (_conn, _user, ids: readonly string[]) =>
      new Map(
        ids.map((id) => [
          id,
          { title: 'T'.repeat(3000), key: 'SECRET_KEY', url: '/secret' },
        ]),
      ),
  );
  kinds.register('page', resolve);
  kinds.register('task', resolve);
  const items = [
    { kind: 'page', id: 'current' },
    { kind: 'page', id: 'a' },
    { kind: 'page', id: 'a' },
    { kind: 'task', id: 'b' },
    ...Array.from({ length: 20 }, (_, i) => ({ kind: 'page', id: String(i) })),
  ];
  const value = await historicalPageContext(
    kinds,
    h.services.tx.read(),
    'alice',
    {
      items,
      route: 'NEVER',
      selection: { text: 'NEVER' },
      filter: { secret: 'NEVER' },
    },
    {
      route: '/current',
      items: [
        { kind: 'page', id: 'current', title: 'Current', key: null, url: null },
      ],
      dropped: 0,
    },
  );
  expect(resolve).toHaveBeenCalledTimes(2);
  expect(resolve.mock.calls.map((call) => call[2])).toEqual([
    ['a', '0', '1', '2', '3', '4', '5'],
    ['b'],
  ]);
  const data = JSON.parse(value!.split('\n')[1]);
  expect(data.length).toBeLessThanOrEqual(9);
  expect(data[0].title).toHaveLength(2000);
  expect(value).not.toMatch(/SECRET|secret|NEVER/);
  expect(
    data.every(
      (item: object) => Object.keys(item).sort().join() === 'id,kind,title',
    ),
  ).toBe(true);
  expect(
    latestPageContext([
      { role: 'user', workContext: { items } },
      { role: 'assistant', workContext: { items } },
      { role: 'user', workContext: { items: [] } },
    ]),
  ).toEqual({ items: [] });
});
