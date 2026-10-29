// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';
import packageMetadata from '../package.json' with { type: 'json' };

const names = [
  'kbIndexingSettings',
  'kbIndexGenerations',
  'kbIndexSources',
  'kbIndexWork',
  'kbIndexRequests',
];
describeMigration('202610210010_kb_create_indexing', {
  sources: [
    {
      packageName: packageMetadata.name,
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
    },
  ],
  async up({ database, expectCollection }) {
    for (const name of names) await expectCollection(name).toExist();
    await expectCollection('kbIndexingSettings').toHaveField('revision', {
      type: 'bigInt',
      nullable: false,
    });
    await expectCollection('kbIndexSources').toHaveField(
      'forceEmbeddingRevision',
      { type: 'bigInt', nullable: false },
    );
    await expectCollection('kbIndexWork').toHaveField('wantedRevision', {
      type: 'bigInt',
      nullable: false,
    });
    const rows = await database
      .connection()
      .repository('kbIndexingSettings')
      .findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: 'global',
      config: null,
      activeGenerationId: null,
      buildingGenerationId: null,
    });
    expect(String(rows[0]?.revision)).toBe('0');
    expect(rows[0]?.namespace).toMatch(/^[0-9a-f-]{36}$/);
    const fields = (
      await database.connection().collections.get('kbIndexWork')
    )?.fields.map((field) => field.name);
    expect(fields).not.toEqual(expect.arrayContaining(['leaseToken']));
    expect(fields).not.toContain('attempt');
    expect(fields).not.toContain('nextAttemptAt');
  },
  async down({ expectCollection }) {
    for (const name of names) await expectCollection(name).not.toExist();
    await expectCollection('kbDocs').toExist();
  },
});
