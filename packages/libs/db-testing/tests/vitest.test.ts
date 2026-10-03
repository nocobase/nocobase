import { describe, expect, it } from 'vitest';
import {
  createDatabaseTest,
  describeMigration,
  testDatabaseDialect,
  verifyMigration,
} from '../src/vitest.js';
import { leakyMigrations, migrations, seeds } from './fixtures/sources.js';

const test = createDatabaseTest({ migrations, seeds });

describe('createDatabaseTest with schema isolation', () => {
  test('gives each test the migrated and seeded schema', async ({
    connection,
    dialect,
    expectCollection,
  }) => {
    expect(dialect).toBe(testDatabaseDialect());
    await expectCollection('libraryAuthors').toHaveIndex(['name'], {
      unique: true,
    });
    await expectCollection('libraryBooks').toHaveField('title', {
      type: 'string',
      nullable: false,
      length: 255,
    });
    await expectCollection('libraryBooks').toHaveForeignKey(
      ['authorId'],
      'libraryAuthors',
      { onDelete: 'restrict' },
    );
    await expectCollection('libraryBooks').not.toHaveIndex(['summary']);
    await expectCollection('libraryLoans').not.toExist();
    await connection.repository('libraryAuthors').createOne({
      values: { id: 'author-2', name: 'Grace' },
    });
  });

  test('does not see rows an earlier test wrote', async ({ connection }) => {
    const authors = connection.repository('libraryAuthors');
    await expect(authors.count()).resolves.toBe(1);
    await expect(authors.exists({ filter: { id: 'author-1' } })).resolves.toBe(
      true,
    );
  });

  test('reports a missing expectation by Collection and Field', async ({
    expectCollection,
  }) => {
    await expect(
      expectCollection('libraryBooks').toHaveField('isbn'),
    ).rejects.toThrow(/Collection "libraryBooks" has no Field "isbn"/);
    await expect(expectCollection('libraryLoans').toExist()).rejects.toThrow(
      /Collection "libraryLoans" has no table/,
    );
  });
});

describeMigration('202601010002_library_create_books', {
  sources: migrations,
  up: async ({ expectCollection }) => {
    await expectCollection('libraryAuthors').toExist();
    await expectCollection('libraryBooks').toHaveForeignKey(
      ['authorId'],
      'libraryAuthors',
    );
  },
  down: async ({ expectCollection }) => {
    await expectCollection('libraryAuthors').toExist();
    await expectCollection('libraryBooks').not.toExist();
  },
});

describeMigration('202601010001_library_create_authors', {
  sources: migrations,
  up: async ({ expectCollection }) => {
    await expectCollection('libraryAuthors').toHaveIndex(['name'], {
      unique: true,
    });
  },
});

describe('verifyMigration', () => {
  it('fails a migration whose down leaves its table behind', async () => {
    await expect(
      verifyMigration('202601010001_library_leaky_down', {
        sources: leakyMigrations,
      }),
    ).rejects.toThrow(/the schema after rolling back/);
  });

  it('fails a migration whose down leaves the column it added behind', async () => {
    await expect(
      verifyMigration('202601010002_library_leaky_column', {
        sources: leakyMigrations,
      }),
    ).rejects.toThrow(/the schema after rolling back/);
  });

  it('fails a migration that is not in the sources', async () => {
    await expect(
      verifyMigration('202601019999_missing', { sources: migrations }),
    ).rejects.toThrow(/is not in the given sources/);
  });
});

describeMigration('202601010003_library_add_author_country', {
  sources: migrations,
  before: async ({ connection }) => {
    await connection.repository('libraryAuthors').createOne({
      values: { id: 'author-before', name: 'Edsger' },
    });
  },
  up: async ({ connection, expectCollection }) => {
    await expectCollection('libraryAuthors').toHaveField('country', {
      nullable: false,
    });
    await expect(
      connection
        .repository('libraryAuthors')
        .findOne({ filter: { id: 'author-before' } }),
    ).resolves.toMatchObject({ country: 'unknown' });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('libraryAuthors').not.toHaveField('country');
  },
});
