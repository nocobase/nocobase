import { cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { StatusDefinition } from '../../shared/issues.js';
import type { SubtaskSummary } from '../../shared/subtasks.js';
import { groupSubtasksByStage } from '../../client/pages/issues/detail/subtask-model.js';
import { clientMocks } from './fake-client.js';

vi.mock('@nocobase/app-client', () => clientMocks.appClient());
vi.mock('@nocobase/i18n/client', () => clientMocks.i18n());
vi.mock('@nocobase/app-plugin-authorization/client', () =>
  clientMocks.authorization(),
);

afterEach(cleanup);

const backlog: StatusDefinition = {
  key: 'backlog',
  name: 'Backlog',
  category: 'unstarted',
  color: 'gray',
};
const done: StatusDefinition = {
  key: 'done',
  name: 'Done',
  category: 'done',
  color: 'green',
};

function subtask(
  number: number,
  overrides: Partial<SubtaskSummary> = {},
): SubtaskSummary {
  return {
    id: `s${number}`,
    identifier: `PM-${number}`,
    title: `Sub-issue ${number}`,
    status: backlog,
    stage: null,
    executor: null,
    executorName: null,
    blockedCount: 0,
    terminal: false,
    ...overrides,
  };
}

describe('sub-issues on an issue', () => {
  it('groups sub-issues by stage, lowest first and those without a stage last', () => {
    const groups = groupSubtasksByStage([
      subtask(1, { stage: 2 }),
      subtask(2),
      subtask(3, { stage: 1, status: done, terminal: true }),
      subtask(4, { stage: 1 }),
    ]);
    expect(groups.map((group) => group.stage)).toEqual([1, 2, null]);
    expect(groups[0]).toMatchObject({ done: 1 });
    expect(groups[0].subtasks.map((item) => item.id)).toEqual(['s3', 's4']);
  });
});
