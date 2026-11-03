# Database example: records, constraints, transactions and isolation

Use `createDatabaseTest()` from `@nocobase/app-testing/server` for repository behavior that needs a real database but no application services or HTTP routes. It supplies a database manager, a default connection and schema assertions, runs the supplied migrations, and cleans up the test databases. This example covers create/read/update/delete, a unique constraint, transaction rollback and isolation between cases.

## Configure database tests

Use an existing NocoBase 3 application with `@nocobase/app-testing`, `@nocobase/db`, a compatible test dialect driver, `@nocobase/dev-config` and Vitest installed. The default dialect is SQLite. Create `vitest.database.config.ts` at the application root:

```ts
import { createNodeVitestConfig } from '@nocobase/dev-config/vitest/node';

export default createNodeVitestConfig({
  cacheDir: './storage/tests/vite-database',
  test: {
    include: ['tests/database/**/*.test.ts'],
    fileParallelism: false,
    passWithNoTests: false,
  },
});
```

The dedicated config selects Node and only these tests. If the application already has a Node test project, add the files to its discovery instead; preserve its existing setup and aliases. Run database suites sequentially.

## Prepare a small fixture

This example owns a synthetic `testingNotes` collection. Keep its migration under `tests/fixtures/` so it is not installed into the running application. When testing a real application collection, use its actual migration sources and prerequisite migrations instead of copying production migrations into the fixture. Application plugin providers and seeds are not discovered automatically by `createDatabaseTest()`; pass the migration and seed sources the test needs, or use `createAppTest()` when composition is what you need to verify.

Create `tests/fixtures/testing-notes/migrations/202610180001_testing_create_notes.ts`:

```ts
import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610180001_testing_create_notes',
  async up({ builder }) {
    await builder.createCollection('testingNotes', (collection) => {
      collection.string('id', { primaryKey: true, nullable: false });
      collection.string('title', { nullable: false });
      collection.unique(['title'], { mode: 'index' });
    });
  },
  async down({ builder }) {
    await builder.dropCollection('testingNotes');
  },
});

export default migration;
```

Create `tests/helpers/testing-notes.ts`. The application identity comes from its manifest, and paths resolve from this file rather than the shell's working directory:

```ts
import { fileURLToPath } from 'node:url';
import type { MigrationSource } from '@nocobase/db';
import packageMetadata from '../../package.json' with { type: 'json' };

export const noteMigrations: readonly MigrationSource[] = [
  {
    packageName: packageMetadata.name,
    directory: fileURLToPath(
      new URL('../fixtures/testing-notes/migrations/', import.meta.url),
    ),
  },
];
```

## Test the records

Create `tests/database/notes.test.ts`:

```ts
import { expect } from 'vitest';
import { createDatabaseTest } from '@nocobase/app-testing/server';
import { noteMigrations } from '../helpers/testing-notes.js';

const test = createDatabaseTest({ migrations: noteMigrations });

test('creates, reads, updates and deletes a note', async ({ connection }) => {
  const notes = connection.repository('testingNotes');

  await notes.createOne({
    values: { id: 'note-1', title: 'Draft' },
  });
  await notes.updateOne({
    filter: { id: 'note-1' },
    values: { title: 'Reviewed' },
  });

  await expect(
    notes.findOne({ filter: { id: 'note-1' } }),
  ).resolves.toMatchObject({ id: 'note-1', title: 'Reviewed' });
  await expect(notes.count()).resolves.toBe(1);

  await notes.deleteOne({ filter: { id: 'note-1' } });
  await expect(notes.count()).resolves.toBe(0);
});

test('rejects duplicate titles', async ({ connection }) => {
  const notes = connection.repository('testingNotes');

  await notes.createOne({
    values: { id: 'note-1', title: 'Review invoice' },
  });
  await expect(
    notes.createOne({
      values: { id: 'note-2', title: 'Review invoice' },
    }),
  ).rejects.toThrow();

  await expect(notes.count()).resolves.toBe(1);
});

test('rolls back every write when the operation fails', async ({
  database,
  connection,
}) => {
  await expect(
    database.transaction(async (transaction) => {
      const notes = transaction.repository('testingNotes');
      await notes.createOne({
        values: { id: 'note-1', title: 'First note' },
      });
      await notes.createOne({
        values: { id: 'note-2', title: 'Second note' },
      });
      throw new Error('Operation cancelled');
    }),
  ).rejects.toThrow('Operation cancelled');

  await expect(connection.repository('testingNotes').count()).resolves.toBe(0);
});

test('starts another case with an empty collection', async ({ connection }) => {
  await expect(connection.repository('testingNotes').count()).resolves.toBe(0);
});
```

Use the repository from the transaction callback for every write that must roll back; the ordinary connection's repository is not part of that transaction. Assert the data after failure rather than checking driver-specific error text. The unique-constraint test uses different IDs so the rejected write exercises the title index rather than the primary key.

The fixture defaults to `isolation: 'schema'`: it resets the databases and reapplies migrations and seeds before each case. The final case therefore starts empty regardless of test order. `isolation: 'none'` shares state for the file and is appropriate only for cases deliberately designed that way. For multiple connections, pass all names in `connections`; access a non-default one with `database.connection(name)`.

## Run and check

From the application root:

```bash
pnpm exec vitest run --config vitest.database.config.ts tests/database/notes.test.ts
```

Expect four passing cases. Run `pnpm exec vitest run --config vitest.database.config.ts` after adding the [migration test](migration.md) to run both files: four repository cases and one migration case.

For an installed PostgreSQL driver with its test server configured, select it without changing the test code:

```bash
NOCOBASE_TEST_DB_DIALECT=postgres pnpm exec vitest run --config vitest.database.config.ts
```

The PostgreSQL test driver reads `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD` and `POSTGRES_DATABASE` (or their `PG*` equivalents). Use a test database server where the provisioner can create and drop isolated schemas. The test never imports a dialect driver or hardcodes an in-memory database. A successful SQLite run does not verify other dialects.

Continue with [migration assertions](migration.md), or the [server example](../server/routes.md) for application registration and HTTP permissions. Return to [testing and verification](../../testing.md).
