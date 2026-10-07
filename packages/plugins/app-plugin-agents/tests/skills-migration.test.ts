/** The skills migration creates the library's tables, a version's manifest and the blobs, and rolls them back. */
import path from 'node:path';

import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import { afterEach, describe, expect, it } from 'vitest';

import skillsMigration from '../database/migrations/202610020005_ag_create_skills.js';

describe('the skills migration', () => {
  let testDatabase: TestDatabase | undefined;
  afterEach(async () => {
    await testDatabase?.destroy();
    testDatabase = undefined;
  });

  it('creates the skills, versions with manifests, blobs and attachments, and drops them', async () => {
    testDatabase = await createTestDatabase();
    const database = testDatabase.database;
    const migrator = database.createMigrator({
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
      packageName: '@nocobase/app-plugin-agents',
    });
    await migrator.latest();
    const conn = database.connection();
    const fields = async (name: string) =>
      (await conn.collections.get(name))?.fields.map((field) => field.name) ??
      [];
    expect(await fields('agSkillVersions')).toEqual(
      expect.arrayContaining(['manifest', 'contentHash', 'content']),
    );
    expect(await fields('agSkillVersions')).not.toContain('files');
    expect(await fields('agSkillBlobs')).toEqual(
      expect.arrayContaining([
        'hash',
        'size',
        'text',
        'createdAt',
        'lastUsedAt',
      ]),
    );

    const now = new Date().toISOString();
    await conn.repository('agSkills').createOne({
      values: {
        id: 's1',
        slug: 's1',
        name: 'S1',
        description: 'd',
        createdAt: now,
        updatedAt: now,
      },
    });
    const manifest = [
      {
        path: 'logo.png',
        blobHash: 'a'.repeat(64),
        size: 3,
        executable: false,
        text: false,
      },
    ];
    await conn.repository('agSkillVersions').createOne({
      values: {
        id: 'v1',
        skillId: 's1',
        version: 1,
        name: 'S1',
        description: 'd',
        content: '# S1',
        manifest,
        contentHash: 'b'.repeat(64),
        createdAt: now,
      },
    });
    await conn.repository('agSkillBlobs').createOne({
      values: {
        hash: 'a'.repeat(64),
        size: 3,
        createdAt: now,
        lastUsedAt: now,
      },
    });
    const version = await conn
      .repository<{ manifest: unknown }>('agSkillVersions')
      .findOne({ filter: { id: 'v1' } });
    expect(version?.manifest).toEqual(manifest);
    const blob = await conn
      .repository<{ text: boolean }>('agSkillBlobs')
      .findOne({ filter: { hash: 'a'.repeat(64) } });
    expect(Boolean(blob?.text)).toBe(false);

    expect(skillsMigration.name).toBe('202610020005_ag_create_skills');
    await migrator.rollback();
    for (const name of [
      'agSkills',
      'agSkillVersions',
      'agSkillBlobs',
      'agSkillAttachments',
    ])
      expect(await conn.collections.get(name)).toBeUndefined();
  });
});
