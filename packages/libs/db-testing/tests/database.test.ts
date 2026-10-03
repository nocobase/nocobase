import { InMemoryCollectionMetadataStore } from '@nocobase/db';
import { describe, expect, it } from 'vitest';
import {
  createTestDatabase,
  inspectCollection,
  provisionTestDatabases,
  testDatabaseDialect,
} from '../src/index.js';
import { migrations, seeds } from './fixtures/sources.js';

describe('createTestDatabase', () => {
  it('opens migrated and seeded databases and destroys them again', async () => {
    const testDatabase = await createTestDatabase({ migrations, seeds });
    try {
      expect(testDatabase.dialect).toBe(testDatabaseDialect());
      await expect(
        testDatabase.connection
          .repository('libraryAuthors')
          .findOne({ filter: { id: 'author-1' } }),
      ).resolves.toMatchObject({ name: 'Ada' });
    } finally {
      await testDatabase.destroy();
    }
  });

  it('reset leaves every connection empty', async () => {
    const testDatabase = await createTestDatabase({ migrations });
    try {
      await testDatabase.reset();
      await expect(
        inspectCollection(testDatabase.connection, 'libraryAuthors'),
      ).resolves.toBeUndefined();
    } finally {
      await testDatabase.destroy();
    }
  });

  it('reset empties a metadata store the caller supplies', async () => {
    const metadataStore = new InMemoryCollectionMetadataStore();
    const testDatabase = await createTestDatabase({
      migrations,
      metadataStore,
    });
    try {
      await expect(metadataStore.get('libraryAuthors')).resolves.toBeDefined();
      await testDatabase.reset();
      await expect(
        metadataStore.get('libraryAuthors'),
      ).resolves.toBeUndefined();
      await expect(
        inspectCollection(testDatabase.connection, 'libraryAuthors'),
      ).resolves.toBeUndefined();
      // The emptied database takes the migrations again, as a reused one has to.
      await testDatabase.migrate(migrations);
      await expect(metadataStore.get('libraryAuthors')).resolves.toBeDefined();
    } finally {
      await testDatabase.destroy();
    }
  });

  it('provisions one isolated database per named connection', async () => {
    const databases = await provisionTestDatabases({
      connections: ['main', 'external'],
    });
    try {
      const testDatabase = await databases.open({ migrations });
      try {
        await expect(
          inspectCollection(testDatabase.connection, 'libraryAuthors'),
        ).resolves.toBeDefined();
        await expect(
          inspectCollection(
            testDatabase.database.connection('external'),
            'libraryAuthors',
          ),
        ).resolves.toBeUndefined();
      } finally {
        await testDatabase.destroy();
      }
    } finally {
      await databases.drop();
    }
  });

  it('rejects duplicate connection names', async () => {
    await expect(
      provisionTestDatabases({ connections: ['main', 'main'] }),
    ).rejects.toThrow(/distinct names/);
  });
});

describe('inspectCollection', () => {
  it('describes the schema in Field and Collection names', async () => {
    const testDatabase = await createTestDatabase({ migrations });
    try {
      const books = await inspectCollection(
        testDatabase.connection,
        'libraryBooks',
      );
      expect(books).toMatchObject({
        name: 'libraryBooks',
        primaryKey: ['id'],
        fields: {
          title: { type: 'string', nullable: false },
          summary: { type: 'text', nullable: true },
          authorId: { type: 'string', nullable: false },
        },
      });
      expect(books?.fields).not.toHaveProperty('author');
      expect(books?.indexes).toContainEqual({
        fields: ['title'],
        unique: false,
      });
      expect(books?.foreignKeys).toEqual([
        expect.objectContaining({
          fields: ['authorId'],
          collection: 'libraryAuthors',
          referencedFields: ['id'],
          onDelete: 'restrict',
        }),
      ]);
      const authors = await inspectCollection(
        testDatabase.connection,
        'libraryAuthors',
      );
      expect(authors?.indexes).toEqual([{ fields: ['name'], unique: true }]);
    } finally {
      await testDatabase.destroy();
    }
  });
});
