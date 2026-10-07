// @vitest-environment node
import path from 'node:path';
import { createMigrator, type MigrationSource } from '@nocobase/db';
import {
  createTestDatabase,
  describeMigration,
  inspectCollection,
} from '@nocobase/app-testing/server';
import { expect, it } from 'vitest';

const sources: readonly MigrationSource[] = [
  {
    packageName: 'articles-test',
    directory: path.resolve(
      import.meta.dirname,
      '../../database/main/migrations',
    ),
  },
];

describeMigration('202609080001_create_articles', {
  sources,
  up: async ({ expectCollection }) => {
    const articles = await expectCollection('articles').toExist();
    expect(Object.keys(articles.fields)).toEqual([
      'id',
      'title',
      'summary',
      'content',
      'status',
      'publishedAt',
      'createdAt',
      'updatedAt',
    ]);
    expect(articles.primaryKey).toEqual(['id']);
    await expectCollection('articles').toHaveField('title', {
      type: 'string',
      nullable: false,
    });
    await expectCollection('articles').toHaveField('content', {
      type: 'text',
    });
    await expectCollection('articles').toHaveField('publishedAt', {
      nullable: true,
    });
    await expectCollection('articles').toHaveIndex(['status', 'publishedAt']);
    await expectCollection('articles').toHaveIndex(['createdAt']);
  },
  down: async ({ expectCollection }) => {
    await expectCollection('articles').not.toExist();
  },
});

it('applies article defaults, preserves migration history and metadata, and reverses the schema', async () => {
  const testDatabase = await createTestDatabase();
  try {
    const { database, connection } = testDatabase;
    const migrator = createMigrator({ database, sources });
    await migrator.upTo('202609080001_create_articles');
    const timestamp = new Date('2026-09-08T00:00:00Z');
    // `content` is given: its default lives in the table on most dialects, but OceanBase keeps none on a TEXT column
    // and leaves it to the Repository, so this insert, below the Repository, checks only the portable defaults.
    await database
      .query()
      .insertInto('articles')
      .values({
        title: 'First article',
        content: '',
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .execute();
    expect(
      await database
        .query()
        .selectFrom('articles')
        .selectAll()
        .executeTakeFirst(),
    ).toMatchObject({
      title: 'First article',
      status: 'draft',
      publishedAt: null,
    });
    await expect(
      database
        .query()
        .insertInto('articles')
        .values({ createdAt: timestamp, updatedAt: timestamp })
        .execute(),
    ).rejects.toThrow();
    await expect(
      migrator.upTo('202609080001_create_articles'),
    ).resolves.toMatchObject({ executed: [] });
    const metadata = await connection.collectionMetadata.get('articles');
    expect(metadata?.document).toMatchObject({
      name: 'articles',
      title: '文章',
    });
    await migrator.rollback();
    expect(await inspectCollection(connection, 'articles')).toBeUndefined();
    expect(
      await connection.collections.getPhysical('articles'),
    ).toBeUndefined();
    expect(await connection.collectionMetadata.get('articles')).toBeUndefined();
  } finally {
    await testDatabase.destroy();
  }
});
