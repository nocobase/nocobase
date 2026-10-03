import { describeMigration } from '@nocobase/db-testing/vitest';
import { createTestDatabase } from '@nocobase/db-testing';
import { describe, expect, it } from 'vitest';

import createMigration from '../database/migrations/202608260002_create_ai_employee.js';
import {
  aiEmployeeMigrations,
  authenticationMigrations,
} from './support/migrations.js';

const COLLECTIONS = [
  'aiEmployees',
  'aiMcpClients',
  'llmServices',
  'aiConversations',
  'aiMessages',
  'aiToolMessages',
  'aiFiles',
  'aiSettings',
  'aiUsageEvents',
  'usersAiEmployees',
  'lcCheckpoints',
  'lcCheckpointBlobs',
  'lcCheckpointWrites',
] as const;

// Rolling back also drops every collection in dependency-safe order: the
// rollback fails otherwise, and `down` checks that none is left.
describeMigration('202608260002_create_ai_employee', {
  sources: aiEmployeeMigrations,
  up: async ({ expectCollection }) => {
    for (const name of COLLECTIONS) await expectCollection(name).toExist();
    for (const [collection, field] of [
      ['aiEmployees', 'username'],
      ['aiEmployees', 'skillSettings'],
      ['aiEmployees', 'enabled'],
      ['aiConversations', 'sessionId'],
      ['aiMessages', 'messageId'],
      ['aiFiles', 'storageId'],
      ['lcCheckpointBlobs', 'blob'],
    ] as const) {
      await expectCollection(collection).toHaveField(field);
    }
  },
  down: async ({ expectCollection }) => {
    for (const name of COLLECTIONS) await expectCollection(name).not.toExist();
  },
});

describe('@nocobase/app-plugin-ai-employee database', () => {
  it('re-runs the schema migration safely', async () => {
    const { database, connection, destroy } = await createTestDatabase();
    try {
      // The `user` table the conversations reference has to exist first.
      await database
        .createMigrator({ sources: authenticationMigrations })
        .latest();
      const context = {
        builder: database.builder(),
        query: connection.query,
        connection,
      };
      await createMigration.up(context);

      // Every collection uses IF NOT EXISTS, so re-running the migration is safe.
      await expect(createMigration.up(context)).resolves.toBeUndefined();
    } finally {
      await destroy();
    }
  });
});
