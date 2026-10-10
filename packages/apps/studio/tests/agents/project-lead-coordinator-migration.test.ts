// @vitest-environment node
/**
 * The project lead becomes a coordinator on an installed database: lighter explicit models, no pull request or preview
 * actions, new instructions and description; and every unfinished issue it executes goes to the senior developer,
 * without waking anything. Rolling back restores the agent's configuration and leaves the issues where they are.
 */
import { createRequire } from 'node:module';
import path from 'node:path';

import { describeMigration } from '@nocobase/app-testing/server';
import type { MigrationSource } from '@nocobase/db';
import { expect } from 'vitest';

const require = createRequire(import.meta.url);
const pluginMigrations = (name: string): MigrationSource => ({
  packageName: name,
  directory: path.join(
    path.dirname(require.resolve(`${name}/package.json`)),
    'database/migrations',
  ),
});

const sources: readonly MigrationSource[] = [
  {
    packageName: 'studio-project-lead-coordinator-test',
    directory: path.resolve(
      import.meta.dirname,
      '../../database/main/migrations',
    ),
  },
  // The users the projects plugin's collections refer to, and the permission sets.
  pluginMigrations('@nocobase/app-plugin-authentication'),
  pluginMigrations('@nocobase/app-plugin-authorization'),
  pluginMigrations('@nocobase/app-plugin-agents'),
  pluginMigrations('@nocobase/app-plugin-projects'),
];

const LEAD = 'studio-project-lead';
const SENIOR = 'studio-senior-developer';
const OLD_ACTIONS = [
  'pm.issues/view',
  'pm.issues/edit',
  'studio.git/open-pr',
  'studio.previews/manage',
  'studio.reports/read',
];

/** An issue id as long as an id may be (a key from another system, say): its activity line's id still fits. */
const LONG_ID = `i9${'x'.repeat(62)}`;

/** How many times `up` has been checked: the first application, then the one after the rollback. */
let applied = 0;

const json = (value: unknown): unknown =>
  typeof value === 'string' ? JSON.parse(value) : value;

