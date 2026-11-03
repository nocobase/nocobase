import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { createHarness, openDatabase, type Harness } from './harness.js';

const TABLES = [
  'agAgents',
  'agAgentUsers',
  'agAgentChanges',
  'agRuns',
  'agRunInputs',
  'agRunEvents',
  'agRunUsage',
  'agRunTokens',
  'agRunRepos',
  'agSessions',
  'agRunBriefs',
  'agWorkspaceResets',
  'agSecrets',
  'agSecretAudits',
  'agRunnerVariables',
  'agSkills',
  'agSkillVersions',
  'agSkillAttachments',
  'agSkillBlobs',
  'agConversations',
  'agConversationMessages',
  'agChatPreferences',
  'agSettings',
  'agModelServices',
  'agModelUsage',
  'agVectorIndexes',
  'agVectorEntries',
  'agRunners',
  'agRegistrationTokens',
  'agDownloadTokens',
];

describe('database', () => {
  let harness: Harness | undefined;
  afterEach(async () => {
    await harness?.close();
    harness = undefined;
  });

  it('creates every collection and rolls them back', async () => {
    harness = await createHarness();
    const collections = harness.database.connection().collections;
    const missing: string[] = [];
    for (const name of TABLES)
      if (!(await collections.get(name))) missing.push(name);
    expect(missing).toEqual([]);
    expect(
      (await collections.get('agRuns'))?.fields.map((field) => field.name),
    ).toEqual(
      expect.arrayContaining([
        'agent',
        'claimFailures',
        'availableAt',
        'directoryKey',
        'parentRunId',
        'tool',
        'modelService',
        'model',
        'effort',
      ]),
    );
    const agentFields =
      (await collections.get('agAgents'))?.fields.map((field) => field.name) ??
      [];
    expect(agentFields).toEqual(
      expect.arrayContaining([
        'modelEntries',
        'source',
        'status',
        'tool',
        'model',
        'lastReportedAt',
        'deletedAt',
      ]),
    );
    expect(agentFields).not.toContain('modelService');
    expect(agentFields).not.toContain('reasoningEffort');
    expect(
      (await collections.get('agConversations'))?.fields.map(
        (field) => field.name,
      ),
    ).toEqual(expect.arrayContaining(['modelService', 'model']));

    await harness.database
      .createMigrator({
        directory: path.resolve(import.meta.dirname, '../database/migrations'),
        packageName: '@nocobase/app-plugin-agents',
      })
      .rollback();
    const left: string[] = [];
    for (const name of TABLES) if (await collections.get(name)) left.push(name);
    expect(left).toEqual([]);
  });

  it('preserves legacy vector metadata and queued text when upgrading', async () => {
    const { database, drop } = await openDatabase();
    try {
      const migrator = database.createMigrator({
        directory: path.resolve(import.meta.dirname, '../database/migrations'),
        packageName: '@nocobase/app-plugin-agents',
      });
      await migrator.upTo('202610020011_ag_create_vectors');
      const connection = database.connection();
      const indexes = connection.repository('agVectorIndexes');
      const entries = connection.repository('agVectorEntries');
      const now = new Date(0).toISOString();
      await indexes.createOne({
        values: {
          name: 'legacy-fixture',
          collection: 'fixture',
          storeType: 'sqlite-vec',
          storeTarget: 'storage/vectors.sqlite',
          modelService: 'fixture',
          model: 'embed',
          dimension: 3,
          metric: 'cosine',
          status: 'ready',
          createdAt: now,
        },
      });
      await entries.createOne({
        values: {
          id: 'legacy-entry',
          indexName: 'legacy-fixture',
          itemId: 'doc',
          hash: 'fixture-hash',
          text: 'Synthetic queued source',
          metadata: {},
          state: 'pending',
          updatedAt: now,
        },
      });
      const before = {
        indexes: await indexes.findMany({}),
        entries: await entries.findMany({}),
      };
      await migrator.latest();
      expect(await indexes.findMany({})).toEqual(before.indexes);
      expect(await entries.findMany({})).toEqual(before.entries);
    } finally {
      await drop();
    }
  });

  it('adds the product runners report, and removes it again', async () => {
    const { database, drop } = await openDatabase();
    try {
      const migrator = database.createMigrator({
        directory: path.resolve(import.meta.dirname, '../database/migrations'),
        packageName: '@nocobase/app-plugin-agents',
      });
      const fields = async () =>
        (await database.connection().collections.get('agRunners'))?.fields.map(
          (field) => field.name,
        ) ?? [];
      await migrator.upTo('202610020011_ag_create_vectors');
      expect(await fields()).not.toContain('product');
      await migrator.upTo('202610060001_ag_add_runner_product');
      expect(await fields()).toContain('product');
      expect((await migrator.rollback()).rolledBack).toEqual([
        '202610060001_ag_add_runner_product',
      ]);
      expect(await fields()).not.toContain('product');
      await migrator.latest();
      expect(await fields()).toContain('product');
    } finally {
      await drop();
    }
  });
});
