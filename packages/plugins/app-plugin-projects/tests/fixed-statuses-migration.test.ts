// @vitest-environment node
import { createRequire } from 'node:module';
import path from 'node:path';

import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

const require = createRequire(import.meta.url);

const now = new Date();

const workflow = (
  id: string,
  isDefault: boolean,
  states: readonly { key: string; category: string }[],
) => ({
  id,
  name: id,
  description: null,
  isDefault,
  builtInKey: null,
  definition: {
    states: states.map((state) => ({
      ...state,
      name: state.key,
      color: 'gray',
    })),
    transitions: [{ from: '*', to: '*', actors: ['user'] }],
  },
  createdAt: now,
  updatedAt: now,
});

const issue = (
  number: number,
  statusKey: string,
  projectId: string | null = null,
) => ({
  id: `issue-${number}`,
  number,
  identifier: `PM-${number}`,
  title: `Issue ${number}`,
  description: '',
  statusKey,
  priority: 'none',
  priorityRank: 4,
  ownerUserId: 'owner',
  projectId,
  lastActivityAt: now,
  createdAt: now,
  updatedAt: now,
});

/** Each issue's status after the migration, by its number. */
const EXPECTED: Readonly<Record<number, string>> = {
  1: 'backlog',
  2: 'in_progress',
  3: 'in_progress',
  4: 'in_progress',
  5: 'in_progress',
  6: 'blocked',
  7: 'in_review',
  8: 'in_review',
  9: 'done',
  10: 'cancelled',
  // Custom statuses: by their category in the project's workflow.
  11: 'in_progress',
  12: 'done',
  13: 'cancelled',
  // Without a project, the default workflow's category.
  14: 'in_progress',
  // A key no workflow defines.
  15: 'backlog',
};

describeMigration('202610240010_pm_fixed_statuses', {
  sources: [
    ...[
      '@nocobase/app-plugin-authentication',
      '@nocobase/app-plugin-authorization',
    ].map((packageName) => ({
      packageName,
      directory: path.join(
        path.dirname(require.resolve(`${packageName}/package.json`)),
        'database/migrations',
      ),
    })),
    {
      packageName: '@nocobase/app-plugin-projects',
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
    },
  ],
  before: async ({ connection }) => {
    await connection.repository('pmWorkflows').createMany({
      values: [
        workflow('default', true, [
          { key: 'backlog', category: 'unstarted' },
          { key: 'triage', category: 'started' },
        ]),
        workflow('custom', false, [
          { key: 'coding', category: 'started' },
          { key: 'shipped', category: 'done' },
          { key: 'dropped', category: 'closed' },
        ]),
      ],
    });
    await connection.repository('pmProjects').createOne({
      values: {
        id: 'project',
        name: 'Project',
        workflowId: 'custom',
        createdAt: now,
        updatedAt: now,
      },
    });
    await connection.repository('pmIssues').createMany({
      values: [
        issue(1, 'backlog'),
        issue(2, 'todo'),
        issue(3, 'analysis'),
        issue(4, 'proposal_review'),
        issue(5, 'in_progress'),
        issue(6, 'blocked'),
        issue(7, 'in_review'),
        issue(8, 'ui_review'),
        issue(9, 'done'),
        issue(10, 'cancelled'),
        issue(11, 'coding', 'project'),
        issue(12, 'shipped', 'project'),
        issue(13, 'dropped', 'project'),
        issue(14, 'triage'),
        issue(15, 'gone'),
      ],
    });
  },
  up: async ({ connection, expectCollection }) => {
    const rows = await connection
      .repository<{ number: number; statusKey: string }>('pmIssues')
      .findMany();
    expect(
      Object.fromEntries(rows.map((row) => [row.number, row.statusKey])),
    ).toEqual(EXPECTED);
    await expectCollection('pmWorkflows').not.toExist();
    await expectCollection('pmApprovalRequests').not.toExist();
    await expectCollection('pmIssueChecklistItems').not.toExist();
    await expectCollection('pmProjects').not.toHaveField('workflowId');
  },
  down: async ({ expectCollection }) => {
    await expectCollection('pmWorkflows').toExist();
    await expectCollection('pmApprovalRequests').toExist();
    await expectCollection('pmIssueChecklistItems').toExist();
    await expectCollection('pmProjects').toHaveField('workflowId');
  },
});
