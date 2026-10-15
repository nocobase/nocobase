/**
 * Fewer reads behind the task table and the issue pane: the first children pages of every parent expanded at once
 * are one request (`loadFirstChildren`), and the issue page polls its runs fast only after the viewer started work
 * there (`startsWork`), not after every announcement.
 */
import type { ApiClient } from '@nocobase/app-client';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { expect, it, vi } from 'vitest';

import { loadFirstChildren } from '../../client/issues/groups/api.js';
import { startsWork } from '../../client/pages/issues/detail/use-live-issue.js';
import type { TaskChildrenPages } from '../../shared/task-groups.js';

it('reads the first children pages asked for in one moment in one request', async () => {
  const request = vi.fn(
    async ({ query }: { query: Record<string, string> }) => ({
      data: {
        generation: query.generation,
        parents: query.parentIds!.split(',').map((parentId) => ({
          parentId,
          data: [],
          nextCursor: parentId === 'b' ? 'more' : null,
        })),
      } satisfies TaskChildrenPages,
    }),
  );
  const api = { request } as unknown as ApiClient;
  const query = { ownerUserId: 'alice', follow: 'scope' };
  const pages = await Promise.all(
    ['a', 'b', 'c'].map((id) => loadFirstChildren(api, query, 'g1', id)),
  );
  expect(request).toHaveBeenCalledOnce();
  expect(request.mock.calls[0]![0].query).toEqual({
    ...query,
    parentIds: 'a,b,c',
    generation: 'g1',
  });
  expect(pages.map((page) => page.nextCursor)).toEqual([null, 'more', null]);

  // Another moment, or another generation, is another request.
  await loadFirstChildren(api, query, 'g2', 'a');
  expect(request).toHaveBeenCalledTimes(2);
});

const detail = (patch: Partial<IssueDetail> = {}): IssueDetail =>
  ({
    id: 'i1',
    threads: [{ id: 't1', replies: [] }],
    executor: { type: 'user', id: 'alice' },
    ...patch,
  }) as unknown as IssueDetail;

it('speeds up the issue page only when the viewer wrote a comment or handed the issue to an agent', () => {
  expect(startsWork(detail(), detail())).toBe(false);
  expect(startsWork(undefined, detail())).toBe(false);
  // A comment or a reply.
  expect(
    startsWork(
      detail(),
      detail({ threads: [{ id: 't1', replies: [{ id: 'r1' }] }] as never }),
    ),
  ).toBe(true);
  // Handed to an agent, or from one agent to another.
  const agent = (id: string) => ({ type: 'agent', id }) as never;
  expect(startsWork(detail(), detail({ executor: agent('a1') }))).toBe(true);
  expect(
    startsWork(
      detail({ executor: agent('a1') }),
      detail({ executor: agent('a2') }),
    ),
  ).toBe(true);
  expect(
    startsWork(
      detail({ executor: agent('a1') }),
      detail({ executor: agent('a1') }),
    ),
  ).toBe(false);
  // Handed to a person.
  expect(
    startsWork(detail(), detail({ executor: { type: 'user', id: 'bob' } })),
  ).toBe(false);
});
