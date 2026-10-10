// @vitest-environment node
import path from 'node:path';

import { describeMigration } from '@nocobase/app-testing/server';
import type { MigrationSource } from '@nocobase/db';
import { expect } from 'vitest';

const sources: readonly MigrationSource[] = [
  {
    packageName: '@nocobase/app-plugin-projects',
    directory: path.resolve(
      import.meta.dirname,
      '../fixtures/projects-activities',
    ),
  },
  {
    packageName: '@nocobase/studio',
    directory: path.resolve(
      import.meta.dirname,
      '../../database/main/migrations',
    ),
  },
];

const notice = (ns: string) => ({
  statusKey: 'in_review',
  ownerUserId: '1',
  message: {
    key: 'studioAgents.templateMessages.inReview',
    ns,
    defaultValue: 'Review',
  },
});

const rows = [
  { id: 'notified', action: 'owner_notified', details: notice('studio') },
  {
    id: 'other-namespace',
    action: 'owner_notified',
    details: notice('projects'),
  },
  // Another action is left as it is, even when it names the namespace.
  { id: 'other-action', action: 'commented', details: notice('studio') },
];

async function details(
  connection: Parameters<
    NonNullable<Parameters<typeof describeMigration>[1]['up']>
  >[0]['connection'],
): Promise<Record<string, unknown>> {
  const stored = await connection.query
    .selectFrom('pmActivities')
    .select(['id', 'details'])
    .execute();
  return Object.fromEntries(
    stored.map((row) => [
      row.id,
      typeof row.details === 'string' ? JSON.parse(row.details) : row.details,
    ]),
  );
}

describeMigration('202610220020_studio_rename_activity_namespace', {
  sources,
  before: async ({ connection }) => {
    await connection.query.insertInto('pmActivities').values(rows).execute();
  },
  up: async ({ connection }) => {
    expect(await details(connection)).toEqual({
      notified: notice('@nocobase/studio'),
      'other-namespace': notice('projects'),
      'other-action': notice('studio'),
    });
  },
  down: async ({ connection }) => {
    expect(await details(connection)).toEqual({
      notified: notice('studio'),
      'other-namespace': notice('projects'),
      'other-action': notice('studio'),
    });
  },
});
