import { cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { StatusDefinition } from '../../shared/issues.js';
import type { SubtaskSummary } from '../../shared/subtasks.js';
import {
  BUILTIN_STATUSES,
  type WorkflowDefinition,
} from '../../shared/workflows.js';
import {
  actorsAt,
  autoMoveAt,
  explicitEdges,
  eventEdges,
  setActorsAt,
  setAutoMove,
  transitionCell,
  workflowRules,
} from '../../client/pages/config/workflows/workflow-model.js';
import { groupSubtasksByStage } from '../../client/pages/issues/detail/subtask-model.js';
import { clientMocks } from './fake-client.js';

vi.mock('@nocobase/app-client', () => clientMocks.appClient());
vi.mock('@nocobase/i18n/client', () => clientMocks.i18n());
vi.mock('@nocobase/app-plugin-authorization/client', () =>
  clientMocks.authorization(),
);

afterEach(cleanup);

const todo: StatusDefinition = {
  key: 'todo',
  name: 'Todo',
  category: 'unstarted',
  color: 'blue',
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
    status: todo,
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

describe('moves the system makes when sub-issues finish', () => {
  const definition: WorkflowDefinition = {
    states: BUILTIN_STATUSES,
    transitions: [
      { from: '*', to: '*', actors: ['user'] },
      {
        from: 'in_progress',
        to: 'in_review',
        actors: ['system'],
        on: 'subtasks.done',
      },
    ],
  };

  it('keeps event transitions out of the matrix, the people and the edges', () => {
    expect(actorsAt(definition, 'in_progress', 'in_review')).toEqual([]);
    expect(
      transitionCell(definition.transitions, 'in_progress', 'in_review'),
    ).toEqual({ actors: ['user'], approval: null });
    expect(explicitEdges(definition)).toEqual([]);
    expect(eventEdges(definition)).toEqual([
      { from: 'in_progress', to: 'in_review', event: 'subtasks.done' },
    ]);
  });

  it('leaves the event transition alone when people are set for the same pair', () => {
    const next = setActorsAt(definition, 'in_progress', 'in_review', ['user']);
    expect(next.transitions).toHaveLength(3);
    expect(autoMoveAt(next, 'in_progress', 'subtasks.done')).toBe('in_review');
    const cleared = setActorsAt(next, 'in_progress', 'in_review', []);
    expect(autoMoveAt(cleared, 'in_progress', 'subtasks.done')).toBe(
      'in_review',
    );
  });

  it('sets, changes and removes the move, and states it as a rule', () => {
    const changed = setAutoMove(
      definition,
      'in_progress',
      'subtasks.done',
      'done',
    );
    expect(changed.transitions).toContainEqual({
      from: 'in_progress',
      to: 'done',
      actors: ['system'],
      on: 'subtasks.done',
    });
    expect(changed.transitions).toHaveLength(2);
    expect(workflowRules(changed)).toContainEqual({
      kind: 'autoMove',
      from: 'in_progress',
      to: 'done',
      event: 'subtasks.done',
    });
    const removed = setAutoMove(changed, 'in_progress', 'subtasks.done', null);
    expect(autoMoveAt(removed, 'in_progress', 'subtasks.done')).toBeNull();
    expect(removed.transitions).toEqual([
      { from: '*', to: '*', actors: ['user'] },
    ]);
  });
});
