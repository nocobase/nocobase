// @vitest-environment node
import type { IssueListItem } from '@nocobase/app-plugin-projects/shared/issues';
import { describe, expect, it } from 'vitest';

import { issueTableRow } from '../../client/issues/rows.js';

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
