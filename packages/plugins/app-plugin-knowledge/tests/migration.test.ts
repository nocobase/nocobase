// @vitest-environment node
/** The plugin's migration creates every table with the access columns and entries, and rolls them back. */
import path from 'node:path';

import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import { afterEach, describe, expect, it } from 'vitest';

const TABLES = [
  'kbSpaces',
  'kbDocs',
  'kbDocVersions',
  'kbDocAccess',
  'kbChunks',
  'kbProposals',
  'kbFiles',
  'kbUploadTickets',
  'kbSnapshots',
];

describe('the knowledge migration', () => {
  let testDatabase: TestDatabase | undefined;
  afterEach(async () => {
    await testDatabase?.destroy();
    testDatabase = undefined;
  });

  it('creates the tables, the access columns and the entries, and rolls them back', async () => {
    testDatabase = await createTestDatabase();
    const database = testDatabase.database;
    const migrator = database.createMigrator({
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
      packageName: '@nocobase/app-plugin-knowledge',
    });
    await migrator.latest();
    const collections = database.connection().collections;
    const missing: string[] = [];
    for (const name of TABLES)
      if (!(await collections.get(name))) missing.push(name);
    expect(missing).toEqual([]);
    const fields = async (name: string) =>
      (await collections.get(name))?.fields.map((field) => field.name) ?? [];
    expect(await fields('kbDocs')).toEqual(
      expect.arrayContaining(['accessMode', 'aclKey']),
    );
    expect(await fields('kbChunks')).toEqual(
      expect.arrayContaining(['aclKey']),
    );
    expect(await fields('kbDocAccess')).toEqual(
      expect.arrayContaining([
        'docId',
        'spaceId',
        'subjectType',
        'subjectId',
        'level',
        'createdById',
        'createdAt',
      ]),
    );

    // A new entry inherits by default, and one subject is granted once per entry.
    const conn = database.connection();
    const now = new Date().toISOString();
    await conn.repository('kbSpaces').createOne({
      values: {
        id: 's1',
        scope: 'system',
        scopeId: '',
        createdAt: now,
        updatedAt: now,
      },
    });
    await conn.repository('kbDocs').createOne({
      values: {
        id: 'd1',
        spaceId: 's1',
        slug: 'd1',
        title: 'Doc',
        contentHash: '',
        createdAt: now,
        updatedByKind: 'user',
        updatedAt: now,
      },
    });
    expect(
      await conn.repository('kbDocs').findOne({ filter: { id: 'd1' } }),
    ).toMatchObject({ accessMode: 'inherit', aclKey: null });
    const entry = {
      docId: 'd1',
      spaceId: 's1',
      subjectType: 'user',
      subjectId: 'u1',
      level: 'read',
      createdAt: now,
    };
    await conn
      .repository('kbDocAccess')
      .createOne({ values: { id: 'e1', ...entry } });
    await expect(
      conn
        .repository('kbDocAccess')
        .createOne({ values: { id: 'e2', ...entry } }),
    ).rejects.toThrow();

    await migrator.rollback();
    const left: string[] = [];
    for (const name of TABLES) if (await collections.get(name)) left.push(name);
    expect(left).toEqual([]);
  });
});
