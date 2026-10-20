// @vitest-environment node
import path from 'node:path';

import { describeMigration } from '@nocobase/app-testing/server';
import type { MigrationSource } from '@nocobase/db';
import { expect } from 'vitest';

const sources: readonly MigrationSource[] = [
  {
    packageName: '@nocobase/app-plugin-agents',
    directory: path.resolve(import.meta.dirname, '../database/migrations'),
  },
];

/** A run as the runs migration left it, started by `actorUserId`. */
function runRow(id: string, actorUserId: string): Record<string, unknown> {
  const now = new Date('2026-10-01T00:00:00.000Z');
  return {
    id,
    agentId: 'agent',
    agentType: 'runner',
    status: 'completed',
    priority: 0,
    attempt: 1,
    maxAttempts: 3,
    subjectKind: 'sample',
    subjectId: '1',
    threadScope: 'main',
    actorUserId,
    requires: '[]',
    acceptsInput: false,
    claimFailures: 0,
    createdAt: now,
    updatedAt: now,
  };
}

describeMigration('202610090002_ag_create_run_requests', {
  sources,
  before: async ({ connection, expectCollection }) => {
    // Applications that already added per-tool runner slots must keep those fields through this migration and its rollback.
    await expectCollection('agRunners').toHaveField('toolSlots');
    await expectCollection('agRunners').toHaveField('load');
    await expectCollection('agRegistrationTokens').toHaveField('toolSlots');
    await connection.query
      .insertInto('agRuns')
      .values([
        runRow('r1', 'alice'),
        runRow('r2', 'bob'),
        runRow('r3', 'alice'),
      ])
      .execute();
  },
  up: async ({ connection, expectCollection }) => {
    const requests = expectCollection('agRunRequests');
    await requests.toExist();
    for (const field of [
      'id',
      'agentId',
      'subjectKind',
      'subjectId',
      'threadScope',
      'responsibleUserId',
      'requestedByUserId',
      'priority',
      'requires',
      'inputType',
      'inputActorKind',
      'inputActorId',
      'inputActorName',
      'inputText',
      'status',
      'expiresAt',
      'createdAt',
      'updatedAt',
    ])
      await requests.toHaveField(field, { nullable: false });
    for (const field of [
      'ownerUserId',
      'fireAt',
      'maxAttempts',
      'inputPayload',
      'settledById',
      'settledAt',
      'note',
      'runId',
      'supersededById',
    ])
      await requests.toHaveField(field, { nullable: true });
    await requests.toHaveIndex(['responsibleUserId', 'status']);
    await requests.toHaveIndex(['requestedByUserId', 'status']);
    await requests.toHaveIndex(['subjectKind', 'subjectId', 'status']);
    await requests.toHaveIndex(['status', 'expiresAt']);

    const runs = expectCollection('agRuns');
    await runs.toHaveField('requestedByUserId', { nullable: true });
    await runs.toHaveField('confirmedByUserId', { nullable: true });
    // Existing runs were started by the person they run as.
    const rows = await connection.query
      .selectFrom('agRuns')
      .select(['id', 'requestedByUserId', 'confirmedByUserId'])
      .orderBy('id', 'asc')
      .execute();
    expect(
      rows.map((row) => ({
        id: row.id,
        requestedByUserId: row.requestedByUserId,
        confirmedByUserId: row.confirmedByUserId ?? null,
      })),
    ).toEqual([
      { id: 'r1', requestedByUserId: 'alice', confirmedByUserId: null },
      { id: 'r2', requestedByUserId: 'bob', confirmedByUserId: null },
      { id: 'r3', requestedByUserId: 'alice', confirmedByUserId: null },
    ]);
  },
  down: async ({ expectCollection }) => {
    await expectCollection('agRunRequests').not.toExist();
    await expectCollection('agRuns').not.toHaveField('requestedByUserId');
    await expectCollection('agRuns').not.toHaveField('confirmedByUserId');
    await expectCollection('agRunners').toHaveField('toolSlots');
    await expectCollection('agRunners').toHaveField('load');
    await expectCollection('agRegistrationTokens').toHaveField('toolSlots');
  },
});
