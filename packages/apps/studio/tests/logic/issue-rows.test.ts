// @vitest-environment node
import type { IssueListItem } from '@nocobase/app-plugin-projects/shared/issues';
import { describe, expect, it } from 'vitest';

import {
  issueTableRow,
  organizeIssueHierarchy,
} from '../../client/issues/rows.js';

describe('an issue as a row of the issue table', () => {
  it('names the status, colours it by its tone, and marks an agent executor', () => {
    const issue = {
      id: 'i1',
      identifier: 'PM-1',
      title: 'Stream exports',
      statusKey: 'in_review',
      priority: 'high',
      labels: [{ id: 'l1', name: 'export', color: 'purple' }],
      owner: { id: 'u1', name: 'Ada' },
      executor: { type: 'agent', id: 'a1' },
      executorName: 'Code Agent',
      updatedAt: '2026-10-03T10:00:00Z',
    } as unknown as IssueListItem;
    expect(
      issueTableRow(issue, undefined, {
        statusName: (_, key) => `status:${key}`,
        statusTone: () => 'violet',
      }),
    ).toEqual({
      id: 'i1',
      identifier: 'PM-1',
      title: 'Stream exports',
      labels: [{ id: 'l1', name: 'export', color: 'purple' }],
      status: { name: 'status:in_review', color: 'purple' },
      priority: 'high',
      owner: { name: 'Ada' },
      executor: { name: 'Code Agent', kind: 'agent' },
      updatedAt: '2026-10-03T10:00:00Z',
    });
  });
});

describe('loaded issue hierarchy', () => {
  const item = (id: string, parentIssueId: string | null = null) => ({
    id,
    parentIssueId,
  });
  const rows = (items: ReturnType<typeof item>[]) =>
    organizeIssueHierarchy(items).map(({ issue, depth }) => [issue.id, depth]);

  it('keeps root order and entire subtrees together even when children arrive first', () => {
    expect(
      rows([
        item('grandchild', 'child'),
        item('other'),
        item('child', 'parent'),
        item('parent'),
        item('sibling', 'parent'),
      ]),
    ).toEqual([
      ['other', 0],
      ['parent', 0],
      ['child', 1],
      ['grandchild', 2],
      ['sibling', 1],
    ]);
  });

  it.each([
    ['first', 'second'],
    ['second', 'first'],
  ])('retains the server sibling order %s, %s', (a, b) => {
    expect(
      rows([item(a, 'parent'), item(b, 'parent'), item('parent')]),
    ).toEqual([
      ['parent', 0],
      [a, 1],
      [b, 1],
    ]);
  });

  it('keeps filtered or unloaded parents absent and regroups when another page loads them', () => {
    const first = [item('child', 'parent'), item('grandchild', 'child')];
    expect(rows(first)).toEqual([
      ['child', 0],
      ['grandchild', 1],
    ]);
    expect(rows([...first, item('parent'), item('child', 'parent')])).toEqual([
      ['parent', 0],
      ['child', 1],
      ['grandchild', 2],
    ]);
    expect(rows([item('grandchild', 'missing'), item('ancestor')])).toEqual([
      ['grandchild', 0],
      ['ancestor', 0],
    ]);
  });

  it('outputs every id once for self references, cycles and duplicates in deterministic order', () => {
    const input = [
      item('a', 'b'),
      item('b', 'a'),
      item('c', 'b'),
      item('self', 'self'),
      item('a'),
    ];
    expect(rows(input)).toEqual([
      ['self', 0],
      ['a', 0],
      ['b', 1],
      ['c', 2],
    ]);
    expect(
      new Set(organizeIssueHierarchy(input).map(({ issue }) => issue.id)).size,
    ).toBe(4);
  });

  it('handles a deep loaded tree without recursive stack growth', () => {
    const input = Array.from({ length: 12000 }, (_, i) =>
      item(String(i), i ? String(i - 1) : null),
    );
    const result = organizeIssueHierarchy(input);
    expect(result).toHaveLength(input.length);
    expect(result.at(-1)?.depth).toBe(11999);
  });
});
