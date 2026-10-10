// @vitest-environment node
/** The tables of work a conversation delegated and the milestones reported back: created with their fields, dropped. */
import path from 'node:path';

import {
  describeMigration,
  type MigrationTestContext,
} from '@nocobase/app-testing/server';
import type { MigrationSource } from '@nocobase/db';
import { expect } from 'vitest';

const sources: readonly MigrationSource[] = [
  {
    packageName: 'studio',
    directory: path.resolve(
      import.meta.dirname,
      '../../database/main/migrations',
    ),
  },
];

const fields = async ({ connection }: MigrationTestContext, name: string) =>
  (await connection.collections.get(name))?.fields.map((field) => field.name);

// Creates studioDelegations and studioDelegationEvents, and its down drops them.
describeMigration('202610080010_studio_create_delegations', {
  sources,
  up: async (context) => {
    expect(await fields(context, 'studioDelegations')).toEqual(
      expect.arrayContaining([
        'id',
        'conversationId',
        'issueId',
        'agentId',
        'userId',
        'followed',
        'createdAt',
        'updatedAt',
      ]),
    );
    expect(await fields(context, 'studioDelegationEvents')).toEqual(
      expect.arrayContaining([
        'id',
        'delegationId',
        'conversationId',
        'key',
        'kind',
        'woke',
        'createdAt',
      ]),
    );
    await context.expectCollection('studioDelegations').toExist();
    await context.expectCollection('studioDelegationEvents').toExist();
  },
  down: async ({ connection, expectCollection }) => {
    expect(await connection.collections.get('studioDelegations')).toBeFalsy();
    expect(
      await connection.collections.get('studioDelegationEvents'),
    ).toBeFalsy();
    await expectCollection('studioDelegations').not.toExist();
    await expectCollection('studioDelegationEvents').not.toExist();
  },
});