describeMigration('202610100030_studio_project_lead_coordinator', {
  sources,
  before: async ({ connection }) => {
    const query = connection.query;
    const now = new Date();
    await query
      .insertInto('agAgents')
      .values({
        id: LEAD,
        name: 'Project lead',
        type: 'runner',
        modelEntries: JSON.stringify([
          { tool: 'claude', model: null, effort: null },
          { tool: 'codex', model: null, effort: null },
        ]),
        instructions: 'Old instructions.',
        description: 'Old description.',
        ownerUserId: 'root-1',
        actions: JSON.stringify(OLD_ACTIONS),
        revision: 1,
        createdAt: now,
        updatedAt: now,
      } as never)
      .execute();
    const states = (shipped: string) => [
      { key: 'todo', name: 'Todo', category: 'unstarted', color: 'blue' },
      {
        key: 'in_progress',
        name: 'In progress',
        category: 'started',
        color: 'blue',
      },
      { key: shipped, name: 'Shipped', category: 'done', color: 'green' },
      {
        key: 'cancelled',
        name: 'Cancelled',
        category: 'closed',
        color: 'gray',
      },
    ];
    await query
      .insertInto('pmWorkflows')
      .values([
        {
          id: 'w-default',
          name: 'Default',
          isDefault: true,
          definition: JSON.stringify({
            states: states('done'),
            transitions: [],
          }),
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'w-custom',
          name: 'Custom',
          isDefault: false,
          definition: JSON.stringify({
            states: states('shipped'),
            transitions: [],
          }),
          createdAt: now,
          updatedAt: now,
        },
      ] as never)
      .execute();
    await query
      .insertInto('pmProjects')
      .values({
        id: 'p-custom',
        name: 'Custom',
        workflowId: 'w-custom',
        createdAt: now,
        updatedAt: now,
      } as never)
      .execute();
    const issue = (
      id: string,
      statusKey: string,
      extra: Record<string, unknown> = {},
    ) => ({
      id,
      number: Number.parseInt(id.slice(1), 10),
      identifier: `PM-${Number.parseInt(id.slice(1), 10)}`,
      title: id,
      description: '',
      statusKey,
      ownerUserId: 'u1',
      executorType: 'agent',
      executorId: LEAD,
      revision: 1,
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
      ...extra,
    });
    await query
      .insertInto('pmIssues')
      .values([
        // Unfinished, in the default workflow: moves.
        issue('i1', 'in_progress'),
        issue('i2', 'todo'),
        // Finished in the default workflow: stays.
        issue('i3', 'done'),
        issue('i4', 'cancelled'),
        // In a project whose workflow finishes in `shipped`: finished there, so it stays; its In progress moves.
        issue('i5', 'shipped', { projectId: 'p-custom' }),
        issue('i6', 'in_progress', { projectId: 'p-custom' }),
        // Another executor, and a deleted issue: stay.
        issue('i7', 'in_progress', { executorId: 'someone-else' }),
        issue('i8', 'in_progress', { deletedAt: now }),
        issue(LONG_ID, 'in_progress'),
      ] as never)
      .execute();
    const run = (
      id: string,
      agentId: string,
      issueId: string,
      status: string,
    ) => ({
      id,
      agentId,
      agentType: 'runner',
      status,
      subjectKind: 'issue',
      subjectId: issueId,
      threadScope: issueId,
      actorUserId: 'u1',
      createdAt: now,
      updatedAt: now,
    });
    await query
      .insertInto('agRuns')
      .values([
        // The project lead's queued run on a moved issue is withdrawn; its running one goes on.
        run('r-queued', LEAD, 'i1', 'queued'),
        run('r-running', LEAD, 'i2', 'running'),
        // Queued on a finished issue it keeps, or another agent's: left alone.
        run('r-kept', LEAD, 'i3', 'queued'),
        run('r-other', 'someone-else', 'i1', 'queued'),
      ] as never)
      .execute();
  },
  up: async ({ connection }) => {
    const query = connection.query;
    const lead = await query
      .selectFrom('agAgents')
      .selectAll()
      .where('id', '=', LEAD)
      .executeTakeFirstOrThrow();
    expect(json(lead.modelEntries)).toEqual([
      { tool: 'claude', model: 'claude-sonnet-5', effort: 'medium' },
      { tool: 'codex', model: 'gpt-6-luna', effort: 'medium' },
    ]);
    expect(json(lead.actions)).toEqual([
      'pm.issues/view',
      'pm.issues/edit',
      'studio.reports/read',
    ]);
    expect(lead.instructions).toContain('you do not write code yourself');
    expect(lead.instructions).not.toContain('pull request');
    expect(lead.description).toContain('coordinates who does them');
    expect(Number(lead.revision)).toBeGreaterThan(1);
    expect(
      await query
        .selectFrom('agAgentChanges')
        .select(['action'])
        .where('agentId', '=', LEAD)
        .execute(),
    ).toEqual([{ action: 'updated' }]);

    const executors = Object.fromEntries(
      (
        await query
          .selectFrom('pmIssues')
          .select(['id', 'executorId'])
          .orderBy('id')
          .execute()
      ).map((row) => [row.id, row.executorId]),
    );
    expect(executors).toEqual({
      i1: SENIOR,
      i2: SENIOR,
      i3: LEAD,
      i4: LEAD,
      i5: LEAD,
      i6: SENIOR,
      i7: 'someone-else',
      i8: LEAD,
      [LONG_ID]: SENIOR,
    });
    const statuses = Object.fromEntries(
      (
        await query
          .selectFrom('agRuns')
          .select(['id', 'status', 'failureReason'])
          .execute()
      ).map((row) => [row.id, [row.status, row.failureReason]]),
    );
    expect(statuses).toEqual({
      'r-queued': ['cancelled', 'cancelled'],
      'r-running': ['running', null],
      'r-kept': ['queued', null],
      'r-other': ['queued', null],
    });
    // A system line on each moved issue's activity, the first time: the rollback removes them, and applied again the
    // migration has no issue of the project lead's left to move.
    applied += 1;
    const lines = await query
      .selectFrom('pmActivities')
      .select(['id', 'issueId', 'actorType', 'action', 'details'])
      .orderBy('issueId')
      .execute();
    if (applied > 1) {
      expect(lines).toEqual([]);
      return;
    }
    expect(
      lines.map((line) => [line.issueId, line.actorType, line.action]),
    ).toEqual([
      ['i1', 'system', 'executor_changed'],
      ['i2', 'system', 'executor_changed'],
      ['i6', 'system', 'executor_changed'],
      [LONG_ID, 'system', 'executor_changed'],
    ]);
    for (const line of lines)
      expect(String(line.id).length).toBeLessThanOrEqual(64);
    expect(json(lines[0]!.details)).toEqual({
      from: { type: 'agent', id: LEAD },
      to: { type: 'agent', id: SENIOR },
    });
  },
  down: async ({ connection }) => {
    const query = connection.query;
    const lead = await query
      .selectFrom('agAgents')
      .selectAll()
      .where('id', '=', LEAD)
      .executeTakeFirstOrThrow();
    expect(json(lead.modelEntries)).toEqual([
      { tool: 'claude', model: null, effort: null },
      { tool: 'codex', model: null, effort: null },
    ]);
    expect([...(json(lead.actions) as string[])].sort()).toEqual(
      [...OLD_ACTIONS].sort(),
    );
    expect(lead.instructions).toContain('you write code yourself');
    // Which issues the project lead executed is not kept: they stay with the senior developer.
    const moved = await query
      .selectFrom('pmIssues')
      .select(['id'])
      .where('executorId', '=', SENIOR)
      .orderBy('id')
      .execute();
    expect(moved.map((row) => row.id)).toEqual(['i1', 'i2', 'i6', LONG_ID]);
    // The activity lines go, so applying it again writes no duplicate.
    expect(
      await query.selectFrom('pmActivities').select(['id']).execute(),
    ).toEqual([]);
  },
});
