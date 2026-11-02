import { InMemoryCollectionMetadataStore } from '@nocobase/db';
import { describe, expect, it } from 'vitest';
import type { TestDatabaseProvisioner } from '@nocobase/db/testing';
import {
  createTestDatabase,
  inspectCollection,
  loadTestDatabaseProvisioner,
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

describe('createTestDatabase with a template', () => {
  async function counted() {
    const real = await loadTestDatabaseProvisioner(testDatabaseDialect());
    const calls = { provision: 0, clone: 0 };
    const provisioner: TestDatabaseProvisioner = {
      dialect: real.dialect,
      capabilities: real.capabilities,
      provision: (options) => {
        calls.provision += 1;
        return real.provision(options);
      },
      ...(real.clone
        ? {
            clone: (options) => {
              calls.clone += 1;
              return real.clone!(options);
            },
          }
        : {}),
    };
    return { provisioner, calls, clones: Boolean(real.clone) };
  }

  it('gives each call an independent migrated and seeded copy, migrating once where the dialect copies', async () => {
    const { provisioner, calls, clones } = await counted();
    const first = await createTestDatabase({
      migrations,
      seeds,
      provisioner,
      template: true,
    });
    try {
      const second = await createTestDatabase({
        migrations,
        seeds,
        provisioner,
        template: true,
      });
      try {
        for (const database of [first, second])
          await expect(
            database.connection
              .repository('libraryAuthors')
              .findOne({ filter: { id: 'author-1' } }),
          ).resolves.toMatchObject({ name: 'Ada' });
        await first.connection
          .repository('libraryAuthors')
          .createOne({ values: { id: 'author-2', name: 'Grace' } });
        await expect(
          second.connection
            .repository('libraryAuthors')
            .findOne({ filter: { id: 'author-2' } }),
        ).resolves.toBeUndefined();
        // The migrations are recorded, so applying them again changes nothing.
        await second.migrate(migrations);
        expect(calls).toEqual(
          clones ? { provision: 1, clone: 2 } : { provision: 2, clone: 0 },
        );
      } finally {
        await second.destroy();
      }
    } finally {
      await first.destroy();
    }
  });

  it('migrates separately for different migrations', async () => {
    const { provisioner, calls, clones } = await counted();
    const migrated = await createTestDatabase({
      migrations,
      provisioner,
      template: true,
    });
    const empty = await createTestDatabase({ provisioner, template: true });
    try {
      await expect(
        inspectCollection(migrated.connection, 'libraryAuthors'),
      ).resolves.toBeDefined();
      await expect(
        inspectCollection(empty.connection, 'libraryAuthors'),
      ).resolves.toBeUndefined();
      expect(calls.provision).toBe(2);
      expect(calls.clone).toBe(clones ? 2 : 0);
    } finally {
      await migrated.destroy();
      await empty.destroy();
    }
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
