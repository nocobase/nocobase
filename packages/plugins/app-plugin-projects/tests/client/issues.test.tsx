import { describe, expect, it, vi } from 'vitest';

import type { IssueListItem, StatusDefinition } from '../../shared/issues.js';
import { clientMocks, me } from './fake-client.js';

vi.mock('@nocobase/app-client', () => clientMocks.appClient());
vi.mock('@nocobase/i18n/client', () => clientMocks.i18n());
vi.mock('@nocobase/app-plugin-authorization/client', () =>
  clientMocks.authorization(),
);

const { buildBoardColumns, planBoardMove } =
  await import('../../client/pages/issues/board/board-model.js');

const STATUSES: StatusDefinition[] = [
  { key: 'todo', name: 'Todo', category: 'unstarted', color: 'blue' },
  {
    key: 'in_progress',
    name: 'In progress',
    category: 'started',
    color: 'yellow',
  },
  { key: 'done', name: 'Done', category: 'done', color: 'green' },
];

function issue(
  number: number,
  overrides: Partial<IssueListItem> = {},
): IssueListItem {
  return {
    id: `i${number}`,
    number,
    identifier: `PM-${number}`,
    title: `Issue ${number}`,
    description: '',
    statusKey: 'todo',
    priority: 'none',
    ownerUserId: 'u1',
    executor: { type: 'none', id: null },
    parentIssueId: null,
    projectId: null,
    startDate: null,
    dueDate: null,
    revision: 1,
    createdById: 'u1',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    lastActivityAt: '2026-09-01T00:00:00.000Z',
    deletedAt: null,
    owner: { id: 'u1', name: 'Ann' },
    executorName: null,
    project: null,
    labels: [],
    ...overrides,
  };
}

describe('moving cards on the board', () => {
  const groups = STATUSES.map((status) => ({
    status,
    issues: status.key === 'todo' ? [issue(1, { ownerUserId: 'u2' })] : [],
  }));

  it('shows a moved card in its target column while the change is on its way', () => {
    const columns = buildBoardColumns(groups, new Map([['i1', 'in_progress']]));
    expect(
      columns.map((column) => column.issues.map((item) => item.id)),
    ).toEqual([[], ['i1'], []]);
  });

  it('refuses to close an issue the viewer may not close, without asking the server', () => {
    const done = STATUSES[2];
    const card = groups[0]!.issues[0]!;
    expect(planBoardMove(card, done, me('member', 'u1'))).toEqual({
      kind: 'denied',
    });
    expect(planBoardMove(card, done, me('member', 'u2'))).toEqual({
      kind: 'patch',
      statusKey: 'done',
    });
    expect(planBoardMove(card, STATUSES[1], me('member', 'u1'))).toEqual({
      kind: 'patch',
      statusKey: 'in_progress',
    });
    expect(planBoardMove(card, STATUSES[0], me('member', 'u1'))).toEqual({
      kind: 'none',
    });
  });
});
